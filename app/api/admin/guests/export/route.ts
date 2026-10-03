import { invitationLink } from "@/lib/site-url";
import { apiError } from "@/lib/api-errors";
import { requireAdmin } from "@/lib/auth";
import { getPrismaClient } from "@/lib/db";

function cell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET() {
  try {
  await requireAdmin();
  const guests = await getPrismaClient().guest.findMany({ include: { rsvp: true }, orderBy: { fullName: "asc" } });
  const rows = [
    ["Full Name", "Display Name", "Email", "Phone", "Status", "Guest Count", "Message", "Invitation Link"],
    ...guests.map((guest) => [
      guest.fullName,
      guest.displayName || "",
      guest.email || "",
      guest.phone || "",
      guest.status,
      guest.rsvp?.guestCount || "",
      guest.rsvp?.message || "",
      invitationLink(guest.fullName)
    ])
  ];
  return new Response(rows.map((row) => row.map(cell).join(",")).join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=guests.csv"
    }
  });

  } catch (error) { return apiError(error); }
}
