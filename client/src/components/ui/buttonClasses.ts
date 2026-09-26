import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'danger-outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap ' +
  'transition-[opacity,transform,background-color,border-color,box-shadow] duration-150 active:scale-[0.98] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ' +
  'disabled:pointer-events-none disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary: 'gradient-brand text-white shadow-brand hover:opacity-95',
  secondary: 'border-[1.5px] border-primary/20 bg-primary/6 text-primary-ink hover:bg-primary/10',
  outline: 'border-[1.5px] border-border bg-card text-text-primary hover:bg-bg',
  ghost: 'text-primary hover:bg-primary/8',
  danger: 'bg-error-solid text-white hover:opacity-90',
  'danger-outline': 'border-[1.5px] border-error/30 text-error hover:bg-error/6',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-[15px]',
  lg: 'h-12 px-6 text-[15px]',
};

// Also used to style <Link>s as buttons: <Link className={buttonClasses({ variant: 'secondary' })} />
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className);
}
