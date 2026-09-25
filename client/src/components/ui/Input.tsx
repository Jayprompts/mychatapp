import { useId, useState, type ComponentProps } from 'react';
import { CircleAlert, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';

type InputProps = ComponentProps<'input'> & {
  label: string;
  error?: string;
  hint?: string;
};

// Labelled text input with error/hint text and a show/hide toggle for passwords.
// Works with react-hook-form: <Input label="Email" {...register('email')} />
export function Input({ label, error, hint, type = 'text', id, className, ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className={cn('text-[13px] font-medium', error ? 'text-error' : 'text-text-secondary')}>
        {label}
      </label>

      <div className="relative">
        <input
          id={inputId}
          type={isPassword && showPassword ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={cn(
            'w-full rounded-md border-[1.5px] bg-card px-4 py-3 text-[15px] text-text-primary outline-none',
            'transition-[border-color,box-shadow] duration-150 placeholder:text-text-tertiary',
            'disabled:cursor-not-allowed disabled:bg-bg disabled:text-text-tertiary',
            error
              ? 'border-error shadow-[0_0_0_3px_rgba(250,56,62,0.12)]'
              : 'border-border focus:border-primary focus:shadow-[0_0_0_3px_rgba(8,102,255,0.15)]',
            isPassword && 'pr-12',
          )}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1.5 text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-primary"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error ? (
        <p id={messageId} className="flex items-center gap-1 text-xs text-error">
          <CircleAlert size={13} aria-hidden className="shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-xs text-text-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
