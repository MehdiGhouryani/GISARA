/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * UsersManager - find a customer by user ID, mobile or name and see their whole status in one place.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ApiClient } from '../../services/apiClient';
import { StatusBadge } from '../common/StatusBadge';
import { Search, Loader2, ArrowRight, Users, Copy, Check } from 'lucide-react';

interface UserSummary {
  userCode: string; name: string; mobile: string; createdAt: string; lastLoginAt: string;
  ordersCount: number; paidOrdersCount: number; totalPaidToman: number; coursesCount: number;
}

const fa = (n: number) => n.toLocaleString('fa-IR');
const date = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('fa-IR') : '—');
const field = 'w-full p-3 bg-[#0a0908] border border-[#26211e] rounded-xl text-sm text-[#f5f4f2] placeholder:text-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40';

export const UsersManager: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [listState, setListState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailState, setDetailState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  const requestSeq = useRef(0);

  // Debounced search; a late answer to an old query never overwrites a newer one.
  useEffect(() => {
    const seq = ++requestSeq.current;
    setListState('loading');
    const t = window.setTimeout(async () => {
      try {
        const res = await ApiClient.searchUsers(query.trim());
        if (seq !== requestSeq.current) return;
        setResults(res.data || []);
        setTotal(res.total ?? (res.data || []).length);
        setListState('ready');
      } catch {
        if (seq === requestSeq.current) setListState('error');
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!selectedCode) { setDetail(null); setDetailState('idle'); return; }
    let cancelled = false;
    setDetailState('loading');
    ApiClient.getUserDetail(selectedCode)
      .then((res) => { if (!cancelled) { setDetail(res.data); setDetailState('idle'); } })
      .catch(() => { if (!cancelled) setDetailState('error'); });
    return () => { cancelled = true; };
  }, [selectedCode]);

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  };

  // ---------------------------------------------------------------- DETAIL
  if (selectedCode) {
    return (
      <div className="space-y-5">
        <button type="button" onClick={() => setSelectedCode(null)} className="min-h-10 text-xs text-stone-300 hover:text-white flex items-center gap-1.5 cursor-pointer">
          <ArrowRight className="w-4 h-4" aria-hidden="true" />بازگشت به نتایج
        </button>

        {detailState === 'loading' && <div className="py-16 flex justify-center text-stone-400" role="status"><Loader2 className="w-6 h-6 animate-spin" aria-label="در حال بارگذاری" /></div>}
        {detailState === 'error' && <div role="alert" className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-sm text-rose-300">دریافت اطلاعات کاربر انجام نشد. دوباره تلاش کنید.</div>}

        {detail && (
          <>
            <div className="bg-[#141211] border border-[#26211e] rounded-2xl p-5 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-bold text-[#f5f4f2]">{detail.name}</h2>
                <button type="button" onClick={() => copy(detail.userCode)} className="min-h-9 px-3 bg-stone-800 hover:bg-stone-700 rounded-lg text-xs font-mono font-bold text-amber-300 inline-flex items-center gap-2 cursor-pointer" aria-label="کپی شناسه کاربری">
                  <bdi dir="ltr">{detail.userCode}</bdi>
                  {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                </button>
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  ['موبایل', <bdi key="m" dir="ltr" className="tabular-nums">{detail.mobile}</bdi>],
                  ['عضویت', date(detail.createdAt)],
                  ['آخرین ورود', date(detail.lastLoginAt)],
                  ['مجموع پرداخت‌ها', `${fa(detail.totalPaidToman)} تومان`],
                ].map(([k, v]) => (
                  <div key={String(k)} className="bg-[#0a0908] rounded-xl p-3"><dt className="text-stone-400">{k}</dt><dd className="mt-1 font-semibold text-[#f5f4f2]">{v}</dd></div>
                ))}
              </dl>
            </div>

            <section className="bg-[#141211] border border-[#26211e] rounded-2xl p-5 space-y-3" aria-labelledby="u-orders">
              <h3 id="u-orders" className="text-sm font-bold text-[#f5f4f2]">سفارش‌ها ({fa(detail.orders.length)})</h3>
              {detail.orders.length === 0 ? <p className="text-xs text-stone-400">سفارشی ثبت نشده است.</p> : (
                <ul className="space-y-2 list-none p-0 m-0">
                  {detail.orders.map((o: any) => (
                    <li key={o.id} className="bg-[#0a0908] rounded-xl p-3 text-xs space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-[#f5f4f2]"><bdi dir="ltr">{o.orderNumber}</bdi></span>
                        <StatusBadge status={o.status} size="sm" />
                      </div>
                      <div className="text-stone-400 tabular-nums flex flex-wrap gap-x-4">
                        <span>{date(o.createdAt)}</span>
                        <span>{fa(o.payableToman)} تومان</span>
                        {o.trackingCode && <span>رهگیری: <bdi dir="ltr">{o.trackingCode}</bdi></span>}
                      </div>
                      <div className="text-stone-300">{o.items.map((i: any) => `${i.title} ×${fa(i.quantity)}`).join('، ')}</div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <section className="bg-[#141211] border border-[#26211e] rounded-2xl p-5 space-y-2" aria-labelledby="u-courses">
                <h3 id="u-courses" className="text-sm font-bold text-[#f5f4f2]">دوره‌های فعال ({fa(detail.courses.length)})</h3>
                {detail.courses.length === 0 ? <p className="text-xs text-stone-400">دوره فعالی ندارد.</p> : (
                  <ul className="text-xs text-stone-200 space-y-1 list-disc ps-5">{detail.courses.map((c: any) => <li key={c.id}>{c.name}</li>)}</ul>
                )}
                {detail.manualEnrollments.length > 0 && (
                  <p className="text-xs text-stone-400 pt-1">دسترسی دستی ثبت‌شده: {fa(detail.manualEnrollments.length)} مورد (فعال‌سازی/لغو از بخش سفارشات)</p>
                )}
              </section>

              <section className="bg-[#141211] border border-[#26211e] rounded-2xl p-5 space-y-2" aria-labelledby="u-req">
                <h3 id="u-req" className="text-sm font-bold text-[#f5f4f2]">درخواست‌های کارگاه ({fa(detail.requests.length)}) و گواهینامه‌ها ({fa(detail.certificates.length)})</h3>
                {detail.requests.length === 0 && detail.certificates.length === 0 ? <p className="text-xs text-stone-400">موردی ثبت نشده است.</p> : (
                  <ul className="text-xs text-stone-200 space-y-1 list-none p-0 m-0">
                    {detail.requests.map((r: any) => <li key={r.id}>درخواست {r.kind === 'JOIN_SESSION' ? 'پیوستن به جلسه' : 'جلسه جدید'} · {date(r.submittedAt)} · <StatusBadge status={r.status} size="sm" /></li>)}
                    {detail.certificates.map((c: any) => <li key={c.certificateCode}>گواهینامه «{c.courseTitle}» (<bdi dir="ltr">{c.certificateCode}</bdi>) · {c.status === 'ISSUED' ? 'صادرشده' : 'ابطال‌شده'}</li>)}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------- SEARCH
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#f5f4f2] flex items-center gap-2"><Users className="w-5 h-5 text-amber-500" aria-hidden="true" /><span>کاربران</span></h2>
        <p className="text-xs text-stone-400 mt-1">با شناسه کاربری (مثل <bdi dir="ltr" className="font-mono">U-7K3QX9PD</bdi>)، شماره موبایل یا نام جست‌وجو کنید.</p>
      </div>

      <div className="relative">
        <label htmlFor="user-search" className="sr-only">جست‌وجوی کاربر</label>
        <Search className="w-4 h-4 text-stone-500 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" aria-hidden="true" />
        <input id="user-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="شناسه، موبایل یا نام…" autoComplete="off" className={`${field} ps-10`} />
      </div>

      {listState === 'loading' && <div className="py-10 flex justify-center text-stone-400" role="status"><Loader2 className="w-5 h-5 animate-spin" aria-label="در حال جست‌وجو" /></div>}
      {listState === 'error' && <div role="alert" className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-sm text-rose-300">جست‌وجو انجام نشد. اتصال را بررسی و دوباره تلاش کنید.</div>}

      {listState === 'ready' && (results.length === 0 ? (
        <div className="py-12 text-center text-sm text-stone-400 bg-[#141211] rounded-2xl border border-[#26211e]">{query ? 'کاربری با این مشخصات پیدا نشد.' : 'هنوز کاربری ثبت نشده است.'}</div>
      ) : (
        <>
          <p className="text-xs text-stone-400" aria-live="polite">{fa(total)} کاربر{total > results.length ? ` (۵۰ مورد اول نمایش داده می‌شود؛ جست‌وجو را دقیق‌تر کنید)` : ''}</p>
          <ul className="space-y-2 list-none p-0 m-0">
            {results.map((u) => (
              <li key={u.userCode}>
                <button type="button" onClick={() => setSelectedCode(u.userCode)} className="w-full text-start bg-[#141211] hover:bg-[#1a1716] border border-[#26211e] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer transition-colors">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#f5f4f2] break-words">{u.name}</div>
                    <div className="text-xs text-stone-400 mt-0.5 flex flex-wrap gap-x-4">
                      <bdi dir="ltr" className="font-mono text-amber-300">{u.userCode}</bdi>
                      <bdi dir="ltr" className="tabular-nums">{u.mobile}</bdi>
                    </div>
                  </div>
                  <div className="text-xs text-stone-300 tabular-nums flex gap-4">
                    <span>{fa(u.ordersCount)} سفارش</span>
                    <span>{fa(u.coursesCount)} دوره</span>
                    <span>{fa(u.totalPaidToman)} تومان</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </>
      ))}
    </div>
  );
};
