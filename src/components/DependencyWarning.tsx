import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useUiStore } from '@/store/useUiStore';

/**
 * Persistent banner shown when the yt-dlp or FFmpeg engines are missing.
 * Downloads cannot work without them, so we guide the user to Settings.
 */
export function DependencyWarning() {
  const deps = useSettingsStore((s) => s.deps);
  const navigate = useUiStore((s) => s.navigate);

  // Only warn once we've actually probed (deps !== null).
  const missing: string[] = [];
  if (deps) {
    if (!deps.ytDlp.available) missing.push('yt-dlp');
    if (!deps.ffmpeg.available) missing.push('FFmpeg');
  }

  return (
    <AnimatePresence>
      {missing.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          onClick={() => navigate('settings')}
          className="glass flex w-full items-center gap-3 rounded-xl border-amber-400/30 bg-amber-500/10 p-3 text-left"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {missing.join(' & ')} {missing.length > 1 ? 'are' : 'is'} not detected
            </p>
            <p className="text-xs text-muted">
              Downloads require these engines. Click to configure their paths in Settings.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-amber-400" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
