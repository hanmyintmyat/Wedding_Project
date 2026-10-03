import { RSVPStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rsvpSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  await requireAdmin();
  const { id } = await params;
  const data = rsvpSchema.parse(await request.json());
  const rsvp = await prisma.rSVP.update({
    where: { id },
    data: {
      attendanceStatus: data.attendanceStatus as RSVPStatus,
      guestCount: data.guestCount,
      message: data.message || null,
      guest: {
        update: {
          fullName: data.guestName,
          status: data.attendanceStatus as RSVPStatus
        }
      }
    },
    include: { guest: true }
  });
  return Response.json(rsvp);
}

export async function DELETE(_request: Request, { params }: Params) {
  await requireAdmin();
  const { id } = await params;
  await prisma.rSVP.delete({ where: { id } });
  return Response.json({ ok: true });
}
