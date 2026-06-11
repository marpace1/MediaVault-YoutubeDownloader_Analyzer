import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { FixedSizeList, type ListChildComponentProps } from 'react-window';
import { Search, Trash2, Download, Inbox, ArrowUpDown } from 'lucide-react';
import { useDownloadStore } from '@/store/useDownloadStore';
import { DownloadCard } from '@/components/DownloadCard';
import { Select } from '@/components/Select';
import { cn } from '@/lib/cn';
import type { DownloadItem, DownloadStatus } from '@shared/types';

type Filter = 'all' | 'active' | 'completed' | 'failed';
type Sort = 'newest' | 'oldest' | 'title' | 'status';

const FILTERS: { id: Filter; label: string; match: (s: DownloadStatus) => boolean }[] = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'active', label: 'Active', match: (s) => ['downloading', 'queued', 'processing', 'paused'].includes(s) },
  { id: 'completed', label: 'Completed', match: (s) => s === 'completed' },
  { id: 'failed', label: 'Failed', match: (s) => s === 'failed' || s === 'canceled' },
];

const SORTS = [
  { value: 'newest' as const, label: 'Newest first' },
  { value: 'oldest' as const, label: 'Oldest first' },
  { value: 'title' as const, label: 'Title (A–Z)' },
  { value: 'status' as const, label: 'Status' },
];

// Above this count we switch to a virtualized window for smooth scrolling.
const VIRTUALIZE_THRESHOLD = 40;
const ROW_HEIGHT = 104; // card height (92) + gap (12)

export function DownloadsPage() {
  const items = useDownloadStore((s) => s.items);
  const clearCompleted = useDownloadStore((s) => s.clearCompleted);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('newest');

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter)!;
    const q = query.trim().toLowerCase();
    const out = items.filter(
      (i) =>
        f.match(i.status) &&
        (!q || i.title.toLowerCase().includes(q) || (i.channel ?? '').toLowerCase().includes(q)),
    );
    const sorted = [...out];
    switch (sort) {
      case 'newest':
        sorted.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        sorted.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'status':
        sorted.sort((a, b) => a.status.localeCompare(b.status));
        break;
    }
    return sorted;
  }, [items, filter, query, sort]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: items.length, active: 0, completed: 0, failed: 0 };
    for (const i of items) {
      for (const f of FILTERS) {
        if (f.id !== 'all' && f.match(i.status)) c[f.id]++;
      }
    }
    return c;
  }, [items]);

  const useVirtual = filtered.length > VIRTUALIZE_THRESHOLD;

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Downloads</h1>
        <button onClick={clearCompleted} className="btn-ghost text-xs" disabled={counts.completed + counts.failed === 0}>
          <Trash2 className="h-3.5 w-3.5" /> Clear finished
        </button>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition',
                filter === f.id ? 'bg-brand-500/30 text-white ring-1 ring-brand-400/40' : 'text-muted hover:text-white',
              )}
            >
              {f.label} <span className="opacity-60">{counts[f.id]}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search downloads…"
            className="input-field py-2.5 pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 shrink-0 text-muted" />
          <Select value={sort} options={SORTS} onChange={setSort} className="w-40" />
        </div>
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="glass flex flex-col items-center justify-center rounded-2xl py-20 text-center">
            {items.length === 0 ? (
              <>
                <Download className="h-10 w-10 text-muted" />
                <p className="mt-3 text-sm text-muted">No downloads yet.</p>
              </>
            ) : (
              <>
                <Inbox className="h-10 w-10 text-muted" />
                <p className="mt-3 text-sm text-muted">Nothing matches your filter.</p>
              </>
            )}
          </div>
        ) : useVirtual ? (
          <VirtualList items={filtered} />
        ) : (
          <div className="h-full space-y-3 overflow-auto pr-1">
            <AnimatePresence mode="popLayout">
              {filtered.map((item) => (
                <DownloadCard key={item.id} item={item} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

/** Virtualized list for very large histories — only renders visible rows. */
function VirtualList({ items }: { items: DownloadItem[] }) {
  const Row = ({ index, style }: ListChildComponentProps) => {
    const item = items[index]!;
    return (
      <div style={style} className="pb-3 pr-1">
        <DownloadCard item={item} />
      </div>
    );
  };

  return (
    <AutoSizer>
      {(height) => (
        <FixedSizeList
          height={height}
          width="100%"
          itemCount={items.length}
          itemSize={ROW_HEIGHT}
          overscanCount={4}
        >
          {Row}
        </FixedSizeList>
      )}
    </AutoSizer>
  );
}

/**
 * Minimal height measurer (avoids pulling in react-virtualized-auto-sizer).
 * Uses a ResizeObserver so the virtual list tracks window/layout changes.
 */
function AutoSizer({ children }: { children: (height: number) => React.ReactNode }) {
  const [height, setHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height ?? 0;
      setHeight((prev) => (Math.abs(prev - h) > 1 ? h : prev));
    });
    ro.observe(el);
    setHeight(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-full">
      {height > 0 && children(height)}
    </div>
  );
}
