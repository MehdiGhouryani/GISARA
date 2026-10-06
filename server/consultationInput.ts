/**
 * Style-consultation input contract.
 * The storefront sends stable option IDs ("ROUND", "HIGH_FOREHEAD", ...). The expert engine and the LLM prompt
 * work with Persian vocabulary. Before this mapping existed, none of the IDs ever matched, so every
 * consultation silently produced the advice for the default (oval face / medium forehead / plunging neckline).
 */
import type { StylingConsultationParams } from './expertStylingEngine';

export const CONSULTATION_OPTIONS = {
  faceShape: { OVAL: 'بیضی', ROUND: 'گرد', SQUARE: 'مربعی', HEART: 'قلبی', OBLONG: 'کشیده' },
  foreheadHeight: { HIGH_FOREHEAD: 'بلند', BALANCED_FOREHEAD: 'متوسط', SHORT_FOREHEAD: 'کوتاه' },
  hairLength: { SHORT: 'کوتاه', MEDIUM: 'متوسط', LONG: 'بلند' },
  hairDensity: { FINE: 'کم‌پشت و نازک', NORMAL: 'نرمال', THICK: 'پرپشت و ضخیم' },
  hairTexture: { STRAIGHT: 'لخت', WAVY: 'مواج', CURLY: 'فر', BLEACHED: 'دکلره' },
  occasion: { BRIDAL: 'عروس', ENGAGEMENT: 'نامزدی', FORMAL: 'مجلسی', CASUAL: 'روزمره' },
  neckline: { OPEN_DECOLLETE: 'دکلته', BOAT_OFF_SHOULDER: 'قایقی', HIGH_NECK_HIJAB: 'بسته', V_NECK: 'پشت باز' },
  styleVibe: { TEXTURED_ROMANTIC: 'رمانتیک', CLASSIC: 'کلاسیک', HOLLYWOOD: 'هالیوودی', BRAIDED: 'بافت' },
} as const;

export type ConsultationField = keyof typeof CONSULTATION_OPTIONS;

/** Option IDs for one field, usable directly in z.enum(). */
export const optionIds = <F extends ConsultationField>(field: F) =>
  Object.keys(CONSULTATION_OPTIONS[field]) as [string, ...string[]];

/** Translates validated option IDs into the Persian terms the engine and prompt understand. */
export function toEngineParams(input: Partial<Record<ConsultationField, string>>): StylingConsultationParams {
  const out: Record<string, string | undefined> = {};
  for (const field of Object.keys(CONSULTATION_OPTIONS) as ConsultationField[]) {
    const id = input[field];
    out[field] = id ? (CONSULTATION_OPTIONS[field] as Record<string, string>)[id] : undefined;
  }
  return out as StylingConsultationParams;
}
