/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BackendDiagnosticTool - Full-Stack Endpoint Connection & Schema Inspector
 * Tests live backend endpoints against mock fallbacks, detects HTML-in-JSON errors (404/500 SPA catch-alls),
 * and validates HTTP response status, Content-Type, latency, and payload payloads.
 */

import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Server,
  Code2,
  ShieldAlert,
  ArrowRightLeft,
  FileCode,
  Globe,
  Clock,
  Database,
  Lock,
  Terminal,
  Download,
  Upload
} from 'lucide-react';
import { ApiClient } from '../../services/apiClient';
import { OfflineQueueService } from '../../utils/offlineQueue';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface TestResult {
  endpoint: string;
  name: string;
  method: 'GET' | 'POST';
  status: number | null;
  statusText: string;
  latencyMs: number;
  contentType: string;
  isJson: boolean;
  isHtml: boolean;
  liveData: any;
  rawTextSnippet: string;
  error?: string;
  fallbackData: any;
  matchedFallback: boolean;
  timestamp: string;
}

const TEST_ENDPOINTS: Array<{ name: string; endpoint: string; method: 'GET' | 'POST'; fallback: any }> = [
  {
    name: 'تست سلامت سرور (Health Check)',
    endpoint: '/api/health',
    method: 'GET',
    fallback: { success: true, message: 'GisAra Core Backend is fully operational.' }
  },
  {
    name: 'استعلام نشست جاری (Auth Me)',
    endpoint: '/api/auth/me',
    method: 'GET',
    fallback: { success: false, message: 'کاربر احراز هویت نشده است.' }
  },
  {
    name: 'کاتالوگ محصولات (Products)',
    endpoint: '/api/products',
    method: 'GET',
    fallback: [{ id: 'prod-1', name: 'شانه پوش نسوز', priceToman: 185000 }]
  },
  {
    name: 'ژورنال مدل‌های شینیون (Styles)',
    endpoint: '/api/styles',
    method: 'GET',
    fallback: [{ id: 'style-1', title: 'شینیون خطی فرانسوی' }]
  },
  {
    name: 'لیست دوره‌های آموزشی (Courses)',
    endpoint: '/api/courses',
    method: 'GET',
    fallback: [{ id: 'course-1', title: 'دوره جامع شینیون عروس' }]
  },
  {
    name: 'درخواست‌های ورکشاپ (/api/requests)',
    endpoint: '/api/requests',
    method: 'GET',
    fallback: []
  },
  {
    name: 'لاگ‌های امنیتی (/api/admin/audit-logs)',
    endpoint: '/api/admin/audit-logs',
    method: 'GET',
    fallback: []
  },
  {
    name: 'آمار و آنالیتیکس ادمین (/api/admin/analytics)',
    endpoint: '/api/admin/analytics',
    method: 'GET',
    fallback: { totalSales: 0, paidOrdersCount: 0 }
  },
  {
    name: 'ژورنال مقالات (/api/articles)',
    endpoint: '/api/articles',
    method: 'GET',
    fallback: []
  },
  {
    name: 'تکنیک‌های آموزشی (/api/techniques)',
    endpoint: '/api/techniques',
    method: 'GET',
    fallback: []
  }
];

