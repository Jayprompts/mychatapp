import { cn } from '@/lib/cn';
import type { PostTag } from '../types';

const COLORS: Record<PostTag, string> = {
  Tech: 'bg-primary/8 text-primary',
  Design: 'bg-accent/10 text-accent',
  Product: 'bg-success/10 text-success',
  Community: 'bg-warning/12 text-warning-ink',
  Lifestyle: 'bg-[#EC4899]/12 text-pink-ink',
  News: 'bg-error/8 text-error',
  Tutorial: 'bg-[#14B8A6]/12 text-teal-ink',
  Other: 'bg-text-secondary/10 text-text-secondary',
};

export function TagChip({ tag, className }: { tag: PostTag; className?: string }) {
  return <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold', COLORS[tag], className)}>{tag}</span>;
}
