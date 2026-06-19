/**
 * Empty state with ASCII art illustration + helpful message + action.
 */
export function EmptyState({
  ascii,
  message,
  action,
  onAction,
}: {
  ascii?: string;
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {ascii ? (
        <pre className="mb-4 text-[10px] leading-tight text-muted select-none">
          {ascii}
        </pre>
      ) : (
        <div className="mb-4 text-muted">
          <pre className="text-[10px] leading-tight select-none">{`
  ┌─────────────────────┐
  │                     │
  │     ( empty )       │
  │                     │
  └─────────────────────┘`}</pre>
        </div>
      )}
      <p className="text-sm text-text-secondary max-w-xs">{message}</p>
      {action && onAction && (
        <button onClick={onAction} className="btn-ghost mt-4">
          {action}
        </button>
      )}
    </div>
  );
}

/** Predefined ASCII art for common empty states. */
export const ASCII = {
  downloads: `
   ┌──────────────────────────┐
   │  ╔════╗                  │
   │  ║ ↓↓ ║  NO DOWNLOADS    │
   │  ╚════╝                  │
   └──────────────────────────┘`,
  history: `
   ┌──────────────────────────┐
   │                          │
   │     ◷  NO HISTORY YET    │
   │                          │
   └──────────────────────────┘`,
  playlist: `
   ┌──────────────────────────┐
   │  ▶ ▶ ▶                  │
   │  PASTE PLAYLIST URL     │
   │  ▶ ▶ ▶                  │
   └──────────────────────────┘`,
  video: `
   ┌──────────────────────────┐
   │                          │
   │   ◻  ANALYZE A VIDEO     │
   │                          │
   └──────────────────────────┘`,
  audio: `
   ┌──────────────────────────┐
   │  ♪ ♪ ♪                  │
   │  NO AUDIO EXTRACTED      │
   │  ♪ ♪ ♪                  │
   └──────────────────────────┘`,
  thumbnails: `
   ┌──────────────────────────┐
   │  ┌──┐ ┌──┐ ┌──┐        │
   │  │▓▓│ │░░│ │  │        │
   │  └──┘ └──┘ └──┘        │
   └──────────────────────────┘`,
  analytics: `
   ┌──────────────────────────┐
   │  ▁▃▅▇█▇▅▃▁              │
   │  NO ANALYTICS DATA       │
   │  ▁▃▅▇█▇▅▃▁              │
   └──────────────────────────┘`,
} as const;