import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { THEME_GRADIENTS } from '../themes';
import type { CommunityTheme } from '../types';

// Rounded square with the community's theme gradient + emoji icon (the design's community avatar).
export function CommunityAvatar({
  icon,
  theme,
  size = 44,
  className,
}: {
  icon: string;
  theme: CommunityTheme;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn('inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size, borderRadius: size * 0.28, background: THEME_GRADIENTS[theme], fontSize: size * 0.46 }}
    >
      {icon}
    </span>
  );
}

// Banner: the uploaded cover photo, or the theme gradient.
export function CommunityCover({
  coverUrl,
  theme,
  className,
  children,
}: {
  coverUrl: string | null;
  theme: CommunityTheme;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn('relative overflow-hidden', className)} style={{ background: THEME_GRADIENTS[theme] }}>
      {coverUrl && <img src={coverUrl} alt="" className="absolute inset-0 size-full object-cover" />}
      {children}
    </div>
  );
}
