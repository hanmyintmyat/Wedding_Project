import { apiError } from "@/lib/api-errors";
import { RSVPStatus } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth";
import { getPrismaClient } from "@/lib/db";

export async function GET(request: Request) {
  try {
  await requireAdmin(request);
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const rsvps = await getPrismaClient().rSVP.findMany({
    where: status && status !== "ALL" ? { attendanceStatus: status as RSVPStatus } : {},
    include: { guest: true },
    orderBy: { updatedAt: "desc" }
  });
  return Response.json(rsvps);

  } catch (error) { return apiError(error); }
}
