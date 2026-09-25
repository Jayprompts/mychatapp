import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { Modal } from '@/components/ui/Modal';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';
import { useUploadAvatar } from '../api';

const OUT = 512; // exported square, in pixels
const MAX_ZOOM = 3;
const INSET = 0.06; // the circle sits 6% in from each edge of the frame

type Loaded = { url: string; img: HTMLImageElement };

// Upload → crop & position inside a circle → save (per the design). Cropping happens in the browser,
// so only the framed square is uploaded; the server re-encodes it anyway.
export function AvatarCropDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [photo, setPhoto] = useState<Loaded | null>(null);
  const close = () => {
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto(null);
    onClose();
  };
  return (
    <Modal open={open} onClose={close} title={photo ? 'Crop & position' : 'Upload photo'}>
      {photo ? <Cropper photo={photo} onBack={() => setPhoto(null)} onDone={close} /> : <Picker onPicked={setPhoto} />}
    </Modal>
  );
}

function Picker({ onPicked }: { onPicked: (p: Loaded) => void }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const take = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('That file isn’t a photo.');
    if (file.size > 12 * 1024 * 1024) return setError('That photo is too big (max 12 MB).');
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => onPicked({ url, img });
    img.onerror = () => (URL.revokeObjectURL(url), setError("That photo couldn't be opened. Try another."));
    img.src = url;
  };

  return (
    <div className="p-5">
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
        onDragOver={(e) => (e.preventDefault(), setDragging(true))}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          take(e.dataTransfer.files[0]);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragging ? 'border-primary bg-primary/4' : 'border-border bg-bg hover:border-primary/40',
        )}
      >
        <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/8 text-primary">
          <Upload size={24} />
        </span>
        <p className="text-[15px] font-semibold text-text-primary">Drop your photo here</p>
        <p className="mt-1 mb-4 text-[13px] text-text-secondary">or click to browse files</p>
        <span className="rounded-full bg-primary/8 px-4 py-2 text-[13px] font-semibold text-primary">Choose photo</span>
      </div>
      <input ref={input} type="file" accept="image/*" className="sr-only" aria-label="Choose photo" onChange={(e) => take(e.target.files?.[0])} />
      {error && <div className="mt-3"><FormAlert>{error}</FormAlert></div>}
      <p className="mt-3 text-center text-xs text-text-secondary">JPG, PNG, WebP or GIF · up to 12 MB · you’ll frame it next</p>
    </div>
  );
}

function Cropper({ photo, onBack, onDone }: { photo: Loaded; onBack: () => void; onDone: () => void }) {
  const frame = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(300); // the square viewport, px
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // image centre relative to the viewport centre
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const save = useUploadAvatar();

  const { naturalWidth: w, naturalHeight: h } = photo.img;
  const scale = Math.max(size / w, size / h) * zoom; // "cover" the square, then zoom

  // Keep the photo covering the whole square (no empty corners).
  const clamp = (o: { x: number; y: number }, s = scale) => {
    const mx = Math.max(0, (w * s - size) / 2);
    const my = Math.max(0, (h * s - size) / 2);
    return { x: Math.min(mx, Math.max(-mx, o.x)), y: Math.min(my, Math.max(-my, o.y)) };
  };

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const setZoomClamped = (z: number) => {
    const next = Math.min(MAX_ZOOM, Math.max(1, z));
    setZoom(next);
    setOffset((o) => clamp(o, Math.max(size / w, size / h) * next));
  };

  const onPointerDown = (e: PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (d) setOffset(clamp({ x: d.ox + e.clientX - d.x, y: d.oy + e.clientY - d.y }));
  };

  const saveCrop = () => {
    // Export exactly what's inside the circle (what you see is what you get).
    const left = size / 2 - (w * scale) / 2 + offset.x;
    const top = size / 2 - (h * scale) / 2 + offset.y;
    const edge = size * INSET;
    const circle = size - 2 * edge;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = OUT;
    canvas.getContext('2d')!.drawImage(photo.img, (edge - left) / scale, (edge - top) / scale, circle / scale, circle / scale, 0, 0, OUT, OUT);
    canvas.toBlob(
      (blob) =>
        blob &&
        save.mutate(blob, {
          onSuccess: () => {
            toast('Profile photo updated');
            onDone();
          },
        }),
      'image/jpeg',
      0.92,
    );
  };

  return (
    <>
      <div className="p-5 pb-3">
        <div
          ref={frame}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => (drag.current = null)}
          onWheel={(e) => setZoomClamped(zoom - e.deltaY * 0.002)}
          className="relative aspect-square w-full cursor-grab touch-none overflow-hidden rounded-xl bg-[#111] select-none active:cursor-grabbing"
          aria-label="Drag to position your photo"
        >
          <img
            src={photo.url}
            alt=""
            draggable={false}
            className="pointer-events-none absolute max-w-none"
            style={{
              width: w * scale,
              height: h * scale,
              left: size / 2 - (w * scale) / 2 + offset.x,
              top: size / 2 - (h * scale) / 2 + offset.y,
            }}
          />
          {/* the circle that becomes the avatar; everything outside is dimmed */}
          <div className="pointer-events-none absolute inset-[6%] rounded-full border-[3px] border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />
        </div>
        <label className="mt-4 block">
          <span className="mb-2 flex justify-between text-xs font-medium text-text-secondary">
            Zoom <span className="font-semibold text-primary">{zoom.toFixed(1)}×</span>
          </span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoomClamped(Number(e.target.value))}
            aria-label="Zoom"
            className="w-full accent-primary"
          />
        </label>
        {save.isError && <div className="mt-3"><FormAlert>{errorMessage(save.error)}</FormAlert></div>}
      </div>
      <div className="flex justify-end gap-2.5 border-t border-border px-5 py-4">
        <Button variant="outline" onClick={onBack} disabled={save.isPending}>
          Choose another
        </Button>
        <Button onClick={saveCrop} loading={save.isPending}>
          Save photo
        </Button>
      </div>
    </>
  );
}
