import { RSVPStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const rsvps = await prisma.rSVP.findMany({
    where: status && status !== "ALL" ? { attendanceStatus: status as RSVPStatus } : {},
    include: { guest: true },
    orderBy: { updatedAt: "desc" }
  });
  return Response.json(rsvps);
}
