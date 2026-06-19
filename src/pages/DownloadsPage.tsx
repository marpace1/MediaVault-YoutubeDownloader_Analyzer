import { useEffect, useMemo, useRef, useState } from 'react';
import { FixedSizeList, type ListChildComponentProps } from 'react-window';
import { Trash2,} from 'lucide-react';
import { useDownloadStore } from '@/store/useDownloadStore';
import { DownloadCard } from '@/components/DownloadCard';
import { Select } from '@/components/Select';
import { EmptyState, ASCII } from '@/components/EmptyState';
import { cn } from '@/lib/cn';
import type { DownloadItem, DownloadStatus } from '@shared/types';

type Filter = 'all' | 'active' | 'completed' | 'failed';
type Sort = 'newest' | 'oldest' | 'title' | 'status';

const FILTERS: { id: Filter; label: string; match: (s: DownloadStatus) => boolean }[] = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'active', label: 'Active', match: (s) => ['downloading', 'queued', 'processing', 'paused'].includes(s) },
  { id: 'completed', label: 'Done', match: (s) => s === 'completed' },
  { id: 'failed', label: 'Failed', match: (s) => s === 'failed' || s === 'canceled' },
];

const SORTS = [
  { value: 'newest' as const, label: 'Newest first' },
  { value: 'oldest' as const, label: 'Oldest first' },
  { value: 'title' as const, label: 'Title (A–Z)' },
  { value: 'status' as const, label: 'Status' },
];

const VIRTUALIZE_THRESHOLD = 40;
const ROW_HEIGHT = 52;

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
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="section-title">Downloads</h1>
        <button
          onClick={clearCompleted}
          className="btn-ghost text-[10px]"
          disabled={counts.completed + counts.failed === 0}
        >
          <Trash2 className="h-3 w-3" /> Clear Finished
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mb-3 flex items-center gap-px">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'border-b-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors duration-150',
              filter === f.id
                ? 'border-text-primary text-text-primary'
                : 'border-transparent text-muted hover:text-text-secondary',
            )}
          >
            {f.label} <span className="text-muted">({counts[f.id]})</span>
          </button>
        ))}
      </div>

      {/* Search + sort row */}
      <div className="mb-3 flex items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search downloads…"
          className="input-bordered flex-1 text-xs"
          aria-label="Search downloads"
        />
        <Select value={sort} options={SORTS} onChange={setSort} className="w-40" />
      </div>

      {/* List — table layout */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            ascii={items.length === 0 ? ASCII.downloads : undefined}
            message={items.length === 0 ? 'No downloads yet.' : 'Nothing matches your filter.'}
          />
        ) : (
          <div className="flex h-full flex-col border border-border">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border bg-surface px-2 py-1.5 shrink-0">
              <div className="w-16 shrink-0" />
              <div className="w-[30%]">
                <span className="label">Title</span>
              </div>
              <div className="w-[25%]">
                <span className="label">Progress</span>
              </div>
              <div className="w-16 shrink-0">
                <span className="label text-right">ETA</span>
              </div>
              <div className="w-20 shrink-0 text-right">
                <span className="label">Status</span>
              </div>
              <div className="w-16 shrink-0" />
            </div>

            {/* Rows */}
            <div className="min-h-0 flex-1 overflow-auto">
              {useVirtual ? (
                <VirtualList items={filtered} />
              ) : (
                filtered.map((item) => (
                  <DownloadCard key={item.id} item={item} />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VirtualList({ items }: { items: DownloadItem[] }) {
  const Row = ({ index, style }: ListChildComponentProps) => {
    const item = items[index]!;
    return (
      <div style={style}>
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