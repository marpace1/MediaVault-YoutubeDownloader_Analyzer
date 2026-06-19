import { cn } from '@/lib/cn';

/** Loading skeleton block with monochrome shimmer. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

/** Composite skeleton for video analysis loading. */
export function VideoSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-video w-full max-w-2xl" />
      <Skeleton className="h-5 w-3/4 max-w-md" />
      <Skeleton className="h-4 w-1/2 max-w-sm" />
      <div className="grid grid-cols-2 gap-3 pt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}