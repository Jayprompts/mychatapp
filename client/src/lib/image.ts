// Shrinks photos on the device before upload: faster on mobile data, and the server re-encodes anyway.

const MAX_SIDE = 1600;
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

export type PreparedImage = { blob: Blob; width: number; height: number };

export class ImagePrepError extends Error {}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) throw new ImagePrepError(`"${file.name}" isn't an image.`);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new ImagePrepError(`"${file.name}" couldn't be opened. Try a JPG or PNG.`);
  }
  const { width, height } = bitmap;

  // Animated GIFs would lose their animation on a canvas — send them as they are (server still checks them).
  if (file.type === 'image/gif') {
    bitmap.close();
    if (file.size > MAX_UPLOAD_BYTES) throw new ImagePrepError('That GIF is too large (max 12 MB).');
    return { blob: file, width, height };
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // WebP where supported (older Safari silently returns PNG instead -> use JPEG there).
  let blob = await canvasToBlob(canvas, 'image/webp', 0.85);
  if (!blob || blob.type !== 'image/webp') blob = await canvasToBlob(canvas, 'image/jpeg', 0.85);
  if (!blob) throw new ImagePrepError(`"${file.name}" couldn't be processed.`);

  return { blob, width: canvas.width, height: canvas.height };
}
