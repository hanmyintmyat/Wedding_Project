import { apiError } from "@/lib/api-errors";
import { RSVPStatus } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth";
import { getPrismaClient } from "@/lib/db";
import { rsvpSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
  await requireAdmin(request);
  const { id } = await params;
  const data = rsvpSchema.parse(await request.json());
  const rsvp = await getPrismaClient().rSVP.update({
    where: { id },
    data: {
      attendanceStatus: data.attendanceStatus as RSVPStatus,
      guestCount: data.attendanceStatus === "DECLINED" ? 0 : data.guestCount,
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

  } catch (error) { return apiError(error); }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
  await requireAdmin(_request);
  const { id } = await params;
  await getPrismaClient().$transaction(async tx => {
    const rsvp = await tx.rSVP.delete({ where: { id } });
    await tx.guest.update({ where: { id: rsvp.guestId }, data: { status: "PENDING" } });
  });
  return Response.json({ ok: true });

  } catch (error) { return apiError(error); }
}
