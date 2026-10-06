/**
 * Per-user, per-course learning progress kept in this browser (no server endpoint yet).
 * Keys include the account mobile so two people sharing a device never see each other's progress, and every
 * read is validated against the course's REAL lesson ids so removed/renamed lessons can never push the
 * percentage above 100 or crash the page.
 */
import { safeGetJSON, safeSetJSON } from './safeStorage';
import { CourseLesson } from './course';

export interface CourseProgress {
  completed: Record<string, true>;
  /** Last playback position in seconds per lesson. */
  positions: Record<string, number>;
  lastLessonId?: string;
}

const EMPTY: CourseProgress = { completed: {}, positions: {} };

const progressKey = (mobile: string, courseId: string) => `gisara_progress_v2:${mobile || 'guest'}:${courseId}`;
const notesKey = (mobile: string, courseId: string) => `gisara_notes_v2:${mobile || 'guest'}:${courseId}`;

export function loadProgress(mobile: string, courseId: string, lessons: CourseLesson[]): CourseProgress {
  const raw = safeGetJSON<Partial<CourseProgress> | null>(progressKey(mobile, courseId), null);
  if (!raw || typeof raw !== 'object') return { ...EMPTY, completed: {}, positions: {} };
  const valid = new Set(lessons.map((l) => l.id));
  const completed: Record<string, true> = {};
  const positions: Record<string, number> = {};
  for (const id of Object.keys(raw.completed || {})) if (valid.has(id) && (raw.completed as any)[id]) completed[id] = true;
  for (const [id, sec] of Object.entries(raw.positions || {})) {
    if (valid.has(id) && typeof sec === 'number' && Number.isFinite(sec) && sec >= 0) positions[id] = Math.floor(sec);
  }
  return { completed, positions, lastLessonId: raw.lastLessonId && valid.has(raw.lastLessonId) ? raw.lastLessonId : undefined };
}

export function saveProgress(mobile: string, courseId: string, progress: CourseProgress): void {
  safeSetJSON(progressKey(mobile, courseId), progress);
}

/** 0-100, counting only lessons that currently exist in the course. */
export function progressPercent(progress: CourseProgress, lessons: CourseLesson[]): number {
  if (lessons.length === 0) return 0;
  const done = lessons.filter((l) => progress.completed[l.id]).length;
  return Math.min(100, Math.round((done / lessons.length) * 100));
}

/** Convenience for list cards (account page): percent + the lesson to resume with. */
export function getCourseResume(mobile: string, courseId: string, lessons: CourseLesson[]): { percent: number; resumeLessonId?: string; started: boolean } {
  const p = loadProgress(mobile, courseId, lessons);
  const percent = progressPercent(p, lessons);
  const firstUndone = lessons.find((l) => !p.completed[l.id]);
  return {
    percent,
    started: percent > 0 || Object.keys(p.positions).length > 0,
    resumeLessonId: p.lastLessonId && !p.completed[p.lastLessonId] ? p.lastLessonId : (firstUndone || lessons[0])?.id,
  };
}

export function loadNotes(mobile: string, courseId: string): Record<string, string> {
  const raw = safeGetJSON<Record<string, unknown>>(notesKey(mobile, courseId), {});
  const out: Record<string, string> = {};
  if (raw && typeof raw === 'object') for (const [k, v] of Object.entries(raw)) if (typeof v === 'string') out[k] = v.slice(0, 2000);
  return out;
}

export function saveNotes(mobile: string, courseId: string, notes: Record<string, string>): void {
  safeSetJSON(notesKey(mobile, courseId), notes);
}
