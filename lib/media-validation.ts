import { z } from 'zod';
import { mediaMetaSchema } from './validations';

export const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const audioTypes = ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/ogg'];
export const IMAGE_LIMIT = 5 * 1024 * 1024;
export const AUDIO_LIMIT = 15 * 1024 * 1024;
export const uploadMetaSchema = mediaMetaSchema.extend({
  replaceId: z.string().min(1).optional(),
  filename: z.string().min(1).max(200),
  contentType: z.string(),
  size: z.number().int().positive()
}).superRefine((value, ctx) => {
  const music = value.type === 'MUSIC';
  const extension = value.filename.split('.').pop()?.toLowerCase();
  const extensions = music ? ['mp3', 'm4a', 'ogg'] : ['jpg', 'jpeg', 'png', 'webp', 'avif'];
  if (!(music ? audioTypes : imageTypes).includes(value.contentType) || !extensions.includes(extension || '')) {
    ctx.addIssue({ code: 'custom', message: music ? 'Choose MP3, M4A, or OGG audio.' : 'Choose JPG, PNG, WebP, or AVIF photos.' });
  }
  if (value.size > (music ? AUDIO_LIMIT : IMAGE_LIMIT)) ctx.addIssue({ code: 'custom', message: music ? 'Music must be 15 MB or smaller.' : 'Photos must be 5 MB or smaller.' });
});
