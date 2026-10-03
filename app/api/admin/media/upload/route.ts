import { randomUUID } from 'node:crypto';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireAdmin } from '@/lib/auth';
import { apiError, ApiError } from '@/lib/api-errors';
import { getPrismaClient } from '@/lib/db';
import { uploadMetaSchema, audioTypes, imageTypes, IMAGE_LIMIT, AUDIO_LIMIT } from '@/lib/media-validation';
import { completeMediaUpload, requireBlobStorage } from '@/lib/media';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json() as HandleUploadBody;
    if (body.type === "blob.generate-client-token") await requireAdmin(request);
    requireBlobStorage();
    const response = await handleUpload({
      request, body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        await requireAdmin(request);
        const meta = uploadMetaSchema.parse(JSON.parse(clientPayload || '{}'));
        if (!/^wedding\/[a-f0-9-]{36}\/[a-zA-Z0-9._-]+$/.test(pathname)) throw new ApiError('Invalid upload path.');
        if (meta.replaceId) {
          const previous = await getPrismaClient().mediaAsset.findUnique({ where: { id: meta.replaceId } });
          if (!previous || previous.type !== meta.type) throw new ApiError('Choose an existing file of the same type to replace.');
        }
        const id = pathname.split('/')[1] || randomUUID();
        await getPrismaClient().mediaUpload.create({ data: { id, pathname, type: meta.type, alt: meta.alt, sortOrder: meta.sortOrder, replaceId: meta.replaceId } });
        return {
          allowedContentTypes: meta.type === 'MUSIC' ? audioTypes : imageTypes,
          maximumSizeInBytes: meta.type === 'MUSIC' ? AUDIO_LIMIT : IMAGE_LIMIT,
          addRandomSuffix: false,
          allowOverwrite: false,
          validUntil: Date.now() + 15 * 60 * 1000,
          tokenPayload: JSON.stringify({ id })
        };
      },
      // handleUpload verifies the signed Blob callback. No browser session is present here.
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const { id } = JSON.parse(tokenPayload || '{}');
        await completeMediaUpload(id, blob.url);
      }
    });
    return Response.json(response);
  } catch (error) { return apiError(error); }
}
