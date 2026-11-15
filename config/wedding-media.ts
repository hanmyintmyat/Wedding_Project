// The current photo collection. Originals remain in the project folder.
export const weddingPhotos = [
  { id: "seed-hero", type: "HERO", url: "/images/current/hero-high-resolution.webp", alt: "Myo and Khaing together in the garden overlooking the historic house", sortOrder: 0 },
  { id: "seed-groom", type: "GROOM", url: "/images/current/groom-portrait.webp", alt: "Myo Thwin Kyaw", sortOrder: 0 },
  { id: "seed-bride", type: "BRIDE", url: "/images/current/PersonalPotrait1.webp", alt: "Khaing Su Wai", sortOrder: 0 },
  { id: "seed-gallery-0", type: "GALLERY", url: "/images/current/23f08fba-01d9-464c-8be8-dda6dae28279.webp", alt: "Khaing holding her bouquet with Myo on the steps behind her", sortOrder: 0 },
  { id: "seed-gallery-1", type: "GALLERY", url: "/images/current/488050b3-0ffd-4ecf-a15b-09ef6b544622.webp", alt: "A quiet moment together beneath the white arches", sortOrder: 1 },
  { id: "seed-gallery-2", type: "GALLERY", url: "/images/current/4fdd3c07-8230-4fc0-a145-6728f0daf6fe.webp", alt: "The couple framed by the arches of a historic house", sortOrder: 2 },
  { id: "seed-gallery-3", type: "GALLERY", url: "/images/current/hero-high-resolution.webp", alt: "Together on the lawn overlooking the historic house", sortOrder: 3 },
  { id: "seed-gallery-4", type: "GALLERY", url: "/images/current/8fc27136-fb9f-42d0-9ffe-a3b1a8feccec.webp", alt: "Myo and Khaing walking hand in hand through the garden", sortOrder: 4 },
  { id: "seed-gallery-5", type: "GALLERY", url: "/images/current/bc22d4db-a5e6-4ab2-8244-385fe23d1a96.webp", alt: "An embrace in the garden with the city in the distance", sortOrder: 5 },
  { id: "seed-gallery-6", type: "GALLERY", url: "/images/current/d0bffa64-ac24-45a6-af9c-52613e661d0c.webp", alt: "Celebrating together on the waterfront lawn", sortOrder: 6 },
  { id: "seed-gallery-7", type: "GALLERY", url: "/images/current/d531e78c-82c0-48b4-8958-1286ea711970.webp", alt: "A romantic evening together beneath the blue city sky", sortOrder: 7 },
  { id: "seed-gallery-8", type: "GALLERY", url: "/images/current/cac0a7db-e1c4-415d-9707-3f5f668d16e4.webp", alt: "A joyful embrace beneath the garden trees", sortOrder: 8 }
] satisfies Array<{ id: string; type: "HERO" | "GROOM" | "BRIDE" | "GALLERY"; url: string; alt: string; sortOrder: number }>;

type MediaReference = { id: string; type: string; url: string; alt: string | null };

export function resolveWeddingPhoto<T extends MediaReference>(asset: T): T {
  // Keep stored IDs, order, music, and future admin uploads intact. Resolve the
  // original seeded photos at read time; no production data migration is needed.
  const current = weddingPhotos.find(photo => photo.id === asset.id && photo.type === asset.type);
  const legacyLocation = (asset.url.startsWith("/images/") && !asset.url.startsWith("/images/current/"))
    || asset.url.includes("/wedding/initial/");
  return current && legacyLocation ? { ...asset, url: current.url, alt: current.alt } : asset;
}
