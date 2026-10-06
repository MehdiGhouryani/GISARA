import { z } from 'zod';
import { sanitizeInput } from './security';
import { normalizeMobile, normalizePostalCode, toLatinDigits } from '../src/shared/digits';
import { parseJalaliDate } from './jalali';

/** Wraps sanitizeInput so a schema field is both typed AND XSS-sanitized in one step. */
const text = (min = 0, max = 500) => z.string().trim().min(min).max(max).transform(sanitizeInput);
const optionalText = (max = 2000) => z.string().trim().max(max).transform(sanitizeInput).optional();
const money = z.number().finite().min(0).max(1_000_000_000);
const percent = z.number().finite().min(0).max(100);
const nonNegInt = z.number().int().min(0).max(1_000_000);
const httpsOrInternalUrl = z.string().trim().refine(
  (v) => /^https:\/\//.test(v) || v.startsWith('/uploads/') || v.startsWith('/assets/'),
  { message: 'آدرس باید https باشد یا مسیر داخلی سایت (/uploads/ یا /assets/) باشد.' }
);


/** Required, trimmed, sanitized text with Persian error messages (zod defaults are English). */
const fieldText = (label: string, min: number, max: number) =>
  z.string({ required_error: `${label} الزامی است.`, invalid_type_error: `${label} نامعتبر است.` })
    .trim()
    .min(min, { message: `${label} را کامل وارد کنید.` })
    .max(max, { message: `${label} بیش از حد طولانی است.` })
    .transform(sanitizeInput);

/** Delivery details for orders that contain physical goods. Digits are normalised (Persian -> Latin). */
export const shippingInfoSchema = z.object({
  recipientName: fieldText('نام و نام خانوادگی گیرنده', 2, 100),
  recipientMobile: z.string({ required_error: 'شماره موبایل گیرنده الزامی است.', invalid_type_error: 'شماره موبایل گیرنده نامعتبر است.' })
    .transform(normalizeMobile)
    .refine((v) => v !== '', { message: 'شماره موبایل گیرنده معتبر نیست (مثال: ۰۹۱۲۱۲۳۴۵۶۷).' }),
  province: fieldText('استان', 2, 50),
  city: fieldText('شهر', 2, 50),
  addressLine: fieldText('نشانی کامل پستی', 10, 300),
  postalCode: z.string({ required_error: 'کد پستی الزامی است.', invalid_type_error: 'کد پستی نامعتبر است.' })
    .transform(normalizePostalCode)
    .refine((v) => v !== '', { message: 'کد پستی باید ۱۰ رقم باشد.' })
});

export const productCreateSchema = z.object({
  name: text(1, 200),
  slug: text(1, 200).optional(),
  category: text(1, 100).optional(),
  brand: text(1, 100).optional(),
  priceToman: money,
  compareAtPriceToman: money.optional(),
  sku: text(1, 60).optional(),
  stock: nonNegInt.optional(),
  image: httpsOrInternalUrl.optional(),
  images: z.array(httpsOrInternalUrl).max(20).optional(),
  summary: optionalText(500),
  description: optionalText(5000),
  specifications: z.record(z.string().max(100)).optional(),
  status: z.enum(['PUBLISHED', 'DRAFT', 'DISCONTINUED']).optional()
});
export const productUpdateSchema = productCreateSchema.partial();

export const styleCreateSchema = z.object({
  name: text(1, 200),
  slug: text(1, 200),
  primaryImage: httpsOrInternalUrl.optional(),
  summary: optionalText(500),
  description: optionalText(5000),
  occasion: text(1, 60).optional(),
  difficulty: z.enum(['ساده', 'متوسط', 'دشوار']).optional(),
  approxMinutes: z.number().int().min(1).max(600).optional(),
  status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).optional(),
  techniqueIds: z.array(z.string().max(100)).max(50).optional(),
  productIds: z.array(z.string().max(100)).max(50).optional(),
  courseId: z.string().max(100).optional()
});
export const styleUpdateSchema = styleCreateSchema.partial();

const lessonSchema = z.object({
  id: z.string().trim().min(1).max(100),
  title: text(1, 200),
  durationMinutes: z.number().int().min(0).max(600).optional(),
  isPreview: z.boolean().optional(),
  videoUrl: httpsOrInternalUrl.optional()
});
const moduleSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  title: text(1, 200).optional(),
  lessons: z.array(lessonSchema).max(100)
});

