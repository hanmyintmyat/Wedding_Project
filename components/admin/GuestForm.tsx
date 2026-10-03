"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { guestSchema } from "@/lib/validations";
import type { z } from "zod";

export type GuestInput = z.input<typeof guestSchema>;
export type GuestPayload = z.output<typeof guestSchema>;

export default function GuestForm({ guest, onSubmit, onCancel }: { guest?: GuestPayload; onSubmit: (payload: GuestPayload) => Promise<void>; onCancel: () => void }) {
  const form = useForm<GuestInput, undefined, GuestPayload>({
    resolver: zodResolver(guestSchema),
    defaultValues: guest || { fullName: "", displayName: "", personalizedGreeting: "", email: "", phone: "", status: "PENDING", notes: "" }
  });

  const [error, setError] = useState("");

  async function submit(payload: GuestPayload) {
    setError("");
    try {
      await onSubmit(payload);
      if (!guest) form.reset();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save the guest. Please try again.");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} className="admin-panel grid gap-4 p-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">{guest ? "Edit Guest" : "Add Guest"}</p>
        <h2 className="mt-2 font-serif text-2xl text-ink">Guest Details</h2>
        <p className="mt-2 text-sm text-muted">Enter the guest’s name and save to create their invitation link.</p>
      </div>
      <label className="admin-label">Full Name<input className="admin-input" {...form.register("fullName")} aria-invalid={!!form.formState.errors.fullName} />
        {form.formState.errors.fullName && <span role="alert" className="text-xs text-red-700">{form.formState.errors.fullName.message}</span>}
      </label>
      <label className="admin-label">Display Name<input className="admin-input" {...form.register("displayName")} /></label>
      <label className="admin-label">Personalized Greeting<input className="admin-input" placeholder="Dear Beloved {Name}" {...form.register("personalizedGreeting")} /></label>
      <label className="admin-label">Email<input className="admin-input" {...form.register("email")} /></label>
      <label className="admin-label">Phone<input className="admin-input" {...form.register("phone")} /></label>
      <label className="admin-label">Status<select className="admin-input" {...form.register("status")}><option value="PENDING">Pending</option><option value="ACCEPTED">Accepted</option><option value="DECLINED">Declined</option></select></label>
      <label className="admin-label">Notes<textarea className="admin-input" rows={4} {...form.register("notes")} /></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button disabled={form.formState.isSubmitting} className="rounded-full bg-sage px-5 py-2 text-sm font-bold text-white">{form.formState.isSubmitting ? "Saving…" : guest ? "Save changes" : "Create invitation link"}</button>
        <button type="button" onClick={onCancel} className="rounded-full border border-sage/20 px-5 py-2 text-sm font-bold text-sage">Discard</button>
      </div>
    </form>
  );
}
