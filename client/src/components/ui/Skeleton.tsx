import { cn } from '@/lib/cn';

// Shimmer placeholder (the .skeleton animation lives in index.css).
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton', className)} />;
}
