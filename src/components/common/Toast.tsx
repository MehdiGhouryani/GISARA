/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Toast - Non-intrusive Feedback Notification Component
 */

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 2500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const Icon =
    toast.type === 'success'
      ? CheckCircle2
      : toast.type === 'error'
      ? AlertCircle
      : Info;

  const bgStyle =
    toast.type === 'success'
      ? 'bg-[#171614] text-white border-stone-800'
      : toast.type === 'error'
      ? 'bg-[#A54843] text-white border-rose-800'
      : 'bg-[#FFFCF8] text-[#171614] border-[#DED7CD]';

  return (
    <div
      className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start gap-3 transition-all ${bgStyle}`}
    >
      <Icon
        className={`w-5 h-5 shrink-0 mt-0.5 ${
          toast.type === 'success'
            ? 'text-emerald-400'
            : toast.type === 'error'
            ? 'text-white'
            : 'text-[#7A5E4D]'
        }`}
      />
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold leading-snug">{toast.title}</h4>
        {toast.message && (
          <p className="text-xs opacity-80 mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="opacity-60 hover:opacity-100 p-1 cursor-pointer"
        aria-label="بستن پیام"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
