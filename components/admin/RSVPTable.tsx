"use client";

import { useMemo, useState } from "react";
import { Download, Trash2 } from "lucide-react";

type RSVP = {
  id: string;
  attendanceStatus: "ACCEPTED" | "DECLINED" | "PENDING";
  guestCount: number;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  guest: { fullName: string };
};

export default function RSVPTable({ initialRsvps }: { initialRsvps: RSVP[] }) {
  const [rsvps, setRsvps] = useState(initialRsvps);
  const [status, setStatus] = useState("ALL");
  const filtered = useMemo(() => rsvps.filter((rsvp) => status === "ALL" || rsvp.attendanceStatus === status), [rsvps, status]);

  async function remove(id: string) {
    await fetch(`/api/admin/rsvp/${id}`, { method: "DELETE" });
    setRsvps((current) => current.filter((rsvp) => rsvp.id !== id));
  }

  return (
    <div className="admin-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sage/15 p-4">
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-full border border-sage/20 bg-white px-3 py-2 text-sm">
          <option value="ALL">All</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="PENDING">Pending</option>
          <option value="DECLINED">Declined</option>
        </select>
        <button onClick={() => window.open("/api/admin/rsvp/export", "_self")} className="inline-flex items-center gap-2 rounded-full bg-sage px-4 py-2 text-sm font-bold text-white">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-cream/70 text-xs uppercase tracking-widest text-sage">
            <tr>
              <th className="px-4 py-3">Guest Name</th>
              <th className="px-4 py-3">Attendance</th>
              <th className="px-4 py-3">Guests</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((rsvp) => (
              <tr key={rsvp.id} className="border-t border-sage/10">
                <td className="px-4 py-3 font-bold text-ink">{rsvp.guest.fullName}</td>
                <td className="px-4 py-3">{rsvp.attendanceStatus}</td>
                <td className="px-4 py-3">{rsvp.guestCount}</td>
                <td className="max-w-xs px-4 py-3 text-muted">{rsvp.message || "—"}</td>
                <td className="px-4 py-3 text-muted">{new Date(rsvp.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button aria-label="Delete RSVP" onClick={() => remove(rsvp.id)} className="grid h-9 w-9 place-items-center rounded-full border border-red-200 text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