export const BackendDiagnosticTool: React.FC = () => {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>(TEST_ENDPOINTS[0].endpoint);

  // Backup / restore
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupNote, setBackupNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [pendingRestore, setPendingRestore] = useState<{ fileName: string; payload: any; counts: Array<[string, number]>; unknown: string[] } | null>(null);
  const [restoreResult, setRestoreResult] = useState<{ restored: Record<string, number>; ignored: string[]; snapshot: string } | null>(null);

  const COLLECTION_LABELS: Record<string, string> = {
    styles: 'مدل‌های مو', techniques: 'تکنیک‌ها', articles: 'مقالات', products: 'محصولات', courses: 'دوره‌ها', orders: 'سفارش‌ها',
    requests: 'درخواست‌های کارگاه', instructors: 'مدرس‌ها', cities: 'شهرها', sessions: 'جلسات', coupons: 'کدهای تخفیف',
    certificates: 'گواهینامه‌ها', manualEnrollments: 'دسترسی‌های دستی', paymentIntents: 'تراکنش‌های پرداخت', users: 'کاربران', auditLogs: 'گزارش رخدادها'
  };

  const downloadBackup = async () => {
    setBackupBusy(true);
    setBackupNote(null);
    try {
      const dbData = await ApiClient.exportDbBackup();
      const blob = new Blob([JSON.stringify(dbData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gisara_db_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupNote({ ok: true, text: 'فایل پشتیبان دانلود شد. کلیدهای درگاه و پیامک عمداً در آن قرار داده نمی‌شوند.' });
    } catch {
      setBackupNote({ ok: false, text: 'دانلود فایل پشتیبان انجام نشد. دوباره تلاش کنید.' });
    } finally {
      setBackupBusy(false);
    }
  };

  const chooseRestoreFile = async (file: File) => {
    setBackupNote(null);
    setRestoreResult(null);
    try {
      const payload = JSON.parse(await file.text());
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('bad');
      const counts = Object.entries(payload)
        .filter(([, v]) => Array.isArray(v))
        .map(([k, v]) => [k, (v as any[]).length] as [string, number]);
      if (counts.length === 0) throw new Error('empty');
      setPendingRestore({ fileName: file.name, payload, counts, unknown: Object.keys(payload).filter((k) => !(k in COLLECTION_LABELS)) });
    } catch {
      setBackupNote({ ok: false, text: 'فایل انتخاب‌شده یک پشتیبان JSON معتبر نیست.' });
    }
  };

  const confirmRestore = async () => {
    if (!pendingRestore) return;
    try {
      const res: any = await ApiClient.importDbBackup(pendingRestore.payload);
      setRestoreResult({ restored: res?.restored || {}, ignored: res?.ignoredCollections || [], snapshot: res?.previousStateSnapshot || '' });
      setBackupNote({ ok: true, text: 'بازیابی انجام شد.' });
    } catch (err: any) {
      const first = err?.data?.errors?.[0];
      setBackupNote({ ok: false, text: `${err?.message || 'بازیابی انجام نشد.'}${first ? ` (${first})` : ''} هیچ تغییری اعمال نشد.` });
    } finally {
      setPendingRestore(null);
    }
  };

  const testSingleEndpoint = async (target: typeof TEST_ENDPOINTS[0]): Promise<TestResult> => {
    setTestingEndpoint(target.endpoint);
    const startTime = performance.now();

    let status: number | null = null;
    let statusText = '';
    let contentType = '';
    let isJson = false;
    let isHtml = false;
    let liveData: any = null;
    let rawTextSnippet = '';
    let error: string | undefined = undefined;

    try {
      const response = await fetch(target.endpoint, {
        method: target.method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);

      status = response.status;
      statusText = response.statusText;
      contentType = response.headers.get('content-type') || '';

      const text = await response.text();
      rawTextSnippet = text.slice(0, 300);

      if (contentType.includes('application/json') || (text.trim().startsWith('{') || text.trim().startsWith('['))) {
        try {
          liveData = JSON.parse(text);
          isJson = true;
        } catch {
          isJson = false;
        }
      }

      if (text.trim().toLowerCase().startsWith('<!doctype html') || text.trim().toLowerCase().startsWith('<html')) {
        isHtml = true;
      }

      const res: TestResult = {
        endpoint: target.endpoint,
        name: target.name,
        method: target.method,
        status,
        statusText,
        latencyMs,
        contentType,
        isJson,
        isHtml,
        liveData,
        rawTextSnippet,
        error,
        fallbackData: target.fallback,
        matchedFallback: JSON.stringify(liveData) === JSON.stringify(target.fallback),
        timestamp: new Date().toLocaleTimeString('fa-IR')
      };

      setResults((prev) => ({ ...prev, [target.endpoint]: res }));
      setTestingEndpoint(null);
      return res;
    } catch (err: any) {
      const endTime = performance.now();
      const res: TestResult = {
        endpoint: target.endpoint,
        name: target.name,
        method: target.method,
        status: 0,
        statusText: 'Network Error',
        latencyMs: Math.round(endTime - startTime),
        contentType: '',
        isJson: false,
        isHtml: false,
        liveData: null,
        rawTextSnippet: err?.message || 'درخواست شبکه با خطا مواجه شد.',
        error: err?.message || 'Network Fetch Failed',
        fallbackData: target.fallback,
        matchedFallback: false,
        timestamp: new Date().toLocaleTimeString('fa-IR')
      };

      setResults((prev) => ({ ...prev, [target.endpoint]: res }));
      setTestingEndpoint(null);
      return res;
    }
  };

  const runAllDiagnostics = async () => {
    setIsTestingAll(true);
    for (const target of TEST_ENDPOINTS) {
      await testSingleEndpoint(target);
    }
    setIsTestingAll(false);
  };

  const activeResult = results[selectedEndpoint];
  const activeEndpointObj = TEST_ENDPOINTS.find((e) => e.endpoint === selectedEndpoint);

  const totalTested = Object.keys(results).length;
  const jsonSuccessCount = Object.values(results).filter((r) => r.isJson && (r.status === 200 || r.status === 201)).length;
  const htmlErrorCount = Object.values(results).filter((r) => r.isHtml).length;
  const authProtectedCount = Object.values(results).filter((r) => r.status === 401 || r.status === 403).length;

  return (
    <div className="space-y-6 dir-rtl text-right">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-amber-100 rounded-2xl p-6 shadow-xl border border-stone-700/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 text-amber-400">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
                ابزار عیب‌یابی و تست اتصال به بک‌اند (Backend Diagnostics)
              </h2>
              <p className="text-sm text-stone-400 mt-1">
                بررسی لایو تمام API مسیرها، تشخیص پاسخ‌های HTML ناشی از ۴۰۴، و مقایسه پاسخ واقعی سرور با Fallback
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={runAllDiagnostics}
              disabled={isTestingAll}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 text-stone-950 font-bold rounded-xl transition-all shadow-md active:scale-95 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isTestingAll ? 'animate-spin' : ''}`} />
              {isTestingAll ? 'در حال تست همزمان مسیرها...' : 'اجرای تست تمام مسیرها'}
            </button>
          </div>
        </div>

        {/* Backup & restore: destructive tools live apart from the read-only connectivity checks */}
        <section aria-labelledby="backup-title" className="mt-5 rounded-xl bg-stone-950/50 border border-stone-700/50 p-4 space-y-3">
          <h3 id="backup-title" className="text-sm font-bold text-stone-100">پشتیبان‌گیری و بازیابی</h3>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={downloadBackup} disabled={backupBusy} aria-busy={backupBusy} className="min-h-10 flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-60 text-stone-200 text-xs font-medium rounded-xl border border-stone-700 transition-colors cursor-pointer">
              <Download className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              دانلود پشتیبان
            </button>
            <label className="min-h-10 flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-xl border border-stone-700 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              انتخاب فایل برای بازیابی
              <input type="file" accept=".json,application/json" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) chooseRestoreFile(f); }} />
            </label>
          </div>
          {backupNote && <p role={backupNote.ok ? 'status' : 'alert'} className={`text-xs ${backupNote.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{backupNote.text}</p>}
          {restoreResult && (
            <div role="status" className="text-xs text-stone-200 space-y-1 bg-stone-900 rounded-lg p-3">
              <div className="font-bold text-emerald-300">بازیابی‌شده: {Object.entries(restoreResult.restored).map(([k, v]) => `${COLLECTION_LABELS[k] || k} (${v.toLocaleString('fa-IR')})`).join('، ') || '—'}</div>
              {restoreResult.ignored.length > 0 && <div className="text-amber-300">نادیده گرفته‌شده: {restoreResult.ignored.map((k) => COLLECTION_LABELS[k] || k).join('، ')}</div>}
              {restoreResult.snapshot && <div className="text-stone-400">نسخه قبل از بازیابی ذخیره شد: <bdi dir="ltr" className="font-mono">{restoreResult.snapshot}</bdi></div>}
              <button type="button" onClick={() => window.location.reload()} className="mt-1 min-h-9 px-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg cursor-pointer">بارگذاری مجدد صفحه</button>
            </div>
          )}
        </section>

        <ConfirmDialog
          isOpen={!!pendingRestore}
          danger
          title="بازیابی دیتابیس از فایل"
          message={pendingRestore && (
            <div className="space-y-2">
              <p>فایل «{pendingRestore.fileName}» شامل این بخش‌هاست و جایگزین اطلاعات فعلی همین بخش‌ها می‌شود:</p>
              <ul className="list-disc ps-5 text-xs">{pendingRestore.counts.map(([k, n]) => <li key={k}>{COLLECTION_LABELS[k] || k}: {n.toLocaleString('fa-IR')} مورد</li>)}</ul>
              {pendingRestore.unknown.length > 0 && <p className="text-xs">بخش‌های ناشناخته (نادیده گرفته می‌شوند): {pendingRestore.unknown.join('، ')}</p>}
              <p className="text-xs">پیش از اعمال، یک نسخه از وضعیت فعلی ذخیره می‌شود.</p>
            </div>
          )}
          confirmLabel="بازیابی کن"
          requirePhrase="بازیابی"
          onCancel={() => setPendingRestore(null)}
          onConfirm={confirmRestore}
        />

        {/* Quick Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mt-6 pt-6 border-t border-stone-700/50">
          <div className="bg-stone-800/80 rounded-xl p-3 border border-stone-700">
            <div className="text-xs text-stone-400">تعداد کل مسیرها</div>
            <div className="text-xl font-black text-stone-200 mt-1">{totalTested} از {TEST_ENDPOINTS.length}</div>
          </div>

          <div className="bg-stone-800/80 rounded-xl p-3 border border-emerald-900/50">
            <div className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> پاسخ JSON موفق
            </div>
            <div className="text-xl font-black text-emerald-400 mt-1">{jsonSuccessCount}</div>
          </div>

          <div className="bg-stone-800/80 rounded-xl p-3 border border-amber-900/50">
            <div className="text-xs text-amber-400 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> نیازمند ورود
            </div>
            <div className="text-xl font-black text-amber-400 mt-1">{authProtectedCount}</div>
          </div>

          <div className="bg-stone-800/80 rounded-xl p-3 border border-rose-900/50">
            <div className="text-xs text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> پاسخ HTML
            </div>
            <div className="text-xl font-black text-rose-400 mt-1">{htmlErrorCount}</div>
          </div>

          <div className="bg-stone-800/80 rounded-xl p-3 border border-indigo-900/50 flex flex-col justify-between">
            <div>
              <div className="text-xs text-indigo-400 flex items-center gap-1">
                <Database className="w-3.5 h-3.5" /> صف تغییرات آفلاین
              </div>
              <div className="text-xl font-black text-indigo-300 mt-1">
                {OfflineQueueService.getQueue().length} اقدام
              </div>
            </div>
          </div>

          <div className="bg-stone-800/80 rounded-xl p-3 border border-teal-900/50 flex flex-col justify-between">
            <div>
              <div className="text-xs text-teal-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> الگوی Circuit Breaker
              </div>
              <div className="text-sm font-black mt-1 flex items-center gap-1.5">
                {ApiClient.getCircuitStatus().state === 'CLOSED' ? (
                  <span className="text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded text-[11px]">
                    فعال و سالم (CLOSED)
                  </span>
                ) : ApiClient.getCircuitStatus().state === 'HALF_OPEN' ? (
                  <span className="text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded text-[11px]">
                    آزمایشی (HALF_OPEN)
                  </span>
                ) : (
                  <span className="text-rose-400 bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded text-[11px]">
                    قطع موقت (OPEN)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Endpoint List & Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoints List Column */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-sm font-semibold text-stone-700 dark:text-stone-300 px-1">
            <span className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-amber-600" />
              لیست مسیرهای API جهت تست
            </span>
            <span className="text-xs text-stone-500 font-normal">کلیک برای مشاهده جزییات</span>
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {TEST_ENDPOINTS.map((item) => {
              const res = results[item.endpoint];
              const isSelected = selectedEndpoint === item.endpoint;
              const isLoading = testingEndpoint === item.endpoint;

              return (
                <div
                  key={item.endpoint}
                  onClick={() => setSelectedEndpoint(item.endpoint)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'bg-amber-50/90 dark:bg-amber-950/20 border-amber-500 shadow-sm'
                      : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-amber-300 dark:hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 shrink-0">
                        {item.method}
                      </span>
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">
                        {item.name}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        testSingleEndpoint(item);
                      }}
                      disabled={isLoading}
                      className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-stone-600 dark:text-stone-300 hover:text-amber-700 transition-colors shrink-0"
                      title="تست مجدد این آدرس"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-stone-500">
                    <span className="truncate max-w-[200px] text-stone-600 dark:text-stone-400 font-semibold">{item.endpoint}</span>

                    {res ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {res.isHtml ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-sans font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            HTML Error
                          </span>
                        ) : res.status === 200 || res.status === 201 ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-sans font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {res.status} JSON ({res.latencyMs}ms)
                          </span>
                        ) : res.status === 401 || res.status === 403 ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-sans font-medium flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            {res.status} Protected
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-sans font-medium">
                            {res.status} Error
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-stone-400 font-sans font-normal">تست‌نشده</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Inspector Panel Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-sm space-y-5">
            {/* Inspector Header */}
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
              <div>
                <h3 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-600" />
                  جزئیات فنی پاسخ سرور: {activeEndpointObj?.name}
                </h3>
                <code className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded mt-1 inline-block font-mono">
                  {selectedEndpoint}
                </code>
              </div>

              <button
                onClick={() => activeEndpointObj && testSingleEndpoint(activeEndpointObj)}
                disabled={testingEndpoint === selectedEndpoint}
                className="px-3 py-1.5 text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingEndpoint === selectedEndpoint ? 'animate-spin' : ''}`} />
                تست مجدد
              </button>
            </div>

            {/* Response Diagnostics State */}
            {activeResult ? (
              <div className="space-y-4">
                {/* Meta Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
                    <span className="text-stone-400 block text-[11px]">کد وضعیت HTTP:</span>
                    <span className={`font-bold font-mono text-sm mt-0.5 block ${
                      activeResult.status === 200 || activeResult.status === 201
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : activeResult.status === 401 || activeResult.status === 403
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {activeResult.status || 'خطای اتصال'} {activeResult.statusText}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
                    <span className="text-stone-400 block text-[11px]">زمان پاسخ (Latency):</span>
                    <span className="font-bold font-mono text-stone-800 dark:text-stone-200 text-sm mt-0.5 block flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {activeResult.latencyMs} ms
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 col-span-2 sm:col-span-1">
                    <span className="text-stone-400 block text-[11px]">نوع فرمت (Content-Type):</span>
                    <span className="font-bold font-mono text-stone-800 dark:text-stone-200 text-xs mt-0.5 block truncate">
                      {activeResult.contentType || 'مشخص‌نشده'}
                    </span>
                  </div>
                </div>

                {/* HTML Error Warning Box if HTML-in-JSON is detected */}
                {activeResult.isHtml && (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      هشدار: سرور به‌جای داده‌های JSON، سند HTML برگردانده است!
                    </div>
                    <p className="text-stone-700 dark:text-rose-200/80 leading-relaxed">
                      این اتفاق زمانی رخ می‌دهد که آدرس درخواست‌شده در routing اکسپرس تعریف نشده یا با خطای ۴۰۴/۵۰۰ مواجه شود و هندلر پیش‌فرض SPA فایل <code className="bg-rose-100 dark:bg-rose-900 px-1 rounded">index.html</code> را برگرداند.
                    </p>
                  </div>
                )}

                {/* Live Server Payload vs Fallback Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Actual Server Response */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                      <span className="flex items-center gap-1">
                        <Server className="w-3.5 h-3.5 text-amber-600" />
                        پاسخ واقعی سرور (Live Payload)
                      </span>
                      {activeResult.isJson ? (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded font-mono">
                          Valid JSON
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-600 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded font-mono">
                          Non-JSON / HTML
                        </span>
                      )}
                    </div>

                    <div className="p-3 bg-stone-900 text-stone-200 rounded-xl font-mono text-[11px] h-52 overflow-auto border border-stone-800 text-left dir-ltr">
                      <pre className="whitespace-pre-wrap break-all">
                        {activeResult.isJson
                          ? JSON.stringify(activeResult.liveData, null, 2)
                          : activeResult.rawTextSnippet || 'بدون پاسخ'}
                      </pre>
                    </div>
                  </div>

                  {/* Fallback Client Data */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                      <span className="flex items-center gap-1">
                        <Database className="w-3.5 h-3.5 text-stone-500" />
                        داده پشتیبان کلاینت (Mock Fallback)
                      </span>
                      <span className="text-[10px] text-stone-500 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded font-mono">
                        Fallback
                      </span>
                    </div>

                    <div className="p-3 bg-stone-950 text-amber-200/90 rounded-xl font-mono text-[11px] h-52 overflow-auto border border-stone-800 text-left dir-ltr">
                      <pre className="whitespace-pre-wrap break-all">
                        {JSON.stringify(activeResult.fallbackData, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-stone-400 space-y-3">
                <Code2 className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-700" />
                <p className="text-xs">
                  جهت عیب‌یابی و مشاهده جزییات فنی اتصال سرور، روی دکمه «تست این آدرس» کلیک کنید.
                </p>
                <button
                  onClick={() => activeEndpointObj && testSingleEndpoint(activeEndpointObj)}
                  className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-xl transition-all shadow-sm"
                >
                  تست همین مسیر ({selectedEndpoint})
                </button>
              </div>
            )}
          </div>

          {/* Educational Integration Note */}
          <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-xs leading-relaxed space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
              <FileCode className="w-4 h-4" />
              راهنمای رفع خطای ۴۰۴ و HTML-in-JSON:
            </div>
            <p className="text-stone-700 dark:text-amber-200/80">
              اگر در تست‌ها پاسخ به‌صورت HTML مشاهده کردید، مطمئن شوید مسیر اکشن در <code className="bg-amber-100 dark:bg-amber-900/60 px-1 rounded font-mono">server/api.ts</code> با پیشوند <code className="bg-amber-100 dark:bg-amber-900/60 px-1 rounded font-mono">/api</code> ثبت شده و آدرس فرانت‌اند در <code className="bg-amber-100 dark:bg-amber-900/60 px-1 rounded font-mono">ApiClient</code> دقیقاً منطبق است.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
