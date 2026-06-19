import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { LucideIcon } from 'lucide-react';

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
 * Right-click context menu — monochrome, flat, portal-rendered.
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
          const x = Math.min(e.clientX, window.innerWidth - 200);
          const y = Math.min(e.clientY, window.innerHeight - items.length * 28 - 8);
          setPos({ x, y });
        }}
      >
        {children}
      </div>

      {createPortal(
        pos && (
          <div
            ref={menuRef}
            style={{ top: pos.y, left: pos.x }}
            className="fixed z-[100] min-w-[160px] border border-border bg-surface py-1 shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
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
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors duration-100 ${
                    item.disabled
                      ? 'cursor-not-allowed opacity-30'
                      : 'text-text-secondary hover:bg-hover hover:text-text-primary'
                  } ${item.danger ? 'text-text-secondary' : ''}`}
                >
                  {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
                  {item.label}
                </button>
              );
            })}
          </div>
        ),
        document.body,
      )}
    </>
  );
});