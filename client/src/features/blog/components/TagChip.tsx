import { cn } from '@/lib/cn';
import type { PostTag } from '../types';

const COLORS: Record<PostTag, string> = {
  Tech: 'bg-primary/8 text-primary',
  Design: 'bg-[#B620E0]/8 text-[#B620E0]',
  Product: 'bg-success/10 text-success',
  Community: 'bg-warning/12 text-[#B68A00]',
  Lifestyle: 'bg-[#EC4899]/10 text-[#DB2777]',
  News: 'bg-error/8 text-error',
  Tutorial: 'bg-[#0F766E]/10 text-[#0F766E]',
  Other: 'bg-text-secondary/10 text-text-secondary',
};

export function TagChip({ tag, className }: { tag: PostTag; className?: string }) {
  return <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold', COLORS[tag], className)}>{tag}</span>;
}
