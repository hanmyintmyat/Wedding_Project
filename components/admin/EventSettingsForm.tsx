"use client";

import { adminFetch } from "@/lib/admin-fetch";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { weddingSettingsSchema } from "@/lib/validations";

type EventInput = z.input<typeof weddingSettingsSchema>;
type EventPayload = z.output<typeof weddingSettingsSchema>;

export default function EventSettingsForm({ settings }: { settings: EventPayload }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const form = useForm<EventInput, undefined, EventPayload>({ resolver: zodResolver(weddingSettingsSchema), defaultValues: settings });

  async function save(values: EventPayload) {
    setMessage("");
    setError("");
    try {
      await adminFetch("/api/admin/settings?type=event", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      form.reset(values);
      setMessage("Event details saved successfully.");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save event details. Please try again.");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(save, () => { setMessage(""); setError(""); })} className="admin-panel grid gap-4 p-5">
      <h2 className="font-serif text-2xl">Event Settings</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="admin-label">Groom Name<input className="admin-input" {...form.register("groomName")} /></label>
        <label className="admin-label">Bride Name<input className="admin-input" {...form.register("brideName")} /></label>
        <label className="admin-label">Wedding Date<input type="date" className="admin-input" {...form.register("weddingDate")} /></label>
        <label className="admin-label">RSVP Deadline<input type="date" className="admin-input" {...form.register("rsvpDeadline")} /></label>
        <label className="admin-label">Start Time<input className="admin-input" {...form.register("startTime")} /></label>
        <label className="admin-label">End Time<input className="admin-input" {...form.register("endTime")} /></label>
      </div>
      <label className="admin-label">Venue Name<input className="admin-input" {...form.register("venueName")} /></label>
      <label className="admin-label">Venue Address<textarea rows={3} className="admin-input" {...form.register("venueAddress")} /></label>
      <label className="admin-label">Google Maps URL<input className="admin-input" {...form.register("mapsUrl")} /></label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="admin-label">Latitude<input type="number" step="any" className="admin-input" {...form.register("latitude")} /></label>
        <label className="admin-label">Longitude<input type="number" step="any" className="admin-input" {...form.register("longitude")} /></label>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_160px_180px]">
        <label className="admin-label">Music Title<input className="admin-input" {...form.register("musicTitle")} /></label>
        <label className="admin-label">Default Volume<input type="number" min={0} max={1} step={0.05} className="admin-input" {...form.register("musicVolume")} /></label>
        <label className="inline-flex items-end gap-3 pb-3 text-sm font-bold text-sage"><input type="checkbox" className="h-5 w-5 accent-sage" {...form.register("musicEnabled")} /> Music enabled</label>
      </div>
      {Object.keys(form.formState.errors).length > 0 && (
        <div role="alert" className="grid gap-1 text-sm text-red-700">
          {Object.entries(form.formState.errors).map(([field, issue]) => (
            <p key={field}>{field.replace(/([A-Z])/g, " $1")}: {issue?.message}</p>
          ))}
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <p role="status" className="text-sm text-sage">{message}</p>
      <button type="submit" disabled={form.formState.isSubmitting} aria-busy={form.formState.isSubmitting} className="w-fit cursor-pointer rounded-full bg-sage px-5 py-2 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">{form.formState.isSubmitting ? "Saving…" : "Save Changes"}</button>
    </form>
  );
}
