import { useState, useRef, useEffect } from 'react';
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

/** Monochrome custom dropdown — square, flat, no glow. */
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
      {label && <p className="label mb-1.5">{label}</p>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between border border-border bg-surface px-3 py-2 text-xs uppercase tracking-wider text-text-primary transition-colors duration-150 hover:border-text-secondary focus:border-text-primary focus:outline-none"
      >
        <span className="truncate normal-case">{selected?.label ?? 'Select…'}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-150',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full border border-border bg-surface shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <div className="max-h-52 overflow-y-auto py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-1.5 text-xs transition-colors duration-100',
                  opt.disabled
                    ? 'cursor-not-allowed opacity-30'
                    : 'hover:bg-hover',
                  opt.value === value && 'bg-selection text-text-primary',
                  opt.value === value && !opt.disabled && 'text-text-secondary',
                )}
              >
                <span className="flex flex-col items-start">
                  <span className="normal-case">{opt.label}</span>
                  {opt.hint && (
                    <span className="text-[10px] text-muted normal-case">{opt.hint}</span>
                  )}
                </span>
                {opt.value === value && (
                  <Check className="h-3.5 w-3.5 text-text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}