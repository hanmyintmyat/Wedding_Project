"use client";

import Image from "next/image";
import { Upload } from "lucide-react";
import { useState } from "react";

type Asset = { id: string; type: "HERO" | "GROOM" | "BRIDE" | "GALLERY" | "MUSIC"; url: string; alt: string | null; sortOrder: number };

export default function MediaManager({ initialAssets }: { initialAssets: Asset[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [message, setMessage] = useState("");

  async function upload(formData: FormData) {
    setMessage("");
    const response = await fetch("/api/admin/media", { method: "POST", body: formData });
    const payload = (await response.json()) as Asset | { error: string };
    if ("error" in payload) {
      setMessage(payload.error);
      return;
    }
    setAssets((current) => [payload, ...current]);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <form action={upload} className="admin-panel grid gap-4 p-5">
        <h2 className="font-serif text-2xl">Upload Media</h2>
        <p className="text-sm leading-6 text-muted">
          For background music, upload a licensed MP3, WAV, or OGG file. YouTube links can be used as song references, but they cannot be played by the invitation audio player directly.
        </p>
        <label className="admin-label">Media Type<select name="type" className="admin-input"><option value="HERO">Main Hero Photo</option><option value="GROOM">Groom Photo</option><option value="BRIDE">Bride Photo</option><option value="GALLERY">Gallery Image</option><option value="MUSIC">Background Music</option></select></label>
        <label className="admin-label">Alt / Music Title<input name="alt" className="admin-input" /></label>
        <label className="admin-label">Sort Order<input name="sortOrder" type="number" defaultValue={0} className="admin-input" /></label>
        <label className="admin-label">File<input name="file" type="file" accept="image/*,audio/*" className="admin-input" required /></label>
        <button className="inline-flex items-center justify-center gap-2 rounded-full bg-sage px-5 py-2 text-sm font-bold text-white"><Upload className="h-4 w-4" /> Upload</button>
        {message && <p className="text-sm leading-6 text-red-700">{message}</p>}
      </form>
      <div className="admin-panel p-5">
        <h2 className="font-serif text-2xl">Media Library</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <div key={asset.id} className="overflow-hidden rounded-2xl border border-sage/15 bg-white/65">
              {asset.type === "MUSIC" ? (
                <div className="grid aspect-[4/3] place-items-center p-4 text-center text-sage">{asset.alt || "Music File"}</div>
              ) : (
                <div className="relative aspect-[4/3]">
                  <Image src={asset.url} alt={asset.alt || asset.type} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                </div>
              )}
              <div className="p-3 text-sm">
                <p className="font-bold text-ink">{asset.type}</p>
                <p className="truncate text-xs text-muted">{asset.url}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
