import { cn } from '@/lib/cn';

/** Flat monochrome progress bar with smooth CSS transition. */
export function ProgressBar({
  percent,
  indeterminate,
  className,
}: {
  percent: number;
  indeterminate?: boolean;
  className?: string;
  color?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div
      className={cn('h-1 w-full overflow-hidden bg-surface-2', className)}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {indeterminate ? (
        <div
          className="h-full w-1/3 bg-text-secondary"
          style={{
            animation: 'shimmer 1.6s infinite',
          }}
        />
      ) : (
        <div
          className="h-full bg-text-primary transition-[width] duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      )}
    </div>
  );
}