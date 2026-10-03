import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uploadMedia } from "@/lib/media";

export async function POST(request: Request) {
  await requireAdmin();
  try {
    const asset = await uploadMedia(await request.formData());
    return Response.json(asset, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  await requireAdmin();
  const body = (await request.json()) as { id: string; alt?: string; sortOrder?: number };
  const asset = await prisma.mediaAsset.update({
    where: { id: body.id },
    data: {
      alt: body.alt,
      sortOrder: body.sortOrder
    }
  });
  return Response.json(asset);
}

export async function DELETE(request: Request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "Missing media id." }, { status: 400 });
  await prisma.mediaAsset.delete({ where: { id } });
  return Response.json({ ok: true });
}
