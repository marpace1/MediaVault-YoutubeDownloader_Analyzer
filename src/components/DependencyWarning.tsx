import { useSettingsStore } from '@/store/useSettingsStore';
import { useUiStore } from '@/store/useUiStore';

/**
 * Persistent warning when yt-dlp or FFmpeg are missing.
 * Monochrome, flat, border-accented.
 */
export function DependencyWarning() {
  const deps = useSettingsStore((s) => s.deps);
  const navigate = useUiStore((s) => s.navigate);

  const missing: string[] = [];
  if (deps) {
    if (!deps.ytDlp.available) missing.push('yt-dlp');
    if (!deps.ffmpeg.available) missing.push('FFmpeg');
  }

  if (missing.length === 0) return null;

  return (
    <button
      onClick={() => navigate('settings')}
      className="flex w-full items-center gap-3 border border-text-secondary bg-surface p-3 text-left transition-colors duration-150 hover:bg-hover"
    >
      <span className="text-xs font-bold text-text-secondary">!</span>
      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-primary">
          {missing.join(' & ')} not detected
        </p>
        <p className="mt-0.5 text-[11px] text-text-secondary">
          Downloads require these engines. Click to configure in Settings.
        </p>
      </div>
      <span className="text-xs text-muted">→</span>
    </button>
  );
}