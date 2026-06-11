import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface MenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  items: MenuItem[];
  children: ReactNode;
  className?: string;
}

/**
 * Right-click context menu rendered via a portal so it escapes overflow:hidden
 * containers. Closes on outside click, scroll, or Escape.
 *
 * Forwards its ref to the trigger wrapper so parents (e.g. AnimatePresence
 * `mode="popLayout"`) can measure/freeze the element during exit animations.
 */
export const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(function ContextMenu(
  { items, children, className },
  forwardedRef,
) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) close();
    };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [pos]);

  return (
    <>
      <div
        ref={forwardedRef}
        className={className}
        onContextMenu={(e) => {
          e.preventDefault();
          // Clamp so the menu never overflows the viewport edge.
          const x = Math.min(e.clientX, window.innerWidth - 200);
          const y = Math.min(e.clientY, window.innerHeight - items.length * 40 - 16);
          setPos({ x, y });
        }}
      >
        {children}
      </div>

      {createPortal(
        <AnimatePresence>
          {pos && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              style={{ top: pos.y, left: pos.x }}
              className="glass-elevated fixed z-[100] min-w-[180px] rounded-xl p-1.5"
            >
              {items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={i}
                    disabled={item.disabled}
                    onClick={() => {
                      item.onClick();
                      setPos(null);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition',
                      item.disabled
                        ? 'cursor-not-allowed opacity-40'
                        : item.danger
                          ? 'text-rose-400 hover:bg-rose-500/15'
                          : 'hover:bg-white/10',
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    {item.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
});
