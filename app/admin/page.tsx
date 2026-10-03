import DatabaseHealth from "@/components/admin/DatabaseHealth";
import DashboardStats from "@/components/admin/DashboardStats";
import PreviewPanel from "@/components/admin/PreviewPanel";
import { getAdminSession } from "@/lib/auth";
import { getDatabaseHealth } from "@/lib/database";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  if (!(await getAdminSession())) redirect("/admin/login");
  const health = await getDatabaseHealth();
  const fallback = { TotalGuests: 0, Invited: 0, Accepted: 0, Pending: 0, Declined: 0, TotalRSVPGuests: 0 };
  const stats = await prisma.guest
    .findMany({ include: { rsvp: true } })
    .then((guests) => ({
      TotalGuests: guests.length,
      Invited: guests.length,
      Accepted: guests.filter((guest) => guest.status === "ACCEPTED").length,
      Pending: guests.filter((guest) => guest.status === "PENDING").length,
      Declined: guests.filter((guest) => guest.status === "DECLINED").length,
      TotalRSVPGuests: guests.reduce((sum, guest) => sum + (guest.rsvp?.guestCount || 0), 0)
    }))
    .catch(() => fallback);

  const recent = await prisma.rSVP.findMany({ include: { guest: true }, orderBy: { updatedAt: "desc" }, take: 5 }).catch(() => []);

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Dashboard</p>
        <h1 className="mt-2 font-serif text-4xl">Wedding Invitation Overview</h1>
      </div>
      <DatabaseHealth health={health} />
      <DashboardStats stats={stats} />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="admin-panel p-5">
          <h2 className="font-serif text-2xl">Recent RSVP Responses</h2>
          <div className="mt-4 grid gap-3">
            {recent.map((rsvp) => (
              <div key={rsvp.id} className="rounded-2xl border border-sage/15 bg-white/60 p-4">
                <p className="font-bold text-ink">{rsvp.guest.fullName}</p>
                <p className="mt-1 text-sm text-muted">{rsvp.attendanceStatus} • {rsvp.guestCount} guest(s)</p>
              </div>
            ))}
            {!recent.length && <p className="text-sm text-muted">No RSVP responses yet.</p>}
          </div>
        </div>
        <PreviewPanel />
      </div>
    </div>
  );
}
