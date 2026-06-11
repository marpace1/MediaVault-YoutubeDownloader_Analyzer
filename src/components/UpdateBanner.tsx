import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, X, Loader2 } from 'lucide-react';
import type { UpdateState } from '../../electron/services/updater';

/** Floating banner that surfaces auto-updater state. */
export function UpdateBanner() {
  const [state, setState] = useState<UpdateState | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const off = window.mediavault.onUpdateStatus((s) => {
      setState(s);
      setDismissed(false);
    });
    return off;
  }, []);

  const show =
    !dismissed &&
    state &&
    (state.status === 'available' ||
      state.status === 'downloading' ||
      state.status === 'ready');

  return (
    <AnimatePresence>
      {show && state && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="glass-elevated fixed left-1/2 top-12 z-40 flex -translate-x-1/2 items-center gap-3 rounded-xl px-4 py-2.5"
        >
          {state.status === 'downloading' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
              <span className="text-sm">Downloading update… {state.percent}%</span>
            </>
          ) : state.status === 'ready' ? (
            <>
              <Download className="h-4 w-4 text-emerald-400" />
              <span className="text-sm">Update {state.version} ready</span>
              <button onClick={() => window.mediavault.installUpdate()} className="btn-primary px-3 py-1 text-xs">
                Restart & install
              </button>
            </>
          ) : (
            <>
              <Download className="h-4 w-4 text-brand-400" />
              <span className="text-sm">
                Update {state.status === 'available' ? state.version : ''} available
              </span>
            </>
          )}
          <button onClick={() => setDismissed(true)} className="text-muted transition hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
