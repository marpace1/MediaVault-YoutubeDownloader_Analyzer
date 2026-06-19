import { Download, Loader2, X } from 'lucide-react';
import { useState, useEffect, useCallback, type DragEvent } from 'react';
import { useAnalyze } from '@/hooks/useAnalyze';
import { useUiStore } from '@/store/useUiStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { cn } from '@/lib/cn';

/**
 * URL input — flat, monochrome, underline style.
 * Supports paste, drag & drop, clipboard auto-detection.
 */
export function UrlInput({ autoFocus = true }: { autoFocus?: boolean }) {
  const [url, setUrl] = useState('');
  const [dragging, setDragging] = useState(false);
  const [suggested, setSuggested] = useState<string | null>(null);
  const analyzing = useUiStore((s) => s.analyzing);
  const settings = useSettingsStore((s) => s.settings);
  const analyze = useAnalyze();

  const valid = /youtube\.com|youtu\.be/i.test(url);

  // Clipboard auto-detection
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

  const paste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      /* clipboard read may be blocked */
    }
  }, []);

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'border-b transition-colors duration-150',
          dragging ? 'border-text-primary' : url && !valid ? 'border-text-secondary' : 'border-border',
          'focus-within:border-text-primary',
        )}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted select-none">URL</span>
          <input
            autoFocus={autoFocus}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Paste a YouTube video or playlist URL…"
            className="input-field flex-1"
            spellCheck={false}
            aria-label="Media URL"
          />
          {url && (
            <button
              onClick={() => setUrl('')}
              className="btn-icon"
              title="Clear"
              aria-label="Clear URL"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={paste} className="btn-ghost px-2" title="Paste from clipboard">
            Paste
          </button>
          <button onClick={submit} disabled={!url.trim() || analyzing} className="btn-primary">
            {analyzing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" /> Analyze
              </>
            )}
          </button>
        </div>
      </div>

      {url && !valid && (
        <p className="mt-2 text-[11px] text-text-secondary">
          That doesn't look like a YouTube URL.
        </p>
      )}

      {suggested && suggested !== url && (
        <button
          onClick={() => {
            setUrl(suggested);
            setSuggested(null);
          }}
          className="chip mt-3 hover:bg-hover transition-colors duration-150"
        >
          Detected on clipboard — click to use
        </button>
      )}
    </div>
  );
}