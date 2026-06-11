import type { LucideIcon } from 'lucide-react';

/** Shared empty-state placeholder. */
export function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="glass flex flex-col items-center justify-center rounded-2xl py-20 text-center">
      <Icon className="h-10 w-10 text-muted" />
      <p className="mt-3 text-sm text-muted">{message}</p>
    </div>
  );
}
