import { del, head } from '@vercel/blob';
import { Prisma, type MediaAsset } from '@/generated/prisma/client';
import { getPrismaClient } from './db';
import { ApiError } from './api-errors';
import { imageTypes, audioTypes, IMAGE_LIMIT, AUDIO_LIMIT, uploadPathSchema } from './media-validation';
import { invalidateWeddingContent } from './revalidate';

export function isBlobStorageConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function requireBlobStorage() {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new ApiError('Media upload is not configured for this deployment. Connect a public Vercel Blob store and set BLOB_READ_WRITE_TOKEN on the server.', 503);
  return token;
}

export async function deleteBlobIfUnused(url: string) {
  if (!URL.canParse(url)) return;
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.public.blob.vercel-storage.com') || !uploadPathSchema.safeParse(parsed.pathname.slice(1)).success) return;
  // A committed replacement remains usable even if CDN cleanup needs a retry.
  try {
    if (await getPrismaClient().mediaAsset.count({ where: { url } })) return;
    await del(url, { token: requireBlobStorage() });
  } catch { console.error('[media] Blob cleanup unavailable'); }
}

export async function completeMediaUpload(id: string, url: string) {
  const token = requireBlobStorage();
  const pending = await getPrismaClient().mediaUpload.findUnique({ where: { id } });
  if (!pending) throw new ApiError('Upload authorization expired. Please upload again.');
  if (pending.completedAt) return getPrismaClient().mediaAsset.findUnique({ where: { id } });
  // Query this store by authorized pathname, never fetch a client-supplied URL.
  const blob = await head(pending.pathname, { token });
  const music = pending.type === 'MUSIC';
  if (blob.url !== url || !(music ? audioTypes : imageTypes).includes(blob.contentType) || blob.size > (music ? AUDIO_LIMIT : IMAGE_LIMIT)) {
    throw new ApiError('The uploaded file is not valid.');
  }
  let result: { asset: MediaAsset | null; oldUrls: string[] } | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      result = await getPrismaClient().$transaction(async tx => {
        const intent = await tx.mediaUpload.findUniqueOrThrow({ where: { id } });
        if (intent.completedAt) return { asset: await tx.mediaAsset.findUnique({ where: { id } }), oldUrls: [] };
        const old = await tx.mediaAsset.findMany({ where: intent.type === 'GALLERY' ? { id: intent.replaceId || '__none__' } : { type: intent.type } });
        const asset = await tx.mediaAsset.create({ data: { id, type: intent.type, url: blob.url, alt: intent.alt, sortOrder: intent.sortOrder } });
        await tx.mediaAsset.deleteMany({ where: { id: { in: old.map(a => a.id) } } });
        await tx.mediaUpload.update({ where: { id }, data: { completedAt: new Date() } });
        return { asset, oldUrls: old.map(a => a.url) };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      break;
    } catch (error) {
      if (attempt < 2 && error instanceof Prisma.PrismaClientKnownRequestError && ['P2034', 'P2002'].includes(error.code)) continue;
      throw error;
    }
  }
  if (!result) throw new ApiError('Could not save the uploaded file. Please try again.', 503);
  invalidateWeddingContent();
  await Promise.all(result.oldUrls.map(deleteBlobIfUnused));
  return result.asset;
}
