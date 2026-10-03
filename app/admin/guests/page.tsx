import GuestTable from "@/components/admin/GuestTable";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function GuestsPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  const guests = await prisma.guest.findMany({ include: { rsvp: true }, orderBy: { createdAt: "desc" } }).catch(() => []);
  const serializable = guests.map((guest) => ({
    ...guest,
    displayName: guest.displayName || "",
    personalizedGreeting: guest.personalizedGreeting || "",
    email: guest.email || "",
    phone: guest.phone || "",
    notes: guest.notes || "",
    createdAt: guest.createdAt.toISOString(),
    updatedAt: guest.updatedAt.toISOString(),
    rsvp: guest.rsvp
      ? {
          attendanceStatus: guest.rsvp.attendanceStatus,
          guestCount: guest.rsvp.guestCount,
          message: guest.rsvp.message
        }
      : null
  }));
  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Guests</p>
        <h1 className="mt-2 font-serif text-4xl">Guest Management</h1>
      </div>
      <GuestTable initialGuests={serializable} siteUrl={process.env.NEXT_PUBLIC_SITE_URL || ""} />
    </div>
  );
}