const courseShape = {
  name: text(1, 200),
  slug: text(1, 200).optional(),
  kind: z.enum(['WORKSHOP', 'ONLINE']).optional(),
  summary: optionalText(500),
  description: optionalText(5000),
  instructorId: z.string().max(100).optional(),
  priceToman: money,
  compareAtPriceToman: money.optional(),
  level: z.enum(['مبتدی', 'متوسط', 'پیشرفته', 'جامع و حرفه‌ای']).optional(),
  durationMinutes: z.number().int().min(0).max(100_000).optional(),
  status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).optional(),
  heroImage: httpsOrInternalUrl.optional(),
  previewVideoUrl: httpsOrInternalUrl.optional(),
  prerequisites: z.array(text(1, 200)).max(30).optional(),
  targetAudience: z.array(text(1, 200)).max(30).optional(),
  modules: z.array(moduleSchema).max(100).default([])
};

/** Cross-field rules shared by create and update. */
export function courseRuleIssues(data: { status?: string; modules?: Array<{ lessons: Array<{ id?: string }> }> }): string[] {
  const issues: string[] = [];
  if (!data.modules) return issues;
  const lessons = data.modules.flatMap((m) => m.lessons || []);
  if (data.status === 'PUBLISHED' && lessons.length === 0) {
    issues.push('دوره منتشرشده باید حداقل یک درس داشته باشد؛ ابتدا درس اضافه کنید یا وضعیت را «پیش‌نویس» بگذارید.');
  }
  const seen = new Set<string>();
  for (const l of lessons) {
    if (!l.id) continue;
    if (seen.has(l.id)) {
      issues.push(`شناسه درس «${l.id}» تکراری است؛ هر درس باید شناسه یکتا داشته باشد.`);
      break;
    }
    seen.add(l.id);
  }
  return issues;
}

const applyCourseRules = (data: any, ctx: z.RefinementCtx) => {
  for (const message of courseRuleIssues(data)) ctx.addIssue({ code: z.ZodIssueCode.custom, message });
};

export const courseCreateSchema = z.object(courseShape).superRefine(applyCourseRules);
export const courseUpdateSchema = z.object(courseShape).partial().superRefine(applyCourseRules);

export const couponCreateSchema = z.object({
  code: z.string().trim().min(3).max(30).regex(/^[A-Za-z0-9-]+$/, 'کد فقط می‌تواند شامل حروف انگلیسی، عدد و خط تیره باشد.'),
  discountPercent: percent,
  maxDiscountToman: money.optional(),
  minOrderToman: money.optional(),
  description: optionalText(300),
  usageLimit: z.number().int().min(1).max(1_000_000).optional(),
  isActive: z.boolean().optional(),
  expiresAtJalali: z.string().trim().transform(toLatinDigits).refine((v) => /^\d{4}\/\d{2}\/\d{2}$/.test(v) && parseJalaliDate(v) !== null, { message: 'تاریخ انقضا باید به فرمت دقیق ۱۴۰۵/۱۲/۲۹ و معتبر باشد.' }).optional()
});
export const couponUpdateSchema = couponCreateSchema.partial();

export const certificateCreateSchema = z.object({
  studentName: text(1, 150),
  studentMobile: z.string().trim().regex(/^09[0-9]{9}$/, 'شماره موبایل معتبر نیست.'),
  courseTitle: text(1, 200),
  courseId: z.string().max(100).optional(),
  instructorName: text(1, 150).optional(),
  hoursCount: z.number().int().min(1).max(2000).optional(),
  grade: z.enum(['عالی', 'خیلی خوب', 'خوب', 'قبول']).optional()
});

/**
 * Validates req.body against `schema`; on failure returns 400 with the first
 * few field errors (Persian) and never calls the handler. On success replaces
 * req.body with the parsed (typed, sanitized, defaulted) value.
 */
export function validateBody(schema: z.ZodTypeAny) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.slice(0, 10).map((i) => `${i.path.join('.') || 'body'}: ${i.message}`);
      return res.status(400).json({ success: false, message: 'داده‌های ارسالی نامعتبر است.', errors });
    }
    req.body = result.data;
    next();
  };
}

