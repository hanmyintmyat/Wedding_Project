import { RSVPStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { guestSchema } from "@/lib/validations";
import { slugifyName } from "@/lib/invitation-utils";

export async function GET(request: Request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status");
  const guests = await prisma.guest.findMany({
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
}

export async function POST(request: Request) {
  await requireAdmin();
  const data = guestSchema.parse(await request.json());
  const guest = await prisma.guest.create({
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
}
