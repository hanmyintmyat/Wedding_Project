import { randomUUID } from 'node:crypto';
import { BlobError } from '@vercel/blob';
import { Prisma } from '@/generated/prisma/client';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireAdmin } from '@/lib/auth';
import { apiError, ApiError } from '@/lib/api-errors';
import { getPrismaClient } from '@/lib/db';
import { uploadMetaSchema, uploadPathSchema } from '@/lib/media-validation';
import { completeMediaUpload, requireBlobStorage } from '@/lib/media';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json() as HandleUploadBody;
    if (!body || typeof body !== 'object') throw new ApiError('Invalid upload request.');
    if (body.type === 'blob.generate-client-token') {
      await requireAdmin(request);
      if (!body.payload || typeof body.payload.pathname !== 'string' || (body.payload.clientPayload !== null && typeof body.payload.clientPayload !== 'string')) throw new ApiError('Invalid upload request.');
    } else if (body.type === 'blob.upload-completed') {
      if (!/^[a-f0-9]{64}$/i.test(request.headers.get('x-vercel-signature') || '')) throw new ApiError('Invalid upload callback.', 403);
    } else {
      throw new ApiError('Invalid upload request.');
    }
    const token = requireBlobStorage();
    const response = await handleUpload({
      request, body, token,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        await requireAdmin(request);
        const meta = uploadMetaSchema.parse(JSON.parse(clientPayload || '{}'));
        uploadPathSchema.parse(pathname);
        if (pathname.split('/')[2] !== meta.filename.replace(/[^a-zA-Z0-9._-]/g, '-')) throw new ApiError('Invalid upload filename.');
        if (meta.replaceId) {
          const previous = await getPrismaClient().mediaAsset.findUnique({ where: { id: meta.replaceId } });
          if (!previous || previous.type !== meta.type) throw new ApiError('Choose an existing file of the same type to replace.');
        }
        const id = pathname.split('/')[1] || randomUUID();
        await getPrismaClient().mediaUpload.create({ data: { id, pathname, type: meta.type, alt: meta.alt, sortOrder: meta.sortOrder, replaceId: meta.replaceId } });
        return {
          allowedContentTypes: [meta.contentType],
          maximumSizeInBytes: meta.size,
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') return apiError(new ApiError('Media upload database setup is incomplete. Apply the existing migrations for this deployment.', 503));
    if (error instanceof BlobError) {
      if (['Missing callback signature', 'Invalid callback signature'].includes(error.message.replace(/^Vercel Blob: /, ''))) return apiError(new ApiError('Invalid upload callback.', 403));
      return apiError(new ApiError('Unable to start upload. Please check Blob storage configuration.', 503));
    }
    return apiError(error);
  }
}
