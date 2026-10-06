/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CoursesManager - admin CRUD for academy courses, modules and lessons.
 * Lesson videos are optional: lessons can be created now and get their video URL when it is recorded.
 */

import React, { useMemo, useState } from 'react';
import { Course, Instructor } from '../../types/domain';
import { ImageUploader } from '../common/ImageUploader';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { getAllLessons } from '../../utils/course';
import { toLatinDigits } from '../../shared/digits';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, X, Loader2, Video, GraduationCap } from 'lucide-react';

type Draft = {
  id?: string;
  name: string;
  slug: string;
  summary: string;
  description: string;
  instructorId: string;
  priceToman: string;
  compareAtPriceToman: string;
  level: Course['level'];
  status: Course['status'];
  heroImage: string;
  modules: Array<{ id: string; title: string; lessons: Array<{ id: string; title: string; durationMinutes: string; isPreview: boolean; videoUrl: string }> }>;
};

interface CoursesManagerProps {
  courses: Course[];
  instructors: Instructor[];
  onSaveCourse: (course: any, existingId?: string) => Promise<{ success: boolean; message?: string }>;
  onDeleteCourse: (id: string) => Promise<{ success: boolean; message?: string }>;
}

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
const LEVELS: Course['level'][] = ['مبتدی', 'متوسط', 'پیشرفته', 'جامع و حرفه‌ای'];
const STATUS_LABEL: Record<string, string> = { PUBLISHED: 'منتشرشده', DRAFT: 'پیش‌نویس', ARCHIVED: 'بایگانی‌شده' };
const STATUS_STYLE: Record<string, string> = {
  PUBLISHED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  DRAFT: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  ARCHIVED: 'bg-stone-500/20 text-stone-300 border-stone-500/30',
};

const emptyDraft = (instructorId = ''): Draft => ({
  name: '', slug: '', summary: '', description: '', instructorId, priceToman: '', compareAtPriceToman: '',
  level: 'مبتدی', status: 'DRAFT', heroImage: '', modules: [],
});

const toDraft = (c: Course): Draft => ({
  id: c.id, name: c.name, slug: c.slug, summary: c.summary || '', description: c.description || '', instructorId: c.instructorId || '',
  priceToman: String(c.priceToman ?? ''), compareAtPriceToman: c.compareAtPriceToman ? String(c.compareAtPriceToman) : '',
  level: c.level, status: c.status, heroImage: c.heroImage || '',
  modules: (c.modules || []).map((m) => ({
    id: m.id, title: m.title,
    lessons: (m.lessons || []).map((l) => ({ id: l.id, title: l.title, durationMinutes: String(l.durationMinutes ?? 0), isPreview: !!l.isPreview, videoUrl: l.videoUrl || '' })),
  })),
});

const field = 'w-full p-2.5 bg-[#0a0908] border border-[#26211e] rounded-xl text-sm text-[#f5f4f2] placeholder:text-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40';
const label = 'block text-xs font-semibold text-stone-300 mb-1';

