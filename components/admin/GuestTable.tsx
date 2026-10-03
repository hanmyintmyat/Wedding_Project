"use client";

import { adminFetch } from "@/lib/admin-fetch";
import { useMemo, useState } from "react";
import { Copy, Download, Plus, Search, Trash2 } from "lucide-react";
import GuestForm, { GuestPayload } from "./GuestForm";

type Guest = GuestPayload & {
  id: string;
  inviteSlug: string;
  createdAt: string;
  rsvp?: { attendanceStatus: string; guestCount: number; message: string | null } | null;
};

export default function GuestTable({ initialGuests, siteUrl }: { initialGuests: Guest[]; siteUrl: string }) {
  const [guests, setGuests] = useState(initialGuests);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [editing, setEditing] = useState<Guest | null>(null);
  const [invitation, setInvitation] = useState<{ name: string; url: string } | null>(null);
  const [notice, setNotice] = useState("");

  function invitationUrl(name: string) {
    const base = siteUrl || window.location.origin;
    return `${base.replace(/\/$/, "")}/invite?to=${encodeURIComponent(name)}`;
  }

  const filtered = useMemo(
    () => guests.filter((guest) => guest.fullName.toLowerCase().includes(query.toLowerCase()) && (status === "ALL" || guest.status === status)),
    [guests, query, status]
  );

  async function save(payload: GuestPayload) {
    const url = editing ? `/api/admin/guests/${editing.id}` : "/api/admin/guests";
    const saved = await adminFetch<Guest>(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setGuests((current) => (editing ? current.map((guest) => (guest.id === editing.id ? { ...guest, ...saved } : guest)) : [saved, ...current]));
    setEditing(null);
    setInvitation({ name: saved.fullName, url: invitationUrl(saved.fullName) });
    setNotice("Guest saved. Their invitation link is ready to share.");
  }

  async function remove(id: string) {
    try {
      await adminFetch(`/api/admin/guests/${id}`, { method: "DELETE" });
      setGuests((current) => current.filter((guest) => guest.id !== id));
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not delete guest."); }
  }

  async function copyLink(name: string) {
    const url = invitationUrl(name);
    setInvitation({ name, url });
    try {
      await navigator.clipboard.writeText(url);
      setNotice(`Invitation link copied for ${name}.`);
    } catch {
      setNotice("Select the invitation link below and copy it manually.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <GuestForm key={editing?.id || "new"} guest={editing || undefined} onSubmit={save} onCancel={() => setEditing(null)} />
      <div className="admin-panel overflow-hidden">
        <div className="grid gap-3 border-b border-sage/15 p-4">
          <p className="text-sm text-muted">Add a guest to create their personalized invitation link, then copy it to share.</p>
          <p role="status" className="text-sm text-sage">{notice}</p>
          {invitation && (
            <div className="grid gap-2 rounded-xl border border-sage/20 bg-cream/70 p-3">
              <label className="admin-label">
                Invitation for {invitation.name}
                <input readOnly value={invitation.url} onFocus={(event) => event.currentTarget.select()} className="admin-input" />
              </label>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => copyLink(invitation.name)} className="inline-flex items-center gap-2 rounded-full bg-sage px-4 py-2 text-sm font-bold text-white"><Copy className="h-4 w-4" />Copy link</button>
                <a href={invitation.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-sage/20 px-4 py-2 text-sm font-bold text-sage">Preview invitation</a>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sage/15 p-4">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-sage/20 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-sage" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Search guest" />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-full border border-sage/20 bg-white px-3 py-2 text-sm">
            <option value="ALL">All</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="PENDING">Pending</option>
            <option value="DECLINED">Declined</option>
          </select>
          <button onClick={() => window.open("/api/admin/guests/export", "_self")} className="inline-flex items-center gap-2 rounded-full bg-sage px-4 py-2 text-sm font-bold text-white">
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-cream/70 text-xs uppercase tracking-widest text-sage">
              <tr>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">RSVP</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((guest) => (
                <tr key={guest.id} className="border-t border-sage/10">
                  <td className="px-4 py-3">
                    <button onClick={() => setEditing(guest)} className="font-bold text-ink hover:text-sage">{guest.fullName}</button>
                    <p className="text-xs text-muted">{guest.personalizedGreeting}</p>
                  </td>
                  <td className="px-4 py-3">{guest.status}</td>
                  <td className="px-4 py-3 text-muted">{guest.email || guest.phone || "—"}</td>
                  <td className="px-4 py-3 text-muted">{guest.rsvp ? `${guest.rsvp.attendanceStatus} (${guest.rsvp.guestCount})` : "Pending"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button aria-label={`Copy invitation link for ${guest.fullName}`} onClick={() => copyLink(guest.fullName)} className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border border-sage/20 px-3 text-sage"><Copy className="h-4 w-4" />Copy link</button>
                      <button aria-label="Edit guest" onClick={() => setEditing(guest)} className="grid h-9 w-9 place-items-center rounded-full border border-sage/20 text-sage"><Plus className="h-4 w-4" /></button>
                      <button aria-label="Delete guest" onClick={() => remove(guest.id)} className="grid h-9 w-9 place-items-center rounded-full border border-red-200 text-red-700"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
