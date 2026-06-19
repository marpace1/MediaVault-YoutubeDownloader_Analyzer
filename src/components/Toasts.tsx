import { useUiStore } from '@/store/useUiStore';
import { useEffect } from 'react';
import { cn } from '@/lib/cn';

const INDICATOR = {
  success: '□',
  error: '✕',
  info: '—',
};

/** Monochrome toast stack — bottom-right, minimal. */
export function Toasts() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-72 flex-col gap-2">
      {toasts.map((t) => (
        <ToastCard key={t.id} {...t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({
  id,
  message,
  type,
  onDismiss,
}: {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [id, onDismiss]);

  return (
    <div
      className={cn(
        'pointer-events-auto animate-slide-in-right border bg-surface px-3 py-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.4)]',
        type === 'error' ? 'border-text-secondary' : 'border-border',
      )}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-[10px] text-text-secondary select-none">
          {INDICATOR[type]}
        </span>
        <p className="flex-1 text-xs leading-relaxed text-text-secondary">
          {message}
        </p>
        <button
          onClick={onDismiss}
          className="shrink-0 text-muted transition-colors hover:text-text-primary"
          aria-label="Dismiss"
        >
          <span className="text-xs">✕</span>
        </button>
      </div>
    </div>
  );
}