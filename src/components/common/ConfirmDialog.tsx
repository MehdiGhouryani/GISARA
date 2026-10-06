import React, { useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useDialogA11y } from '../../hooks/useDialogA11y';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive styling for delete / restore style actions. */
  danger?: boolean;
  /** When set, the confirm button stays disabled until the person types exactly this phrase. */
  requirePhrase?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/** Accessible replacement for window.confirm: focus-trapped, Esc cancels, optional type-to-confirm. */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'تأیید',
  cancelLabel = 'انصراف',
  danger = false,
  requirePhrase,
  onConfirm,
  onCancel,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  useDialogA11y(isOpen, onCancel, ref);

  if (!isOpen) return null;
  const canConfirm = !busy && (!requirePhrase || typed.trim() === requirePhrase);

  const run = async () => {
    if (!canConfirm) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      setTyped('');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 gisara-fade-in" onClick={onCancel} aria-hidden="true" />
      <div
        ref={ref}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="relative w-full max-w-md bg-white text-[#171614] rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 gisara-fade-in focus:outline-none"
      >
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${danger ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id="confirm-title" className="text-base font-bold">{title}</h2>
            <div id="confirm-message" className="mt-1 text-sm text-[#5E5A54] leading-7">{message}</div>
          </div>
        </div>

        {requirePhrase && (
          <div>
            <label htmlFor="confirm-phrase" className="block text-xs font-semibold mb-1">
              برای ادامه عبارت <bdi className="font-mono font-bold">{requirePhrase}</bdi> را بنویسید:
            </label>
            <input
              id="confirm-phrase"
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              dir="auto"
              className="w-full p-2.5 border border-[#DED7CD] rounded-xl text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
            />
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel} className="min-h-11 px-5 bg-[#EEE8DF] hover:bg-[#DED7CD] text-sm font-semibold rounded-xl cursor-pointer transition-colors">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={run}
            disabled={!canConfirm}
            aria-busy={busy}
            className={`min-h-11 px-5 text-white text-sm font-bold rounded-xl cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${danger ? 'bg-rose-700 hover:bg-rose-800' : 'bg-[#171614] hover:bg-[#7A5E4D]'}`}
          >
            {busy ? 'در حال انجام…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
