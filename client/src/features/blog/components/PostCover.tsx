import type { ReactNode } from 'react';
import { THEME_GRADIENTS } from '@/features/communities/themes';
import { cn } from '@/lib/cn';
import type { PostCoverTheme } from '../types';

// Each gradient gets its own subtle pattern (per the design), so posts without a photo still look distinct.
const PATTERNS: Record<PostCoverTheme, ReactNode> = {
  grove: (
    <g opacity="0.25" fill="white">
      <rect x="20" y="30" width="120" height="70" rx="16" />
      <path d="M20 100l8 16h8V100" />
      <rect x="100" y="90" width="100" height="60" rx="16" />
      <path d="M200 150l-8 16h-8V150" />
    </g>
  ),
  ocean: (
    <g opacity="0.2" fill="white">
      {Array.from({ length: 7 }, (_, r) => Array.from({ length: 11 }, (_, c) => <circle key={`${r}-${c}`} cx={14 + c * 26} cy={14 + r * 22} r="4.5" />))}
    </g>
  ),
  forest: (
    <g opacity="0.2" fill="white">
      <path d="M0 70 Q40 40 80 70 Q120 100 160 70 Q200 40 240 70 Q260 85 280 70 V160 H0Z" />
      <path d="M0 105 Q40 75 80 105 Q120 135 160 105 Q200 75 240 105 Q260 120 280 105 V160 H0Z" opacity="0.5" />
    </g>
  ),
  sunset: (
    <g opacity="0.15" stroke="white" strokeWidth="1.5">
      {Array.from({ length: 6 }, (_, i) => <line key={`h${i}`} x1="0" y1={i * 30} x2="280" y2={i * 30} />)}
      {Array.from({ length: 10 }, (_, i) => <line key={`v${i}`} x1={i * 32} y1="0" x2={i * 32} y2="160" />)}
    </g>
  ),
  berry: (
    <g opacity="0.2" stroke="white" strokeWidth="1.5" fill="none">
      <circle cx="60" cy="60" r="50" />
      <circle cx="160" cy="40" r="70" />
      <circle cx="240" cy="120" r="45" />
      <circle cx="40" cy="130" r="35" />
    </g>
  ),
  night: (
    <g opacity="0.2" stroke="white" fill="none">
      <circle cx="140" cy="80" r="90" strokeWidth="20" />
      <circle cx="140" cy="80" r="50" strokeWidth="12" />
      <circle cx="140" cy="80" r="15" fill="white" />
    </g>
  ),
};

// A post's cover: the uploaded photo, or its gradient + pattern.
export function PostCover({
  coverUrl,
  theme,
  className,
  children,
}: {
  coverUrl: string | null;
  theme: PostCoverTheme;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn('relative shrink-0 overflow-hidden', className)} style={coverUrl ? undefined : { background: THEME_GRADIENTS[theme] }}>
      {coverUrl ? (
        <img src={coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <svg viewBox="0 0 280 160" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
          {PATTERNS[theme]}
        </svg>
      )}
      {children}
    </div>
  );
}
