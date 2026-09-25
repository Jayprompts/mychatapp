import { useCallback, useEffect, useRef, useState } from 'react';

export const MAX_RECORDING_MS = 5 * 60 * 1000;
const WAVEFORM_BARS = 48;
const LIVE_BARS = 40;
const SAMPLE_EVERY_MS = 80;

// First format this browser can record. AAC-in-MP4 plays everywhere (incl. iPhone);
// Chrome/Firefox fall back to Opus-in-WebM.
const PREFERRED_TYPES = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];

export type RecorderState =
  | { status: 'idle' }
  | { status: 'requesting' } // waiting for the "allow microphone?" prompt
  | { status: 'recording' }
  | { status: 'denied' } // user (or browser settings) blocked the microphone
  | { status: 'error'; message: string };

export type Recording = { blob: Blob; durationMs: number; waveform: number[] };

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return PREFERRED_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
}

// Squash the loudness samples into N bars, scaled so the loudest bar is 1.
function toWaveform(levels: number[], bars = WAVEFORM_BARS): number[] {
  if (levels.length === 0) return Array(bars).fill(0.1);
  const out: number[] = [];
  for (let i = 0; i < bars; i++) {
    const start = Math.floor((i * levels.length) / bars);
    const end = Math.max(start + 1, Math.floor(((i + 1) * levels.length) / bars));
    const slice = levels.slice(start, end);
    out.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  const peak = Math.max(...out, 0.01);
  return out.map((v) => Math.max(0.08, Math.min(1, v / peak)));
}

export function useVoiceRecorder({ onAutoStop }: { onAutoStop?: (r: Recording) => void } = {}) {
  const [state, setState] = useState<RecorderState>({ status: 'idle' });
  const [elapsedMs, setElapsedMs] = useState(0);
  const [liveLevels, setLiveLevels] = useState<number[]>([]);

  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const chunks = useRef<Blob[]>([]);
  const levels = useRef<number[]>([]);
  const startedAt = useRef(0);
  const ticker = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const finish = useRef<((r: Recording | null) => void) | null>(null);
  const autoStop = useRef(onAutoStop);
  useEffect(() => {
    autoStop.current = onAutoStop; // always call the latest callback
  }, [onAutoStop]);

  const release = useCallback(() => {
    clearInterval(ticker.current);
    stream.current?.getTracks().forEach((t) => t.stop()); // turns off the browser's "recording" indicator
    void audioCtx.current?.close().catch(() => {});
    stream.current = null;
    audioCtx.current = null;
    recorder.current = null;
  }, []);

  useEffect(() => release, [release]); // leaving the chat mid-recording releases the mic

  const stopInternal = useCallback((keep: boolean): Promise<Recording | null> => {
    const rec = recorder.current;
    if (!rec || rec.state === 'inactive') return Promise.resolve(null);
    return new Promise((resolve) => {
      finish.current = keep ? resolve : () => resolve(null);
      rec.stop();
    });
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setState({ status: 'error', message: 'Voice notes need a secure (https) connection and a modern browser.' });
      return;
    }
    setState({ status: 'requesting' });

    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') setState({ status: 'denied' });
      else if (name === 'NotFoundError') setState({ status: 'error', message: 'No microphone found on this device.' });
      else setState({ status: 'error', message: "Couldn't start the microphone." });
      return;
    }

    // Loudness meter for the waveform (live bars while recording + the saved waveform).
    const ctx = new AudioContext();
    audioCtx.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(stream.current).connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);

    const mimeType = pickMimeType();
    const rec = new MediaRecorder(stream.current, mimeType ? { mimeType, audioBitsPerSecond: 48_000 } : undefined);
    recorder.current = rec;
    chunks.current = [];
    levels.current = [];

    rec.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
    rec.onstop = () => {
      const durationMs = Date.now() - startedAt.current;
      const recording: Recording = {
        blob: new Blob(chunks.current, { type: rec.mimeType || mimeType || 'audio/webm' }),
        durationMs,
        waveform: toWaveform(levels.current),
      };
      release();
      setState({ status: 'idle' });
      setElapsedMs(0);
      setLiveLevels([]);
      finish.current?.(recording);
      finish.current = null;
    };

    startedAt.current = Date.now();
    rec.start(250); // collect data every 250ms so nothing is lost if the tab closes

    ticker.current = setInterval(() => {
      analyser.getByteTimeDomainData(samples);
      let sum = 0;
      for (const s of samples) sum += ((s - 128) / 128) ** 2;
      const rms = Math.sqrt(sum / samples.length);
      levels.current.push(rms);
      setLiveLevels((prev) => [...prev.slice(-(LIVE_BARS - 1)), Math.min(1, rms * 4)]);

      const elapsed = Date.now() - startedAt.current;
      setElapsedMs(elapsed);
      if (elapsed >= MAX_RECORDING_MS) {
        void stopInternal(true).then((r) => r && autoStop.current?.(r));
      }
    }, SAMPLE_EVERY_MS);

    setState({ status: 'recording' });
  }, [release, stopInternal]);

  const stop = useCallback(() => stopInternal(true), [stopInternal]);
  const cancel = useCallback(() => void stopInternal(false), [stopInternal]);
  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, elapsedMs, liveLevels, start, stop, cancel, reset };
}
