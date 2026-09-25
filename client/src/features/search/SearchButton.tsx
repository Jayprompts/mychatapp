import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { openSearch } from './api';

// Rail (tablet+) and phone-header entry points to the search overlay.
export function SearchButton({ variant }: { variant: 'rail' | 'header' }) {
  return (
    <button
      type="button"
      onClick={openSearch}
      aria-label="Search"
      title="Search (⌘K)"
      className={cn(
        'flex items-center justify-center text-text-secondary transition-colors hover:text-text-primary',
        variant === 'rail' ? 'size-11 rounded-[14px] hover:bg-bg' : 'size-10 rounded-full text-text-primary hover:bg-bg sm:hidden',
      )}
    >
      <Search size={variant === 'rail' ? 22 : 21} strokeWidth={1.8} />
    </button>
  );
}
