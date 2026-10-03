import { apiError } from "@/lib/api-errors";
import { RSVPStatus } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth";
import { getPrismaClient } from "@/lib/db";
import { guestSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
  await requireAdmin(request);
  const { id } = await params;
  const data = guestSchema.parse(await request.json());
  const guest = await getPrismaClient().guest.update({
    where: { id },
    data: {
      ...data,
      status: data.status as RSVPStatus,
      displayName: data.displayName || null,
      personalizedGreeting: data.personalizedGreeting || null,
      email: data.email || null,
      phone: data.phone || null,
      notes: data.notes || null
    }
  });
  return Response.json(guest);

  } catch (error) { return apiError(error); }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
  await requireAdmin(_request);
  const { id } = await params;
  await getPrismaClient().guest.delete({ where: { id } });
  return Response.json({ ok: true });

  } catch (error) { return apiError(error); }
}