export const settingsUpdateSchema = z.object({
  payment: z.object({
    provider: z.enum(['zarinpal', 'mock']).optional(),
    merchantId: z.string().trim().max(100).optional(),
    sandbox: z.boolean().optional()
  }).optional(),
  sms: z.object({
    provider: z.enum(['kavenegar', 'farazsms', 'mock']).optional(),
    apiKey: z.string().trim().max(300).optional(),
    patternCode: z.string().trim().max(100).optional()
  }).optional()
});

export const workshopRequestSchema = z.object({
  fullName: text(2, 100),
  mobile: z.string().trim().regex(/^09[0-9]{9}$/, 'شماره موبایل معتبر نیست.'),
  cityId: z.string().trim().min(1).max(100),
  kind: z.enum(['JOIN_SESSION', 'REQUEST_NEW_SESSION']).optional(),
  sessionId: z.string().trim().max(100).optional(),
  courseId: z.string().trim().max(100).optional(),
  experienceLevel: z.enum(['مبتدی', 'آرایشگر نوپا', 'مدرس و حرفه‌ای']).optional(),
  participantCount: z.number().int().min(1).max(50).optional(),
  preferredDays: optionalText(200),
  notes: optionalText(1000)
});

// Short free-text fields interpolated into an LLM prompt: cap length hard so the
// endpoint cannot be used to smuggle long injected instructions or burn tokens.
const aiField = z.string().trim().max(60).transform(sanitizeInput).optional();
export const aiConsultationSchema = z.object({
  faceShape: aiField, foreheadHeight: aiField, hairLength: aiField, hairDensity: aiField,
  hairTexture: aiField, occasion: aiField, neckline: aiField, styleVibe: aiField
});

export const articleCreateSchema = z.object({
  title: text(1, 200),
  slug: text(1, 200).optional(),
  category: z.enum(['مراقبت از مو', 'آموزش تخصصی', 'ترندهای فصل', 'راهنمای خرید']),
  summary: optionalText(500),
  content: optionalText(50000),
  readTimeMinutes: z.number().int().min(1).max(120).optional(),
  publishedAt: text(1, 40).optional(),
  author: z.object({
    name: text(1, 100),
    role: text(1, 100),
    avatar: httpsOrInternalUrl.optional()
  }).optional(),
  heroImage: httpsOrInternalUrl.optional(),
  relatedStyleIds: z.array(z.string().max(100)).max(20).optional(),
  relatedProductIds: z.array(z.string().max(100)).max(20).optional(),
  relatedCourseId: z.string().max(100).optional()
});
export const articleUpdateSchema = articleCreateSchema.partial();

export const techniqueCreateSchema = z.object({
  name: text(1, 200),
  slug: text(1, 200).optional(),
  summary: optionalText(500),
  steps: z.array(z.object({
    number: z.number().int(),
    title: text(1, 200),
    description: optionalText(1000),
    tip: optionalText(500).optional()
  })).max(50).optional(),
  commonMistakes: z.array(z.string().max(300)).max(20).optional(),
  videoThumbnail: httpsOrInternalUrl.optional(),
  videoDurationMinutes: z.number().int().min(1).max(300).optional(),
  difficulty: z.enum(['مبتدی', 'متوسط', 'پیشرفته']),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  toolIds: z.array(z.string().max(100)).max(20).optional(),
  courseId: z.string().max(100).optional(),
  styleIds: z.array(z.string().max(100)).max(20).optional()
});
export const techniqueUpdateSchema = techniqueCreateSchema.partial();

export const sessionCreateSchema = z.object({
  courseId: z.string().min(1).max(100),
  courseName: text(1, 200),
  cityId: z.string().min(1).max(100),
  cityName: text(1, 100),
  instructorId: z.string().min(1).max(100),
  instructorName: text(1, 100),
  instructorPortrait: httpsOrInternalUrl.optional(),
  slug: text(1, 200).optional(),
  venueName: text(1, 200),
  venueAddress: text(1, 500),
  dateJalali: text(1, 40),
  timeSlot: text(1, 100),
  capacity: z.number().int().min(1).max(1000),
  registeredCount: z.number().int().min(0).max(1000).optional(),
  priceToman: money,
  status: z.enum(['DRAFT', 'OPEN', 'FULL', 'COMPLETED', 'CANCELLED']).optional()
});
export const sessionUpdateSchema = sessionCreateSchema.partial();

