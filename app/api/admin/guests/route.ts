import { apiError } from "@/lib/api-errors";
import { RSVPStatus } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth";
import { getPrismaClient } from "@/lib/db";
import { guestSchema } from "@/lib/validations";
import { slugifyName } from "@/lib/invitation-utils";

export async function GET(request: Request) {
  try {
  await requireAdmin(request);
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status");
  const guests = await getPrismaClient().guest.findMany({
    where: {
      AND: [
        q ? { fullName: { contains: q, mode: "insensitive" } } : {},
        status && status !== "ALL" ? { status: status as RSVPStatus } : {}
      ]
    },
    include: { rsvp: true },
    orderBy: { createdAt: "desc" }
  });
  return Response.json(guests);

  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
  await requireAdmin(request);
  const data = guestSchema.parse(await request.json());
  const guest = await getPrismaClient().guest.create({
    data: {
      ...data,
      status: data.status as RSVPStatus,
      inviteSlug: slugifyName(data.fullName),
      displayName: data.displayName || null,
      personalizedGreeting: data.personalizedGreeting || `Dear Beloved ${data.fullName}`,
      email: data.email || null,
      phone: data.phone || null,
      notes: data.notes || null
    }
  });
  return Response.json(guest, { status: 201 });

  } catch (error) { return apiError(error); }
}
