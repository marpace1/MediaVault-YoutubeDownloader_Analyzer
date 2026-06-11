import { motion } from 'framer-motion';

/**
 * Decorative animated gradient orbs rendered behind the app content.
 * Pure CSS transforms (GPU-accelerated) — no per-frame React work, so it costs
 * essentially nothing at runtime. `pointer-events-none` keeps it click-through.
 */
export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-brand-500/20 blur-[120px]"
        animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 -right-24 h-[32rem] w-[32rem] rounded-full bg-fuchsia-500/15 blur-[140px]"
        animate={{ x: [0, -50, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-1/3 top-1/4 h-72 w-72 rounded-full bg-sky-500/10 blur-[100px]"
        animate={{ x: [0, 40, 0], y: [0, 60, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
