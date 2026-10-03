"use client";

import { adminFetch } from "@/lib/admin-fetch";
import { useState } from "react";

type Section = { sectionKey: string; enabled: boolean; sortOrder: number };

export default function SectionSettings({ initialSections }: { initialSections: Section[] }) {
  const [message, setMessage] = useState("");
  const [sections, setSections] = useState(initialSections);

  async function update(section: Section) {
    try {
      await adminFetch("/api/admin/settings?type=section", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(section)
      });
      setSections(current => current.map(item => item.sectionKey === section.sectionKey ? section : item));
      setMessage("Section saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save section."); }

  }

  return (
    <div className="admin-panel p-5">
      <h2 className="font-serif text-2xl">Page Section Settings</h2>
      <p role="status" className="mt-3 text-sm text-muted">{message}</p>
      <div className="mt-5 grid gap-3">
        {sections.map((section) => (
          <div key={section.sectionKey} className="grid items-center gap-3 rounded-2xl border border-sage/15 bg-white/65 p-3 sm:grid-cols-[1fr_120px_120px]">
            <span className="font-bold capitalize text-ink">{section.sectionKey.replace("-", " ")}</span>
            <label className="inline-flex items-center gap-2 text-sm font-bold text-sage">
              <input type="checkbox" className="h-5 w-5 accent-sage" checked={section.enabled} onChange={(event) => update({ ...section, enabled: event.target.checked })} />
              Enabled
            </label>
            <input aria-label={`${section.sectionKey} order`} type="number" className="admin-input" value={section.sortOrder} onChange={(event) => update({ ...section, sortOrder: Number(event.target.value) })} />
          </div>
        ))}
      </div>
    </div>
  );
}
