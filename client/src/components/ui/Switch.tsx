import { useId } from 'react';
import { cn } from '@/lib/cn';

// On/off setting with a label and helper text (per the design's settings toggles).
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-[15px] font-medium text-text-primary">
          {label}
        </label>
        {description && <p className="mt-0.5 text-[13px] text-text-secondary">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50',
          checked ? 'gradient-brand' : 'bg-border',
        )}
      >
        <span className={cn('absolute top-0.5 size-6 rounded-full bg-white shadow transition-[left] duration-200', checked ? 'left-[22px]' : 'left-0.5')} />
      </button>
    </div>
  );
}
