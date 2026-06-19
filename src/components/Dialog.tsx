import { useEffect, useRef, type ReactNode } from 'react';


interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

/**
 * Custom modal dialog — monochrome, square, 1px border.
 * Replaces browser alerts with a VS Code-style dialog.
 */
export function Dialog({ open, onClose, title, children, actions }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Trap focus
  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-bg/80"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-md border border-border bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        role="dialog"
        aria-label={title}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-text-primary">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="btn-icon text-xs"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 text-sm text-text-secondary">
          {children}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}