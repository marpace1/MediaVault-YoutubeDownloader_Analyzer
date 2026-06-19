import { useMemo, useState } from 'react';
import { useDownloadStore } from '@/store/useDownloadStore';
import { EmptyState, ASCII } from '@/components/EmptyState';
import { formatBytes, formatDuration, relativeTime } from '@/lib/format';
import type { DownloadStatus } from '@shared/types';

type Filter = 'all' | 'completed' | 'failed' | 'canceled';

const FILTERS: { id: Filter; label: string; match: (s: DownloadStatus) => boolean }[] = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'completed', label: 'Completed', match: (s) => s === 'completed' },
  { id: 'failed', label: 'Failed', match: (s) => s === 'failed' },
  { id: 'canceled', label: 'Canceled', match: (s) => s === 'canceled' },
];

/** History page — compact table of past downloads. */
export function HistoryPage() {
  const items = useDownloadStore((s) => s.items);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const completed = useMemo(() => {
    return items.filter((i) =>
      ['completed', 'failed', 'canceled'].includes(i.status),
    );
  }, [items]);

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter)!;
    const q = search.trim().toLowerCase();
    return completed.filter(
      (i) =>
        f.match(i.status) &&
        (!q ||
          i.title.toLowerCase().includes(q) ||
          (i.channel ?? '').toLowerCase().includes(q)),
    );
  }, [completed, filter, search]);

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
      <h1 className="section-title">History</h1>
      <p className="text-xs text-text-secondary mb-4">
        Completed, failed, and canceled downloads.
      </p>

      {/* Filters + search */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex gap-px">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`border-b-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors duration-150 ${
                filter === f.id
                  ? 'border-text-primary text-text-primary'
                  : 'border-transparent text-muted hover:text-text-secondary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search history…"
          className="input-bordered ml-auto w-56 text-xs"
          aria-label="Search history"
        />
      </div>

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <EmptyState
            ascii={ASCII.history}
            message={completed.length === 0 ? 'No download history yet.' : 'Nothing matches your filter.'}
          />
        ) : (
          <div className="border border-border">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border bg-surface px-2 py-1.5 sticky top-0">
              <div className="w-12 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="label">Title</span>
              </div>
              <div className="w-20 shrink-0">
                <span className="label">Artist</span>
              </div>
              <div className="w-16 shrink-0">
                <span className="label">Format</span>
              </div>
              <div className="w-16 shrink-0 text-right">
                <span className="label">Duration</span>
              </div>
              <div className="w-20 shrink-0 text-right">
                <span className="label">Size</span>
              </div>
              <div className="w-24 shrink-0 text-right">
                <span className="label">Downloaded</span>
              </div>
              <div className="w-16 shrink-0 text-right">
                <span className="label">Status</span>
              </div>
            </div>

            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 border-b border-border px-2 py-2 transition-colors duration-100 hover:bg-hover last:border-b-0"
              >
                <div className="relative h-7 w-12 shrink-0 overflow-hidden bg-surface-2">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted text-[8px]">—</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-text-primary" title={item.title}>{item.title}</p>
                </div>
                <div className="w-20 shrink-0 truncate text-[10px] text-text-secondary">
                  {item.channel ?? '—'}
                </div>
                <div className="w-16 shrink-0 text-[10px] text-muted uppercase">
                  {item.kind}
                </div>
                <div className="w-16 shrink-0 text-right text-[10px] text-muted tabular-nums">
                  {formatDuration(item.duration)}
                </div>
                <div className="w-20 shrink-0 text-right text-[10px] text-text-secondary tabular-nums">
                  {formatBytes(item.fileSize)}
                </div>
                <div className="w-24 shrink-0 text-right text-[10px] text-muted tabular-nums">
                  {item.completedAt ? relativeTime(item.completedAt) : '—'}
                </div>
                <div className="w-16 shrink-0 text-right">
                  <span className={`text-[10px] uppercase tracking-wider ${
                    item.status === 'completed' ? 'text-text-primary' : 'text-text-secondary'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}