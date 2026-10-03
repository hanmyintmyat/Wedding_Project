import { RSVPStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { guestSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  await requireAdmin();
  const { id } = await params;
  const data = guestSchema.parse(await request.json());
  const guest = await prisma.guest.update({
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
}

export async function DELETE(_request: Request, { params }: Params) {
  await requireAdmin();
  const { id } = await params;
  await prisma.guest.delete({ where: { id } });
  return Response.json({ ok: true });
}
