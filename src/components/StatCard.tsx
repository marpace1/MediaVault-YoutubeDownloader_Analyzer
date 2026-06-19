import type { LucideIcon } from 'lucide-react';

/** Monochrome stat card — flat, no glow, no shadow. */
export function StatCard({
  icon: Icon,
  label,
  value,
  index = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: string;
  index?: number;
}) {
  return (
    <div
      className="card animate-slide-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="label">{label}</p>
          <p className="mt-1.5 text-xl font-bold text-text-primary tabular-nums">
            {value}
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center border border-border">
          <Icon className="h-4 w-4 text-text-secondary" />
        </div>
      </div>
    </div>
  );
}