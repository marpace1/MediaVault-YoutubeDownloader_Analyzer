import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useUiStore } from '@/store/useUiStore';
import { useEffect } from 'react';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const COLORS = {
  success: 'text-emerald-400',
  error: 'text-rose-400',
  info: 'text-brand-400',
};

/** Auto-dismissing toast stack rendered bottom-right. */
export function Toasts() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-80 flex-col gap-3">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastCard key={t.id} {...t} onDismiss={() => dismiss(t.id)} />
        ))}
      </AnimatePresence>
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
  const Icon = ICONS[type];
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="glass-elevated pointer-events-auto flex items-start gap-3 rounded-xl p-3.5"
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${COLORS[type]}`} />
      <p className="flex-1 text-sm leading-snug">{message}</p>
      <button onClick={onDismiss} className="text-muted transition hover:text-white">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
