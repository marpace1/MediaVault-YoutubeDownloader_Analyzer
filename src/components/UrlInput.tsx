import { useState, useEffect, useCallback, type DragEvent } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, Sparkles, ClipboardPaste, X } from 'lucide-react';
import { useAnalyze } from '@/hooks/useAnalyze';
import { useUiStore } from '@/store/useUiStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { cn } from '@/lib/cn';

/**
 * The hero URL input. Supports paste, drag & drop, clipboard auto-detection,
 * and live validation feedback.
 */
export function UrlInput({ autoFocus = true }: { autoFocus?: boolean }) {
  const [url, setUrl] = useState('');
  const [dragging, setDragging] = useState(false);
  const [suggested, setSuggested] = useState<string | null>(null);
  const analyzing = useUiStore((s) => s.analyzing);
  const settings = useSettingsStore((s) => s.settings);
  const analyze = useAnalyze();

  const valid = /youtube\.com|youtu\.be/i.test(url);

  // Clipboard auto-detection from the main process.
  useEffect(() => {
    if (!settings?.clipboardDetection) return;
    const off = window.mediavault.onClipboardUrl((detected) => {
      setUrl((cur) => (cur ? cur : ''));
      setSuggested(detected);
    });
    return off;
  }, [settings?.clipboardDetection]);

  const submit = useCallback(() => {
    if (!url.trim() || analyzing) return;
    analyze(url);
  }, [url, analyzing, analyze]);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const text = e.dataTransfer.getData('text');
    if (text) setUrl(text.trim());
  };

  // Explicit paste button — reads the system clipboard via the renderer API.
  const paste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      /* clipboard read may be blocked; the auto-detect banner still works */
    }
  }, []);

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'glass-elevated flex items-center gap-3 rounded-2xl p-2 pl-5 transition-all',
          dragging && 'ring-2 ring-brand-400/60',
          url && !valid && 'ring-1 ring-rose-400/50',
        )}
      >
        <Search className="h-5 w-5 shrink-0 text-muted" />
        <input
          autoFocus={autoFocus}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Paste a YouTube video or playlist URL…"
          className="flex-1 bg-transparent py-3 text-base outline-none placeholder:text-muted"
          spellCheck={false}
        />
        {url && (
          <button
            onClick={() => setUrl('')}
            className="btn-icon h-9 w-9 shrink-0"
            title="Clear"
            aria-label="Clear URL"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button onClick={paste} className="btn-ghost shrink-0 px-3" title="Paste from clipboard">
          <ClipboardPaste className="h-4 w-4" />
          <span className="hidden sm:inline">Paste</span>
        </button>
        <button onClick={submit} disabled={!url.trim() || analyzing} className="btn-primary px-5">
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Analyze
            </>
          )}
        </button>
      </motion.div>

      {url && !valid && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 pl-2 text-xs text-rose-400"
        >
          That doesn't look like a YouTube URL.
        </motion.p>
      )}

      {suggested && suggested !== url && (
        <motion.button
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => {
            setUrl(suggested);
            setSuggested(null);
          }}
          className="chip mt-3 no-drag hover:bg-white/10"
        >
          <ClipboardPaste className="h-3.5 w-3.5" />
          Detected on clipboard — click to use
        </motion.button>
      )}
    </div>
  );
}
