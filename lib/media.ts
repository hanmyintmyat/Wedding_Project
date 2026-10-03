import { del, head } from '@vercel/blob';
import { Prisma, type MediaAsset } from '@/generated/prisma/client';
import { getPrismaClient } from './db';
import { ApiError } from './api-errors';
import { imageTypes, audioTypes, IMAGE_LIMIT, AUDIO_LIMIT } from './media-validation';
import { invalidateWeddingContent } from './revalidate';

export function requireBlobStorage() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new ApiError('Media storage is not configured. Connect Vercel Blob to the project.', 503);
}

export async function deleteBlobIfUnused(url: string) {
  if (!url.startsWith('https://') || !new URL(url).hostname.endsWith('.public.blob.vercel-storage.com')) return;
  if (await getPrismaClient().mediaAsset.count({ where: { url } })) return;
  // A committed replacement remains usable even if CDN cleanup needs a retry.
  try { await del(url); } catch { console.error('[media] Blob cleanup unavailable'); }
}

export async function completeMediaUpload(id: string, url: string) {
  requireBlobStorage();
  const pending = await getPrismaClient().mediaUpload.findUnique({ where: { id } });
  if (!pending) throw new ApiError('Upload authorization expired. Please upload again.');
  if (pending.completedAt) return getPrismaClient().mediaAsset.findUnique({ where: { id } });
  // Query this store by authorized pathname, never fetch a client-supplied URL.
  const blob = await head(pending.pathname);
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
