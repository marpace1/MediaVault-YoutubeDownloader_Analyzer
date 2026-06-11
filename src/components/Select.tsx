import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
  disabled?: boolean;
}

interface SelectProps<T extends string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}

/** Accessible, animated custom dropdown matching the glass aesthetic. */
export function Select<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className={cn('relative', className)} ref={ref}>
      {label && <p className="mb-1.5 text-xs font-medium text-muted">{label}</p>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm transition hover:border-white/20 focus:border-brand-400/60 focus:outline-none"
      >
        <span className="truncate">{selected?.label ?? 'Select…'}</span>
        <ChevronDown
          className={cn('h-4 w-4 text-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="glass-elevated absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-xl p-1.5"
          >
            {options.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition',
                    opt.disabled
                      ? 'cursor-not-allowed opacity-40'
                      : 'hover:bg-white/10',
                    opt.value === value && 'bg-brand-500/20 text-white',
                  )}
                >
                  <span className="flex flex-col items-start">
                    <span>{opt.label}</span>
                    {opt.hint && <span className="text-[11px] text-muted">{opt.hint}</span>}
                  </span>
                  {opt.value === value && <Check className="h-4 w-4 text-brand-400" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
