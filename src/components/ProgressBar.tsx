import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface ProgressBarProps {
  percent: number;
  /** indeterminate shimmer for queued / processing states */
  indeterminate?: boolean;
  className?: string;
  color?: 'brand' | 'emerald' | 'rose' | 'amber';
}

const COLOR_MAP = {
  brand: 'from-brand-400 to-brand-600',
  emerald: 'from-emerald-400 to-emerald-600',
  rose: 'from-rose-400 to-rose-600',
  amber: 'from-amber-400 to-amber-600',
};

/** GPU-accelerated animated progress bar. */
export function ProgressBar({
  percent,
  indeterminate,
  className,
  color = 'brand',
}: ProgressBarProps) {
  return (
    <div className={cn('relative h-2 w-full overflow-hidden rounded-full bg-white/10', className)}>
      {indeterminate ? (
        <motion.div
          className={cn('absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r', COLOR_MAP[color])}
          animate={{ x: ['-100%', '300%'] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        />
      ) : (
        <motion.div
          className={cn('h-full rounded-full bg-gradient-to-r gpu', COLOR_MAP[color])}
          initial={false}
          animate={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 24 }}
        />
      )}
    </div>
  );
}
