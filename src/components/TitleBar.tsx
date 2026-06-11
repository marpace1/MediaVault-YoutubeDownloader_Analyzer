import { Minus, Square, X, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Custom frameless titlebar. The center region is a drag handle; the buttons
 * are explicitly no-drag so they stay clickable.
 */
export function TitleBar() {
  return (
    <div className="drag flex h-10 shrink-0 items-center justify-between border-b border-white/5 px-3">
      <div className="flex items-center gap-2 pl-1">
        <motion.div
          initial={{ rotate: -10, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow"
        >
          <ShieldCheck className="h-4 w-4 text-white" />
        </motion.div>
        <span className="text-sm font-semibold tracking-tight">MediaVault</span>
        <span className="text-[10px] font-medium text-muted">v1.0.0</span>
      </div>

      <div className="no-drag flex items-center gap-1">
        <button
          onClick={() => window.mediavault.minimize()}
          className="flex h-7 w-9 items-center justify-center rounded-md text-muted transition hover:bg-white/10 hover:text-white"
          aria-label="Minimize"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={() => window.mediavault.maximize()}
          className="flex h-7 w-9 items-center justify-center rounded-md text-muted transition hover:bg-white/10 hover:text-white"
          aria-label="Maximize"
        >
          <Square className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => window.mediavault.close()}
          className="flex h-7 w-9 items-center justify-center rounded-md text-muted transition hover:bg-rose-500/80 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
