import { cn } from '@/lib/cn';

const PALETTE = ['#0866FF', '#B620E0', '#00B2FF', '#31A24C', '#F7B928', '#FA383E', '#8B5CF6', '#EC4899'];

// Same name -> same color, every time.
function colorFor(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  );
}

type AvatarProps = {
  name: string;
  src?: string | null;
  size?: number;
  status?: 'online' | 'away' | 'offline';
  className?: string;
};

export function Avatar({ name, src, size = 40, status, className }: AvatarProps) {
  const dot = Math.max(8, Math.round(size * 0.28));

  return (
    <span className={cn('relative inline-flex shrink-0', className)} style={{ width: size, height: size }}>
      {src ? (
        <img src={src} alt={name} className="size-full rounded-full object-cover" />
      ) : (
        <span
          aria-label={name}
          role="img"
          className="flex size-full items-center justify-center rounded-full font-semibold text-white"
          style={{ background: colorFor(name), fontSize: size * 0.38 }}
        >
          {initialsOf(name)}
        </span>
      )}

      {status && status !== 'offline' && (
        <span
          aria-label={status}
          className={cn(
            'absolute right-0 bottom-0 rounded-full border-2 border-card',
            status === 'online' ? 'bg-online' : 'bg-warning',
          )}
          style={{ width: dot, height: dot }}
        />
      )}
    </span>
  );
}
