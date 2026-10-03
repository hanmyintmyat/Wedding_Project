"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { themeSchema } from "@/lib/validations";

type ThemeInput = z.input<typeof themeSchema>;
type ThemePayload = z.output<typeof themeSchema>;

const presets: Record<ThemePayload["preset"], Pick<ThemePayload, "primaryColor" | "secondaryColor" | "backgroundColor">> = {
  "Elegant Sage": { primaryColor: "#75856f", secondaryColor: "#d9a8a7", backgroundColor: "#fffaf2" },
  "Soft Blush": { primaryColor: "#8a7d68", secondaryColor: "#e8b8bd", backgroundColor: "#fff8f6" },
  "Classic Ivory": { primaryColor: "#7b846b", secondaryColor: "#c9b8a2", backgroundColor: "#fffdf7" },
  "Warm Beige": { primaryColor: "#7d8065", secondaryColor: "#d6aaa0", backgroundColor: "#fbf3e7" }
};

export default function ThemeSettings({ theme }: { theme: ThemePayload }) {
  const form = useForm<ThemeInput, undefined, ThemePayload>({ resolver: zodResolver(themeSchema), defaultValues: theme });

  async function save(values: ThemePayload) {
    await fetch("/api/admin/settings?type=theme", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
  }

  function applyPreset(preset: ThemePayload["preset"]) {
    form.setValue("preset", preset);
    form.setValue("primaryColor", presets[preset].primaryColor);
    form.setValue("secondaryColor", presets[preset].secondaryColor);
    form.setValue("backgroundColor", presets[preset].backgroundColor);
  }

  return (
    <form onSubmit={form.handleSubmit(save)} className="admin-panel grid gap-5 p-5">
      <h2 className="font-serif text-2xl">Design Settings</h2>
      <label className="admin-label">Theme Preset<select className="admin-input" {...form.register("preset")} onChange={(event) => applyPreset(event.target.value as ThemePayload["preset"])}><option>Elegant Sage</option><option>Soft Blush</option><option>Classic Ivory</option><option>Warm Beige</option></select></label>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="admin-label">Primary Accent<input type="color" className="admin-input h-12" {...form.register("primaryColor")} /></label>
        <label className="admin-label">Secondary Accent<input type="color" className="admin-input h-12" {...form.register("secondaryColor")} /></label>
        <label className="admin-label">Background<input type="color" className="admin-input h-12" {...form.register("backgroundColor")} /></label>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="admin-label">Heading Font<select className="admin-input" {...form.register("headingFont")}><option>Playfair Display</option><option>Cormorant Garamond</option><option>Libre Baskerville</option></select></label>
        <label className="admin-label">Body Font<select className="admin-input" {...form.register("bodyFont")}><option>Noto Sans</option><option>Inter</option><option>Noto Sans Myanmar</option></select></label>
        <label className="admin-label">Script Font<select className="admin-input" {...form.register("scriptFont")}><option>Great Vibes</option><option>Parisienne</option><option>Allura</option></select></label>
      </div>
      <label className="inline-flex items-center gap-3 text-sm font-bold text-sage"><input type="checkbox" className="h-5 w-5 accent-sage" {...form.register("floralEnabled")} /> Floral decorations enabled</label>
      <button className="w-fit rounded-full bg-sage px-5 py-2 text-sm font-bold text-white">Save Changes</button>
    </form>
  );
}