export const CoursesManager: React.FC<CoursesManagerProps> = ({ courses, instructors, onSaveCourse, onDeleteCourse }) => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Course | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const lessonCount = useMemo(() => (d: Draft) => d.modules.reduce((n, m) => n + m.lessons.length, 0), []);

  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const patchModule = (mi: number, p: Partial<Draft['modules'][number]>) =>
    setDraft((d) => d && { ...d, modules: d.modules.map((m, i) => (i === mi ? { ...m, ...p } : m)) });
  const patchLesson = (mi: number, li: number, p: Partial<Draft['modules'][number]['lessons'][number]>) =>
    setDraft((d) => d && { ...d, modules: d.modules.map((m, i) => (i === mi ? { ...m, lessons: m.lessons.map((l, j) => (j === li ? { ...l, ...p } : l)) } : m)) });
  const move = <T,>(arr: T[], i: number, dir: -1 | 1): T[] => {
    const j = i + dir;
    if (j < 0 || j >= arr.length) return arr;
    const copy = [...arr];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  };

  const validate = (d: Draft): string | null => {
    if (d.name.trim().length < 2) return 'نام دوره را وارد کنید.';
    const price = Number(toLatinDigits(d.priceToman));
    if (!Number.isInteger(price) || price < 0) return 'قیمت دوره باید عدد صحیح و حداقل صفر (تومان) باشد.';
    if (d.compareAtPriceToman && (!Number.isInteger(Number(toLatinDigits(d.compareAtPriceToman))) || Number(toLatinDigits(d.compareAtPriceToman)) < price)) {
      return 'قیمت قبل از تخفیف باید عدد صحیح و بزرگ‌تر یا مساوی قیمت فعلی باشد.';
    }
    for (const [mi, m] of d.modules.entries()) {
      if (!m.title.trim()) return `عنوان فصل ${mi + 1} را وارد کنید.`;
      for (const [li, l] of m.lessons.entries()) {
        if (!l.title.trim()) return `عنوان درس ${li + 1} در فصل ${mi + 1} را وارد کنید.`;
        const mins = Number(toLatinDigits(l.durationMinutes || '0'));
        if (!Number.isInteger(mins) || mins < 0 || mins > 600) return `مدت درس «${l.title}» باید بین ۰ تا ۶۰۰ دقیقه باشد.`;
        if (l.videoUrl && !/^https:\/\//.test(l.videoUrl.trim()) && !l.videoUrl.trim().startsWith('/uploads/')) return `آدرس ویدیوی «${l.title}» باید با https شروع شود.`;
      }
    }
    if (d.status === 'PUBLISHED' && lessonCount(d) === 0) return 'برای انتشار، دوره باید حداقل یک درس داشته باشد؛ یا آن را «پیش‌نویس» نگه دارید.';
    return null;
  };

  const handleSave = async () => {
    if (!draft || saving) return;
    const problem = validate(draft);
    setError(problem);
    if (problem) return;
    const payload: any = {
      name: draft.name.trim(),
      ...(draft.slug.trim() ? { slug: draft.slug.trim() } : {}),
      kind: 'ONLINE',
      summary: draft.summary.trim(),
      description: draft.description.trim(),
      ...(draft.instructorId ? { instructorId: draft.instructorId } : {}),
      priceToman: Number(toLatinDigits(draft.priceToman)),
      ...(draft.compareAtPriceToman ? { compareAtPriceToman: Number(toLatinDigits(draft.compareAtPriceToman)) } : {}),
      level: draft.level,
      status: draft.status,
      ...(draft.heroImage ? { heroImage: draft.heroImage.trim() } : {}),
      modules: draft.modules.map((m) => ({
        id: m.id,
        title: m.title.trim(),
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title.trim(),
          durationMinutes: Number(toLatinDigits(l.durationMinutes || '0')),
          isPreview: l.isPreview,
          ...(l.videoUrl.trim() ? { videoUrl: l.videoUrl.trim() } : {}),
        })),
      })),
    };
    payload.durationMinutes = payload.modules.reduce((a: number, m: any) => a + m.lessons.reduce((b: number, l: any) => b + l.durationMinutes, 0), 0);
    setSaving(true);
    const res = await onSaveCourse(payload, draft.id);
    setSaving(false);
    if (res.success) {
      setDraft(null);
      setError(null);
    } else {
      setError(res.message || 'ذخیره دوره انجام نشد.');
    }
  };

  // ------------------------------------------------------------------ LIST
  if (!draft) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#f5f4f2] flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-amber-500" aria-hidden="true" />
              <span>آکادمی و دوره‌ها</span>
            </h2>
            <p className="text-xs text-stone-400 mt-1">دوره‌های منتشرشده بلافاصله در سایت دیده می‌شوند. ویدیوی هر درس را می‌توانید بعداً، پس از ضبط، اضافه کنید.</p>
          </div>
          <button
            type="button"
            onClick={() => { setDraft(emptyDraft(instructors[0]?.id || '')); setError(null); }}
            className="min-h-11 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>دوره جدید</span>
          </button>
        </div>

        {deleteError && <div role="alert" className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">{deleteError}</div>}

        {courses.length === 0 ? (
          <div className="py-16 text-center text-sm text-stone-400 bg-[#141211] rounded-2xl border border-[#26211e]">هنوز دوره‌ای ثبت نشده است.</div>
        ) : (
          <ul className="space-y-3 list-none p-0 m-0">
            {courses.map((c) => {
              const lessons = getAllLessons(c);
              const withVideo = lessons.filter((l) => l.videoUrl).length;
              return (
                <li key={c.id} className="bg-[#141211] border border-[#26211e] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-[#f5f4f2]">{c.name}</h3>
                      <span className={`text-[11px] px-2 py-0.5 rounded-md border font-semibold ${STATUS_STYLE[c.status] || STATUS_STYLE.DRAFT}`}>{STATUS_LABEL[c.status] || c.status}</span>
                    </div>
                    <div className="text-xs text-stone-400 tabular-nums flex flex-wrap gap-x-4 gap-y-1">
                      <span>{c.priceToman.toLocaleString('fa-IR')} تومان</span>
                      <span>{lessons.length.toLocaleString('fa-IR')} درس</span>
                      <span className="inline-flex items-center gap-1"><Video className="w-3 h-3" aria-hidden="true" />{withVideo.toLocaleString('fa-IR')} ویدیو بارگذاری‌شده</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={() => { setDraft(toDraft(c)); setError(null); }} className="min-h-10 px-3 bg-stone-800 hover:bg-stone-700 text-stone-100 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer">
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />ویرایش
                    </button>
                    <button type="button" onClick={() => { setToDelete(c); setDeleteError(null); }} className="min-h-10 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer" aria-label={`حذف ${c.name}`}>
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />حذف
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <ConfirmDialog
          isOpen={!!toDelete}
          danger
          title="حذف دوره"
          message={<>دوره «{toDelete?.name}» برای همیشه حذف می‌شود. اگر این دوره خریدار دارد، حذف انجام نمی‌شود و باید آن را «بایگانی» کنید.</>}
          confirmLabel="حذف دوره"
          onCancel={() => setToDelete(null)}
          onConfirm={async () => {
            if (!toDelete) return;
            const res = await onDeleteCourse(toDelete.id);
            if (!res.success) setDeleteError(res.message || 'حذف دوره انجام نشد.');
            setToDelete(null);
          }}
        />
      </div>
    );
  }

  // ------------------------------------------------------------------ FORM
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[#f5f4f2]">{draft.id ? 'ویرایش دوره' : 'دوره جدید'}</h2>
        <button type="button" onClick={() => setDraft(null)} className="min-h-10 px-3 text-xs text-stone-300 hover:text-white flex items-center gap-1.5 cursor-pointer">
          <X className="w-4 h-4" aria-hidden="true" />بازگشت به فهرست
        </button>
      </div>

      <div className="bg-[#141211] border border-[#26211e] rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="co-name" className={label}>نام دوره</label>
            <input id="co-name" className={field} value={draft.name} onChange={(e) => patch({ name: e.target.value })} maxLength={200} />
          </div>
          <div>
            <label htmlFor="co-price" className={label}>قیمت (تومان)</label>
            <input id="co-price" className={`${field} text-center`} dir="ltr" inputMode="numeric" value={draft.priceToman} onChange={(e) => patch({ priceToman: e.target.value })} />
          </div>
          <div>
            <label htmlFor="co-compare" className={label}>قیمت قبل از تخفیف (اختیاری)</label>
            <input id="co-compare" className={`${field} text-center`} dir="ltr" inputMode="numeric" value={draft.compareAtPriceToman} onChange={(e) => patch({ compareAtPriceToman: e.target.value })} />
          </div>
          <div>
            <label htmlFor="co-level" className={label}>سطح</label>
            <select id="co-level" className={field} value={draft.level} onChange={(e) => patch({ level: e.target.value as Course['level'] })}>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="co-status" className={label}>وضعیت</label>
            <select id="co-status" className={field} value={draft.status} onChange={(e) => patch({ status: e.target.value as Course['status'] })}>
              <option value="DRAFT">پیش‌نویس (در سایت دیده نمی‌شود)</option>
              <option value="PUBLISHED">منتشرشده</option>
              <option value="ARCHIVED">بایگانی‌شده</option>
            </select>
          </div>
          <div>
            <label htmlFor="co-instructor" className={label}>مدرس</label>
            <select id="co-instructor" className={field} value={draft.instructorId} onChange={(e) => patch({ instructorId: e.target.value })}>
              <option value="">— انتخاب نشده —</option>
              {instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="co-slug" className={label}>نشانی کوتاه (اختیاری)</label>
            <input id="co-slug" className={field} dir="ltr" value={draft.slug} onChange={(e) => patch({ slug: e.target.value })} placeholder="خالی = از نام دوره ساخته می‌شود" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="co-summary" className={label}>خلاصه (حداکثر ۵۰۰ حرف)</label>
            <textarea id="co-summary" rows={2} maxLength={500} className={field} value={draft.summary} onChange={(e) => patch({ summary: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="co-desc" className={label}>توضیحات کامل</label>
            <textarea id="co-desc" rows={5} maxLength={5000} className={field} value={draft.description} onChange={(e) => patch({ description: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <ImageUploader value={draft.heroImage} onChange={(url) => patch({ heroImage: url })} label="تصویر شاخص دوره" />
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="bg-[#141211] border border-[#26211e] rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-[#f5f4f2]">سرفصل‌ها و درس‌ها</h3>
          <button type="button" onClick={() => patch({ modules: [...draft.modules, { id: uid('mod'), title: '', lessons: [] }] })} className="min-h-10 px-3 bg-stone-800 hover:bg-stone-700 text-stone-100 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />فصل جدید
          </button>
        </div>

        {draft.modules.length === 0 && <p className="text-xs text-stone-400">هنوز فصلی اضافه نشده است. دوره بدون درس فقط به‌صورت پیش‌نویس ذخیره می‌شود.</p>}

        {draft.modules.map((m, mi) => (
          <fieldset key={m.id} className="border border-[#26211e] rounded-xl p-3 sm:p-4 space-y-3">
            <legend className="px-2 text-xs font-bold text-amber-400">فصل {(mi + 1).toLocaleString('fa-IR')}</legend>
            <div className="flex items-end gap-2">
              <div className="flex-1 min-w-0">
                <label htmlFor={`mod-${m.id}`} className={label}>عنوان فصل</label>
                <input id={`mod-${m.id}`} className={field} value={m.title} onChange={(e) => patchModule(mi, { title: e.target.value })} maxLength={200} />
              </div>
              <button type="button" onClick={() => patch({ modules: move(draft.modules, mi, -1) })} disabled={mi === 0} className="w-10 h-10 shrink-0 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 rounded-lg flex items-center justify-center cursor-pointer" aria-label="انتقال فصل به بالا"><ArrowUp className="w-4 h-4" aria-hidden="true" /></button>
              <button type="button" onClick={() => patch({ modules: move(draft.modules, mi, 1) })} disabled={mi === draft.modules.length - 1} className="w-10 h-10 shrink-0 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 rounded-lg flex items-center justify-center cursor-pointer" aria-label="انتقال فصل به پایین"><ArrowDown className="w-4 h-4" aria-hidden="true" /></button>
              <button type="button" onClick={() => patch({ modules: draft.modules.filter((_, i) => i !== mi) })} className="w-10 h-10 shrink-0 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg flex items-center justify-center cursor-pointer" aria-label={`حذف فصل ${mi + 1}`}><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
            </div>

            {m.lessons.map((l, li) => (
              <div key={l.id} className="bg-[#0a0908] border border-[#26211e] rounded-xl p-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-8">
                    <label htmlFor={`les-t-${l.id}`} className={label}>عنوان درس {(li + 1).toLocaleString('fa-IR')}</label>
                    <input id={`les-t-${l.id}`} className={field} value={l.title} onChange={(e) => patchLesson(mi, li, { title: e.target.value })} maxLength={200} />
                  </div>
                  <div className="sm:col-span-4">
                    <label htmlFor={`les-d-${l.id}`} className={label}>مدت (دقیقه)</label>
                    <input id={`les-d-${l.id}`} className={`${field} text-center`} dir="ltr" inputMode="numeric" value={l.durationMinutes} onChange={(e) => patchLesson(mi, li, { durationMinutes: e.target.value })} />
                  </div>
                  <div className="sm:col-span-12">
                    <label htmlFor={`les-v-${l.id}`} className={label}>آدرس ویدیو (اختیاری — پس از ضبط پر شود)</label>
                    <input id={`les-v-${l.id}`} className={field} dir="ltr" placeholder="https://…" value={l.videoUrl} onChange={(e) => patchLesson(mi, li, { videoUrl: e.target.value })} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer min-h-10">
                    <input type="checkbox" checked={l.isPreview} onChange={(e) => patchLesson(mi, li, { isPreview: e.target.checked })} className="w-4 h-4 accent-amber-500" />
                    پیش‌نمایش رایگان (بدون خرید قابل مشاهده است)
                  </label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => patchModule(mi, { lessons: move(m.lessons, li, -1) })} disabled={li === 0} className="w-10 h-10 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 rounded-lg flex items-center justify-center cursor-pointer" aria-label="انتقال درس به بالا"><ArrowUp className="w-4 h-4" aria-hidden="true" /></button>
                    <button type="button" onClick={() => patchModule(mi, { lessons: move(m.lessons, li, 1) })} disabled={li === m.lessons.length - 1} className="w-10 h-10 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 rounded-lg flex items-center justify-center cursor-pointer" aria-label="انتقال درس به پایین"><ArrowDown className="w-4 h-4" aria-hidden="true" /></button>
                    <button type="button" onClick={() => patchModule(mi, { lessons: m.lessons.filter((_, j) => j !== li) })} className="w-10 h-10 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg flex items-center justify-center cursor-pointer" aria-label={`حذف درس ${li + 1}`}><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
                  </div>
                </div>
              </div>
            ))}

            <button type="button" onClick={() => patchModule(mi, { lessons: [...m.lessons, { id: uid('les'), title: '', durationMinutes: '10', isPreview: false, videoUrl: '' }] })} className="min-h-10 px-3 bg-stone-800 hover:bg-stone-700 text-stone-100 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer">
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />درس جدید
            </button>
          </fieldset>
        ))}
      </div>

      {error && <div role="alert" className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">{error}</div>}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sticky bottom-0 bg-[#0a0908]/90 backdrop-blur py-3">
        <button type="button" onClick={() => setDraft(null)} className="min-h-11 px-5 bg-stone-800 hover:bg-stone-700 text-stone-100 text-sm font-semibold rounded-xl cursor-pointer">انصراف</button>
        <button type="button" onClick={handleSave} disabled={saving} aria-busy={saving} className="min-h-11 px-6 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer">
          {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          {saving ? 'در حال ذخیره…' : 'ذخیره دوره'}
        </button>
      </div>
    </div>
  );
};
