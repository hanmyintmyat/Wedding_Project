import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { getPrismaClient } from '@/lib/db';
import { apiError, ApiError } from '@/lib/api-errors';
import { completeMediaUpload, deleteBlobIfUnused } from '@/lib/media';
import { invalidateWeddingContent } from '@/lib/revalidate';

export const runtime = 'nodejs';
export async function GET() {
  try { await requireAdmin(); return Response.json(await getPrismaClient().mediaAsset.findMany({ orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }] })); }
  catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const data = z.object({ id: z.string().uuid(), url: z.string().url() }).parse(await request.json());
    const asset = await completeMediaUpload(data.id, data.url);
    if (!asset) throw new ApiError('This file was replaced or deleted. Refresh the library.', 409);
    return Response.json(asset, { status: 201 });
  } catch (error) { return apiError(error); }
}
export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const body = z.object({ id: z.string().min(1), alt: z.string().max(160).optional(), sortOrder: z.number().int().min(0).max(100).optional() }).parse(await request.json());
    const { id, ...data } = body;
    const asset = await getPrismaClient().mediaAsset.update({ where: { id }, data });
    invalidateWeddingContent();
    return Response.json(asset);
  } catch (error) { return apiError(error); }
}
export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);
    const id = z.string().min(1).parse(new URL(request.url).searchParams.get('id'));
    const asset = await getPrismaClient().mediaAsset.delete({ where: { id } });
    invalidateWeddingContent();
    await deleteBlobIfUnused(asset.url);
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}
