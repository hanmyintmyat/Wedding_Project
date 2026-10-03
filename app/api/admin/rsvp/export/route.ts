import { apiError } from "@/lib/api-errors";
import { requireAdmin } from "@/lib/auth";
import { getPrismaClient } from "@/lib/db";

function cell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET() {
  try {
  await requireAdmin();
  const rsvps = await getPrismaClient().rSVP.findMany({ include: { guest: true }, orderBy: { updatedAt: "desc" } });
  const rows = [
    ["Guest Name", "Status", "Guest Count", "Message", "Submitted At", "Updated At"],
    ...rsvps.map((rsvp) => [rsvp.guest.fullName, rsvp.attendanceStatus, rsvp.guestCount, rsvp.message || "", rsvp.createdAt.toISOString(), rsvp.updatedAt.toISOString()])
  ];
  return new Response(rows.map((row) => row.map(cell).join(",")).join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=rsvp.csv"
    }
  });

  } catch (error) { return apiError(error); }
}
