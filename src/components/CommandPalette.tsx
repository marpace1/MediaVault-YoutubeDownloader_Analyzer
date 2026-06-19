import { useState, useEffect, useRef, useCallback } from 'react';
import { useUiStore } from '@/store/useUiStore';
import { useDownloadStore } from '@/store/useDownloadStore';
import { cn } from '@/lib/cn';

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette() {
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const navigate = useUiStore((s) => s.navigate);
  const toast = useUiStore((s) => s.toast);
  const clearCompleted = useDownloadStore((s) => s.clearCompleted);
  const refresh = useDownloadStore((s) => s.refresh);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useCallback(
    (): Command[] => [
      { id: 'home', label: 'Go to Download', shortcut: '', action: () => navigate('home') },
      { id: 'downloads', label: 'Go to Downloads', shortcut: 'Ctrl+D', action: () => navigate('downloads') },
      { id: 'analytics', label: 'Go to Analyzer', shortcut: '', action: () => navigate('analytics') },
      { id: 'playlists', label: 'Go to Playlists', shortcut: '', action: () => navigate('playlists') },
      { id: 'audio', label: 'Go to Audio', shortcut: '', action: () => navigate('audio') },
      { id: 'thumbnails', label: 'Go to Thumbnails', shortcut: '', action: () => navigate('thumbnails') },
      { id: 'history', label: 'Go to History', shortcut: 'Ctrl+H', action: () => navigate('history') },
      { id: 'theme', label: 'Go to Theme', shortcut: '', action: () => navigate('theme') },
      { id: 'settings', label: 'Go to Settings', shortcut: 'Ctrl+,', action: () => navigate('settings') },
      { id: 'about', label: 'Go to About', shortcut: '', action: () => navigate('about') },
      { id: 'clear-completed', label: 'Clear Completed Downloads', shortcut: '', action: () => { clearCompleted(); toast('Cleared completed', 'success'); } },
      { id: 'refresh', label: 'Refresh Downloads', shortcut: 'F5', action: () => refresh() },
    ],
    [navigate, clearCompleted, toast, refresh],
  );

  const filtered = commands().filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      // Focus input after a tick so the transition doesn't steal focus
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const execute = (cmd: Command) => {
    cmd.action();
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selected]) {
      e.preventDefault();
      execute(filtered[selected]!);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selected] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bg/80"
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-lg border border-border bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        role="dialog"
        aria-label="Command palette"
      >
        <div className="flex items-center border-b border-border px-3">
          <span className="text-xs text-muted mr-2">›</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command…"
            className="flex-1 bg-transparent py-3 text-sm text-text-primary outline-none placeholder:text-muted"
            spellCheck={false}
          />
          <span className="text-[10px] text-muted">ESC</span>
        </div>

        <div ref={listRef} className="max-h-64 overflow-y-auto py-1" role="listbox">
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted">
              No matching commands
            </div>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => execute(cmd)}
                onMouseEnter={() => setSelected(i)}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2 text-xs transition-colors duration-100',
                  i === selected
                    ? 'bg-selection text-text-primary'
                    : 'text-text-secondary hover:bg-hover',
                )}
                role="option"
                aria-selected={i === selected}
              >
                <span className="uppercase tracking-wider">{cmd.label}</span>
                {cmd.shortcut && (
                  <span className="text-[10px] text-muted">{cmd.shortcut}</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}