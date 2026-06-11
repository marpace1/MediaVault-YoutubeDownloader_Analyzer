import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

type Accent = 'brand' | 'emerald' | 'amber' | 'sky' | 'rose';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: Accent;
  index?: number;
}

// Static class maps so Tailwind's purge keeps these utilities.
const GLOW: Record<Accent, string> = {
  brand: 'bg-brand-500/20',
  emerald: 'bg-emerald-500/20',
  amber: 'bg-amber-500/20',
  sky: 'bg-sky-500/20',
  rose: 'bg-rose-500/20',
};
const ICON_BG: Record<Accent, string> = {
  brand: 'bg-brand-500/15',
  emerald: 'bg-emerald-500/15',
  amber: 'bg-amber-500/15',
  sky: 'bg-sky-500/15',
  rose: 'bg-rose-500/15',
};
const ICON_FG: Record<Accent, string> = {
  brand: 'text-brand-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  sky: 'text-sky-400',
  rose: 'text-rose-400',
};

/** Animated statistic card used on the dashboard. */
export function StatCard({ icon: Icon, label, value, accent = 'brand', index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
      whileHover={{ y: -4 }}
      className="glass group relative overflow-hidden rounded-2xl p-5"
    >
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${GLOW[accent]} blur-2xl transition-opacity group-hover:opacity-80`}
      />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${ICON_BG[accent]}`}>
          <Icon className={`h-5 w-5 ${ICON_FG[accent]}`} />
        </div>
      </div>
    </motion.div>
  );
}
