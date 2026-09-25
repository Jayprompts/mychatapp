import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp, { type OutputInfo } from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { uploadsDir } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export const MEDIA_LIMITS = {
  uploadBytes: 12 * 1024 * 1024, // hard cap per upload (multer)
  voiceBytes: 10 * 1024 * 1024,
  voiceMaxMs: 5 * 60 * 1000, // 5 minutes
  imageMaxSide: 2048,
};

// What the file REALLY is (from its bytes, not its name) -> how we store it.
const VOICE_FORMATS: Record<string, { ext: string; mime: string }> = {
  'audio/webm': { ext: 'webm', mime: 'audio/webm' },
  'video/webm': { ext: 'webm', mime: 'audio/webm' }, // WebM is detected as video even when audio-only
  'audio/ogg': { ext: 'ogg', mime: 'audio/ogg' },
  'audio/mp4': { ext: 'm4a', mime: 'audio/mp4' },
  'audio/x-m4a': { ext: 'm4a', mime: 'audio/mp4' },
  'video/mp4': { ext: 'm4a', mime: 'audio/mp4' }, // Safari records audio into an .mp4 container
  'audio/mpeg': { ext: 'mp3', mime: 'audio/mpeg' },
  'audio/aac': { ext: 'aac', mime: 'audio/aac' },
};
const IMAGE_INPUTS = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

export type StoredMedia = {
  key: string;
  mimeType: string;
  size: number;
  durationMs?: number;
  waveform?: number[];
  width?: number;
  height?: number;
};

// "images/2026/09/<uuid>.webp" — random names, grouped by month so no folder gets huge.
function newKey(folder: 'images' | 'voice', ext: string): string {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${folder}/${now.getUTCFullYear()}/${month}/${crypto.randomUUID()}.${ext}`;
}

export function mediaPath(key: string): string {
  const full = path.resolve(uploadsDir, key);
  if (!full.startsWith(uploadsDir + path.sep)) throw new AppError(400, 'Invalid media path'); // no ../ tricks
  return full;
}

async function writeMedia(key: string, data: Buffer) {
  const full = mediaPath(key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, data, { flag: 'wx' });
}

export async function deleteMedia(key: string) {
  await fs.rm(mediaPath(key), { force: true });
}

/**
 * Photos are always re-encoded: rotated upright, capped at 2048px, converted to WebP and stripped of
 * metadata — so phone photos never leak their GPS location, and odd/huge files can't reach other users.
 */
export async function storeImage(buffer: Buffer): Promise<StoredMedia> {
  const type = await fileTypeFromBuffer(buffer);
  if (!type || !IMAGE_INPUTS.has(type.mime)) {
    throw new AppError(415, 'Unsupported image. Use a JPG, PNG, WebP, GIF or AVIF photo.');
  }

  let result: { data: Buffer; info: OutputInfo };
  try {
    result = await sharp(buffer, { animated: true, limitInputPixels: 50_000_000 })
      .rotate() // respect the camera's orientation, then drop it
      .resize({ width: MEDIA_LIMITS.imageMaxSide, height: MEDIA_LIMITS.imageMaxSide, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true }); // metadata is not copied unless asked for
  } catch {
    throw new AppError(422, "That image couldn't be processed. Try a different photo.");
  }

  const key = newKey('images', 'webp');
  await writeMedia(key, result.data);
  return {
    key,
    mimeType: 'image/webp',
    size: result.data.length,
    width: result.info.width,
    height: result.info.pageHeight ?? result.info.height, // animated GIFs: height of one frame
  };
}

export async function storeVoice(buffer: Buffer, durationMs: number, waveform: number[]): Promise<StoredMedia> {
  if (buffer.length > MEDIA_LIMITS.voiceBytes) throw new AppError(413, 'Voice message is too large (max 10 MB).');

  const type = await fileTypeFromBuffer(buffer);
  const format = type ? VOICE_FORMATS[type.mime] : undefined;
  if (!format) throw new AppError(415, 'Unsupported audio format.');

  const key = newKey('voice', format.ext);
  await writeMedia(key, buffer);
  return { key, mimeType: format.mime, size: buffer.length, durationMs, waveform };
}
