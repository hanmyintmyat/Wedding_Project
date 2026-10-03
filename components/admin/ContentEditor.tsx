"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { contentSchema } from "@/lib/validations";

type ContentPayload = z.infer<typeof contentSchema>;

export default function ContentEditor({ content }: { content: ContentPayload }) {
  const form = useForm<ContentPayload>({ resolver: zodResolver(contentSchema), defaultValues: content });
  const myanmar = useWatch({ control: form.control, name: "myanmarIntro" });

  async function save(values: ContentPayload) {
    await fetch("/api/admin/settings?type=content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
  }

  return (
    <form onSubmit={form.handleSubmit(save)} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="admin-panel grid gap-4 p-5">
        <h2 className="font-serif text-2xl">Invitation Content</h2>
        <label className="admin-label">Landing Heading<input className="admin-input" {...form.register("landingHeading")} /></label>
        <label className="admin-label">Personalized Greeting Template<input className="admin-input" {...form.register("greetingTemplate")} /></label>
        <label className="admin-label">English Invitation Text<textarea className="admin-input" rows={3} {...form.register("englishIntro")} /></label>
        <label className="admin-label">Myanmar Invitation Text<textarea className="admin-input font-myanmar" rows={6} {...form.register("myanmarIntro")} /></label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="admin-label">Groom Parents<input className="admin-input" {...form.register("groomParents")} /></label>
          <label className="admin-label">Bride Parents<input className="admin-input" {...form.register("brideParents")} /></label>
          <label className="admin-label">Groom Description<textarea className="admin-input" rows={3} {...form.register("groomDescription")} /></label>
          <label className="admin-label">Bride Description<textarea className="admin-input" rows={3} {...form.register("brideDescription")} /></label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {["coupleHeading", "eventHeading", "venueHeading", "galleryHeading", "rsvpHeading", "saveDateHeading", "dressCodeHeading"].map((field) => (
            <label key={field} className="admin-label">
              {field.replace(/([A-Z])/g, " $1")}
              <input className="admin-input" {...form.register(field as keyof ContentPayload)} />
            </label>
          ))}
        </div>
        <label className="admin-label">Dress Code Subtitle<input className="admin-input" {...form.register("dressCodeSubtitle")} /></label>
        <label className="admin-label">Dress Code Warning<input className="admin-input" {...form.register("dressCodeWarning")} /></label>
        <label className="admin-label">Thank-you Text<input className="admin-input" {...form.register("thankYouText")} /></label>
        <label className="admin-label">Footer Message<textarea className="admin-input" rows={3} {...form.register("footerMessage")} /></label>
        <div className="flex gap-2">
          <button className="rounded-full bg-sage px-5 py-2 text-sm font-bold text-white">Save Changes</button>
          <button type="reset" className="rounded-full border border-sage/20 px-5 py-2 text-sm font-bold text-sage">Discard Changes</button>
        </div>
      </div>
      <div className="admin-panel p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Myanmar Preview</p>
        <p className="font-myanmar mt-5 whitespace-pre-line rounded-2xl bg-white/70 p-5 text-muted">{myanmar}</p>
      </div>
    </form>
  );
}
