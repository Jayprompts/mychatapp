import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Message } from '../types';

const MAX_W = 280;
const MAX_H = 340;

// Fits the photo into a MAX_W × MAX_H box keeping its shape; the box is sized before the image
// loads (we know width/height), so the chat never jumps while photos load.
function boxSize(width: number | null, height: number | null) {
  if (!width || !height) return { width: MAX_W, height: 200 };
  const scale = Math.min(1, MAX_W / width, MAX_H / height);
  return { width: Math.max(120, Math.round(width * scale)), height: Math.max(90, Math.round(height * scale)) };
}

type Props = { message: Message; radiusClass: string; onOpen: () => void };

export function ImageBubble({ message, radiusClass, onOpen }: Props) {
  const [broken, setBroken] = useState(false);
  const media = message.media!;
  const src = message.local?.url ?? media.url;
  const size = boxSize(media.width, media.height);
  const uploading = message.status === 'sending';
  const progress = message.local?.progress ?? 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={broken}
      aria-label={message.text ? `Photo: ${message.text}` : 'Photo — open full screen'}
      className={cn(
        'relative block overflow-hidden bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        radiusClass,
      )}
      style={{ width: size.width, height: size.height, maxWidth: '100%' }}
    >
      {broken ? (
        <span className="flex size-full flex-col items-center justify-center gap-1 text-xs text-text-secondary">
          <ImageOff size={22} aria-hidden /> Photo unavailable
        </span>
      ) : (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
          className="size-full object-cover"
        />
      )}

      {uploading && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/35">
          <ProgressRing fraction={progress} />
        </span>
      )}
    </button>
  );
}

function ProgressRing({ fraction }: { fraction: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-label={`Uploading ${Math.round(fraction * 100)}%`}>
      <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.max(0.03, fraction))}
        transform="rotate(-90 24 24)"
        className="transition-[stroke-dashoffset] duration-200"
      />
    </svg>
  );
}
