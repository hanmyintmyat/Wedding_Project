import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

function cell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET() {
  await requireAdmin();
  const guests = await prisma.guest.findMany({ include: { rsvp: true }, orderBy: { fullName: "asc" } });
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
      `/invite?to=${encodeURIComponent(guest.fullName)}`
    ])
  ];
  return new Response(rows.map((row) => row.map(cell).join(",")).join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=guests.csv"
    }
  });
}
