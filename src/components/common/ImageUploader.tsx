/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ImageUploader Component - Drag & Drop Upload, Media Gallery & URL Fallback
 * Provides seamless image uploading, drag-and-drop, preview and media library picker.
 */

import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Link as LinkIcon, Trash2, Check, RefreshCw, X, FolderOpen, Loader2 } from 'lucide-react';
import { ApiClient } from '../../services/apiClient';
import { ConfirmDialog } from './ConfirmDialog';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

interface MediaItem {
  filename: string;
  url: string;
  sizeKb: number;
  createdAt: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = 'تصویر',
  placeholder = 'لینک تصویر یا آپلود مستقیم فایل',
  className = ''
}) => {
  const [tab, setTab] = useState<'upload' | 'library' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Media Library state
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [pendingDeleteFile, setPendingDeleteFile] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMediaLibrary = async () => {
    setLoadingMedia(true);
    try {
      const res = await ApiClient.getMediaList();
      if (res && res.success) {
        setMediaList(res.data || []);
      }
    } catch {
      // Failed to load library
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleOpenLibrary = () => {
    setShowLibraryModal(true);
    loadMediaLibrary();
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('لطفا فقط فایل‌های تصویری (JPG, PNG, WEBP, SVG) آپلود فرمایید.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.');
      return;
    }

    setUploading(true);
    setUploadProgress(20);
    setErrorMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        setUploadProgress(60);
        const base64 = e.target?.result as string;
        const res = await ApiClient.uploadImage(base64, file.name);

        setUploadProgress(100);
        if (res && res.success && res.url) {
          onChange(res.url);
          setTab('upload');
        } else {
          setErrorMessage(res.message || 'خطا در آپلود تصویر');
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setErrorMessage('خطا در خواندن فایل تصویر');
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const requestDeleteMedia = (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteError(null);
    setPendingDeleteFile(filename);
  };

  const handleDeleteMedia = async (filename: string) => {
    setDeletingFile(filename);
    try {
      const res = await ApiClient.deleteMedia(filename);
      if (res && res.success) {
        setMediaList(prev => prev.filter(item => item.filename !== filename));
        if (value.includes(filename)) {
          onChange('');
        }
      }
    } catch {
      setDeleteError('حذف فایل با خطا مواجه شد. دوباره تلاش کنید.');
    } finally {
      setDeletingFile(null);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-xs font-bold text-stone-700">{label}</label>}

      {/* Main Container */}
      <div className="bg-stone-50/70 border border-stone-200 rounded-2xl p-3 space-y-3">
        {/* Header Tabs & Library Button */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-2">
          <div className="flex items-center gap-1 bg-stone-200/60 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTab('upload')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === 'upload' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>آپلود مستقیم</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('url')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === 'url' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>آدرس اینترنتی (URL)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenLibrary}
            className="px-3 py-1.5 bg-amber-100/70 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-700" />
            <span>کتابخانه رسانه‌ها</span>
          </button>
        </div>

        {/* Tab 1: Drag & Drop Zone */}
        {tab === 'upload' && (
          <div className="space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/50 scale-[1.01]'
                  : 'border-stone-300 hover:border-amber-400 bg-white hover:bg-amber-50/20'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <UploadCloud className="w-5 h-5" />
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-stone-800">
                  {uploading ? 'در حال ذخیره‌سازی تصویر...' : 'تصویر را بکشید و رها کنید، یا کلیک کنید'}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  پشتیبانی از فرمت‌های JPG, PNG, WEBP تا سقف ۱۰ مگابایت
                </p>
              </div>

              {uploading && (
                <div className="w-full max-w-xs bg-stone-200 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-amber-600 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Manual URL Input */}
        {tab === 'url' && (
          <div className="space-y-1">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full h-10 px-3 bg-white border border-stone-200 rounded-xl text-xs font-medium dir-ltr focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-2.5 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold border border-rose-200 flex items-center justify-between">
            <span>{errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Image Preview Thumbnail */}
        {value && value.trim() !== '' && (
          <div className="relative group rounded-xl overflow-hidden border border-stone-200 bg-white p-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src={value}
                alt="پیش‌نمایش تصویر"
                className="w-12 h-12 rounded-lg object-cover border border-stone-100 flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-stone-800 truncate dir-ltr">{value}</div>
                <div className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                  <Check className="w-3 h-3" />
                  <span>تصویر با موفقیت متصل گردید</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all cursor-pointer flex-shrink-0"
              title="حذف این تصویر"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Media Library Modal */}
      {showLibraryModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col shadow-2xl border border-stone-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">کتابخانه رسانه‌ها و عکس‌های سرور</h3>
                  <p className="text-xs text-stone-500">انتخاب تصویر از آرشیو آپلودشده یا حذف فایل‌های غیرضروری</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLibraryModal(false)}
                className="p-2 text-stone-400 hover:text-stone-800 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Media Grid */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {loadingMedia ? (
                <div className="py-12 text-center text-stone-500 font-medium animate-pulse flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                  <span>در حال دریافت آرشیو رسانه‌ها...</span>
                </div>
              ) : mediaList.length === 0 ? (
                <div className="py-12 text-center text-stone-400 space-y-2">
                  <ImageIcon className="w-10 h-10 mx-auto text-stone-300" />
                  <p className="text-xs font-semibold">هنوز فایلی در سرور آپلود نشده است.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {mediaList.map((item) => {
                    const isSelected = value === item.url;
                    return (
                      <div
                        key={item.filename}
                        onClick={() => {
                          onChange(item.url);
                          setShowLibraryModal(false);
                        }}
                        className={`group relative rounded-2xl overflow-hidden border-2 transition-all cursor-pointer aspect-square bg-stone-100 ${
                          isSelected
                            ? 'border-amber-500 ring-2 ring-amber-500/30'
                            : 'border-stone-200 hover:border-amber-400 hover:shadow-md'
                        }`}
                      >
                        <img
                          src={item.url}
                          alt={item.filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Top Action Badge */}
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => requestDeleteMedia(item.filename, e)}
                            disabled={deletingFile === item.filename}
                            className="p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg transition-all shadow-xs cursor-pointer opacity-0 group-hover:opacity-100"
                            title="حذف از دیسک سرور"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Bottom Info Bar */}
                        <div className="absolute inset-x-0 bottom-0 bg-stone-900/80 backdrop-blur-xs p-1.5 text-white text-xs">
                          <div className="truncate dir-ltr font-mono">{item.filename}</div>
                          <div className="text-stone-300 text-xs mt-0.5">{item.sizeKb} KB</div>
                        </div>

                        {isSelected && (
                          <div className="absolute inset-0 bg-amber-900/30 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="bg-amber-600 text-white p-2 rounded-full shadow-lg">
                              <Check className="w-5 h-5" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-stone-100 pt-3 flex items-center justify-between">
              <span className="text-xs text-stone-500 font-medium">
                تعداد کل فایل‌های آرشیو: {mediaList.length} تصویر
              </span>

              <button
                type="button"
                onClick={() => setShowLibraryModal(false)}
                className="px-5 py-2 bg-stone-900 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-stone-800 transition-all"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteError && <p role="alert" className="mt-2 text-xs text-rose-600">{deleteError}</p>}
      <ConfirmDialog
        isOpen={!!pendingDeleteFile}
        danger
        title="حذف تصویر از سرور"
        message="این تصویر برای همیشه از سرور حذف می‌شود و در هر جایی که استفاده شده باشد دیگر نمایش داده نخواهد شد."
        confirmLabel="حذف تصویر"
        onCancel={() => setPendingDeleteFile(null)}
        onConfirm={async () => { const f = pendingDeleteFile; setPendingDeleteFile(null); if (f) await handleDeleteMedia(f); }}
      />
    </div>
  );
};
