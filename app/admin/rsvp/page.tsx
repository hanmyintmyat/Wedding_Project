import RSVPTable from "@/components/admin/RSVPTable";
import { getAdminSession } from "@/lib/auth";
import { getPrismaClient } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function RSVPAdminPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  const rsvps = await getPrismaClient().rSVP.findMany({ include: { guest: true }, orderBy: { updatedAt: "desc" } });
  const serializable = rsvps.map((rsvp) => ({ ...rsvp, createdAt: rsvp.createdAt.toISOString(), updatedAt: rsvp.updatedAt.toISOString(), guest: { fullName: rsvp.guest.fullName } }));
  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">RSVP</p>
        <h1 className="mt-2 font-serif text-4xl">RSVP Responses</h1>
      </div>
      <RSVPTable initialRsvps={serializable} />
    </div>
  );
}
