"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Color = { id: string; name: string; hex: string; sortOrder: number };

export default function DressCodeManager({ initialColors }: { initialColors: Color[] }) {
  const [colors, setColors] = useState(initialColors);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function updateColor(id: string, change: Partial<Color>) {
    setMessage("");
    setColors((current) => current.map((color) => color.id === id ? { ...color, ...change } : color));
  }

  async function apply() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/settings?type=colors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(colors)
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Could not save dress code colors. Please try again.");
      }
      setColors(await response.json());
      setMessage("Dress code colors saved successfully.");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save dress code colors. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-2xl">Dress Code Colors</h2>
        <button type="button" disabled={saving} onClick={() => {
          setMessage("");
          setColors((current) => [...current, { id: `color-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: "New Color", hex: "#BFCDB2", sortOrder: Math.max(-1, ...current.map((color) => color.sortOrder)) + 1 }]);
        }} className="inline-flex items-center gap-2 rounded-full bg-sage px-4 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Add</button>
      </div>
      <p className="mt-2 text-sm text-muted">Edit the palette, then apply your changes to the invitation.</p>
      <fieldset disabled={saving} className="mt-5 grid gap-3">
        {colors.map((color) => (
          <div key={color.id} className="grid items-center gap-3 rounded-2xl border border-sage/15 bg-white/65 p-3 md:grid-cols-[56px_1fr_140px_90px_44px]">
            <span className="h-10 w-10 rounded-full border border-black/10" style={{ backgroundColor: color.hex }} />
            <input aria-label={`Color name for ${color.name}`} className="admin-input" value={color.name} onChange={(event) => updateColor(color.id, { name: event.target.value })} />
            <input aria-label={`Color value for ${color.name}`} type="color" className="h-11 w-full rounded-xl border border-sage/20 bg-white p-1" value={color.hex} onChange={(event) => updateColor(color.id, { hex: event.target.value })} />
            <input aria-label={`Sort order for ${color.name}`} type="number" min={0} step={1} className="admin-input" value={color.sortOrder} onChange={(event) => updateColor(color.id, { sortOrder: Number(event.target.value) })} />
            <button type="button" aria-label={`Remove ${color.name}`} className="grid h-10 w-10 place-items-center rounded-full border border-red-200 text-red-700" onClick={() => {
              setMessage("");
              setColors((current) => current.filter((item) => item.id !== color.id));
            }}><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </fieldset>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      <p role="status" className="mt-4 text-sm text-sage">{message}</p>
      <button type="button" disabled={saving} onClick={apply} className="mt-3 cursor-pointer rounded-full bg-sage px-5 py-2 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving…" : "Apply Dress Code"}</button>
    </div>
  );
}
