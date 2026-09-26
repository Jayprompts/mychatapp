import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Message } from '../types';

const SPEEDS = [1, 1.5, 2] as const;
const PLAY_EVENT = 'grove:voice-play'; // only one voice note plays at a time

function formatClock(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

type Props = { message: Message; mine: boolean; radiusClass: string };

// Play/pause, waveform you can tap or drag to seek, elapsed/total time and a 1× / 1.5× / 2× speed chip.
export function VoiceBubble({ message, mine, radiusClass }: Props) {
  const media = message.media!;
  const src = message.local?.url ?? media.url;
  const durationMs = media.durationMs ?? 0;
  const bars = media.waveform?.length ? media.waveform : Array<number>(40).fill(0.3);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [failed, setFailed] = useState(false);
  const seeking = useRef(false);

  const progress = durationMs ? Math.min(1, positionMs / durationMs) : 0;

  // Pause when another voice note starts.
  useEffect(() => {
    const onOtherPlay = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== message.id) audioRef.current?.pause();
    };
    window.addEventListener(PLAY_EVENT, onOtherPlay);
    return () => window.removeEventListener(PLAY_EVENT, onOtherPlay);
  }, [message.id]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) return audio.pause();
    window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: message.id }));
    audio.playbackRate = speed;
    try {
      await audio.play();
    } catch {
      setFailed(true);
    }
  };

  const seekTo = (e: PointerEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !durationMs) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = (fraction * durationMs) / 1000;
    setPositionMs(fraction * durationMs);
  };

  const played = mine ? 'bg-white' : 'bg-primary-solid';
  const unplayed = mine ? 'bg-white/45' : 'bg-text-secondary/35';

  return (
    <div
      className={cn(
        'flex w-[260px] max-w-full items-center gap-2.5 py-2 pr-3 pl-2',
        radiusClass,
        mine ? 'gradient-message text-white' : 'bg-surface-2 text-text-primary',
      )}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setPositionMs(0);
        }}
        onTimeUpdate={(e) => !seeking.current && setPositionMs(e.currentTarget.currentTime * 1000)}
        onError={() => setFailed(true)}
      />

      <button
        type="button"
        onClick={toggle}
        disabled={failed}
        aria-label={playing ? 'Pause voice message' : 'Play voice message'}
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 disabled:opacity-50',
          mine ? 'bg-white text-primary' : 'gradient-brand text-white',
        )}
      >
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
      </button>

      <div className="min-w-0 flex-1">
        {/* Waveform = scrubber: tap or drag anywhere on it to seek */}
        <div
          role="slider"
          tabIndex={0}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(durationMs / 1000)}
          aria-valuenow={Math.round(positionMs / 1000)}
          aria-valuetext={`${formatClock(positionMs)} of ${formatClock(durationMs)}`}
          onKeyDown={(e) => {
            const audio = audioRef.current;
            if (!audio) return;
            if (e.key === 'ArrowRight') audio.currentTime = Math.min(durationMs / 1000, audio.currentTime + 5);
            if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 5);
          }}
          onPointerDown={(e) => {
            seeking.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            seekTo(e);
          }}
          onPointerMove={(e) => seeking.current && seekTo(e)}
          onPointerUp={() => (seeking.current = false)}
          onPointerCancel={() => (seeking.current = false)}
          className="relative flex h-7 cursor-pointer touch-none items-center gap-[2px]"
        >
          {bars.map((h, i) => (
            <span
              key={i}
              className={cn('min-w-[2px] flex-1 rounded-full', i / bars.length < progress ? played : unplayed)}
              style={{ height: `${Math.max(12, h * 100)}%` }}
            />
          ))}
          {/* scrubber dot */}
          <span
            className={cn('pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow', mine ? 'bg-white' : 'bg-primary-solid')}
            style={{ left: `${progress * 100}%` }}
          />
        </div>
        <div className={cn('mt-0.5 flex items-center justify-between text-[11px]', mine ? 'text-white/85' : 'text-text-secondary')}>
          <span>{failed ? "Can't play" : formatClock(playing || positionMs ? positionMs : durationMs)}</span>
          <button
            type="button"
            onClick={() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])}
            aria-label={`Playback speed ${speed}×`}
            className={cn('rounded-full px-1.5 py-px font-semibold', mine ? 'bg-white/20' : 'bg-text-secondary/15')}
          >
            {speed}×
          </button>
        </div>
      </div>
    </div>
  );
}
