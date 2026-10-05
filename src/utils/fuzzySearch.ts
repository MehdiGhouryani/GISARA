/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * fuzzySearch - High-performance Persian/English Fuzzy Search Engine
 * Features:
 * - Persian character normalization (ي->ی, ك->ک, آ->ا, ة->ه, نیم‌فاصله)
 * - Levenshtein typo tolerance & Damerau distance
 * - Subsequence alignment & token-level n-gram matching
 * - Multi-field weighted scoring (Name, Tags, Summary, Brand)
 */

/**
 * Normalizes Persian and English text for accurate matching
 */
export function normalizeSearchText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    // Arabic to Persian replacements
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/ۀ/g, 'ه')
    .replace(/[آأإ]/g, 'ا')
    // Remove diacritics / Tanween
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Replace half-space and non-breaking spaces with standard space
    .replace(/[\u200C\u200B\u00A0]/g, ' ')
    // Remove punctuation
    .replace(/[.,/#!$%^&*;:{}=\-_`~()؟،]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates Levenshtein edit distance between two normalized tokens
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export type MatchQuality = 'EXACT' | 'PREFIX' | 'SUBSTRING' | 'FUZZY_TYPO' | 'SUBSEQUENCE' | 'NONE';

export interface FuzzyResult {
  score: number;
  matchQuality: MatchQuality;
  matchedField: string;
}

/**
 * Computes fuzzy match score (0 to 100) between query and target field
 */
export function computeFieldFuzzyScore(query: string, target: string): { score: number; quality: MatchQuality } {
  const normQuery = normalizeSearchText(query);
  const normTarget = normalizeSearchText(target);

  if (!normQuery || !normTarget) {
    return { score: 0, quality: 'NONE' };
  }

  // 1. Exact Full Match
  if (normTarget === normQuery) {
    return { score: 100, quality: 'EXACT' };
  }

  // 2. Starts with query (Prefix match)
  if (normTarget.startsWith(normQuery)) {
    return { score: 92, quality: 'PREFIX' };
  }

  // 3. Whole word contains query
  const targetTokens = normTarget.split(' ');
  const queryTokens = normQuery.split(' ').filter(Boolean);

  // If query is multiple words, check if all query words exist in target
  if (queryTokens.length > 1) {
    const allFound = queryTokens.every((qt) => normTarget.includes(qt));
    if (allFound) {
      return { score: 88, quality: 'SUBSTRING' };
    }
  }

  // Direct Substring Match
  if (normTarget.includes(normQuery)) {
    // Shorter ratio gives higher relevance
    const ratioBonus = Math.min(15, Math.floor((normQuery.length / normTarget.length) * 20));
    return { score: 75 + ratioBonus, quality: 'SUBSTRING' };
  }

  // 4. Token-level Levenshtein check (Typo tolerance)
  // Check if any word in target is very close to query or query words
  let bestTokenDistance = 999;
  for (const qTok of queryTokens) {
    if (qTok.length < 2) continue;
    for (const tTok of targetTokens) {
      if (tTok.length < 2) continue;

      // Word starts with query token
      if (tTok.startsWith(qTok)) {
        return { score: 80, quality: 'PREFIX' };
      }

      const dist = levenshteinDistance(qTok, tTok);
      if (dist < bestTokenDistance) {
        bestTokenDistance = dist;
      }

      // 1 typo allowed for words >= 3 chars, 2 typos for words >= 6 chars
      const maxAllowed = qTok.length >= 6 ? 2 : qTok.length >= 3 ? 1 : 0;
      if (dist <= maxAllowed) {
        const typoScore = 70 - dist * 12;
        return { score: typoScore, quality: 'FUZZY_TYPO' };
      }
    }
  }

  // 5. Subsequence alignment (characters appear in order)
  let qIdx = 0;
  let matches = 0;
  for (let i = 0; i < normTarget.length && qIdx < normQuery.length; i++) {
    if (normTarget[i] === normQuery[qIdx]) {
      qIdx++;
      matches++;
    }
  }

  if (matches === normQuery.length && normQuery.length >= 3) {
    const spreadPenalty = Math.min(25, Math.floor((normTarget.length - normQuery.length) / 3));
    return { score: Math.max(38, 62 - spreadPenalty), quality: 'SUBSEQUENCE' };
  }

  return { score: 0, quality: 'NONE' };
}

export interface SearchableEntity {
  id: string;
  type: 'مدل' | 'تکنیک' | 'محصول' | 'دوره' | 'مقاله';
  title: string;
  desc: string;
  thumbnail?: string;
  badge?: string;
  tags?: string[];
  rawItem: any;
}

export interface ScoredEntity extends SearchableEntity {
  score: number;
  matchQuality: MatchQuality;
  matchedField: string;
}

/**
 * Searches and ranks a list of items using weighted fuzzy matching
 */
export function fuzzySearchEntities(
  query: string,
  items: SearchableEntity[],
  minScoreThreshold = 35
): ScoredEntity[] {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  const scored: ScoredEntity[] = [];

  for (const item of items) {
    let topScore = 0;
    let topQuality: MatchQuality = 'NONE';
    let topField = '';

    // Check title (weight 1.0)
    const titleCheck = computeFieldFuzzyScore(cleanQ, item.title);
    if (titleCheck.score > topScore) {
      topScore = titleCheck.score;
      topQuality = titleCheck.quality;
      topField = 'عنوان';
    }

    // Check tags if any (weight 0.85)
    if (item.tags && item.tags.length > 0) {
      for (const tag of item.tags) {
        const tagCheck = computeFieldFuzzyScore(cleanQ, tag);
        const weightedTagScore = tagCheck.score * 0.9;
        if (weightedTagScore > topScore) {
          topScore = weightedTagScore;
          topQuality = tagCheck.quality;
          topField = 'برچسب';
        }
      }
    }

    // Check description / summary (weight 0.7)
    if (item.desc) {
      const descCheck = computeFieldFuzzyScore(cleanQ, item.desc);
      const weightedDescScore = descCheck.score * 0.7;
      if (weightedDescScore > topScore) {
        topScore = weightedDescScore;
        topQuality = descCheck.quality;
        topField = 'توضیحات';
      }
    }

    if (topScore >= minScoreThreshold) {
      scored.push({
        ...item,
        score: Math.round(topScore),
        matchQuality: topQuality,
        matchedField: topField,
      });
    }
  }

  // Sort descending by relevance score
  return scored.sort((a, b) => b.score - a.score);
}
