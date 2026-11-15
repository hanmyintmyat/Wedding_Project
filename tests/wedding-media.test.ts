import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync } from "node:fs";
import sharp from "sharp";
import { resolveWeddingPhoto, weddingPhotos, galleryPhotos } from "../config/wedding-media";

test("the desktop hero retains camera-source resolution without stretching", async () => {
  const hero = weddingPhotos.find(photo => photo.type === "HERO")!;
  const metadata = await sharp(`public${hero.url}`).metadata();
  assert.equal(metadata.width, 3840);
  assert.ok(Math.abs(metadata.width! / metadata.height! - 8000 / 5336) < 0.001);
});

test("the current photo collection is complete and contains no duplicate gallery files", () => {
  assert.equal(weddingPhotos.filter(photo => photo.type === "HERO").length, 1);
  const gallery = weddingPhotos.filter(photo => photo.type === "GALLERY");
  assert.equal(gallery.length, 14);
  assert.equal(new Set(gallery.map(photo => photo.url)).size, gallery.length);
  for (const photo of weddingPhotos) assert.ok(existsSync(`public${photo.url}`), `Missing photo: ${photo.url}`);
});

test('One–Five images lead the fallback gallery in explicit numerical order without changing portrait roles', async () => {
  assert.deepEqual(galleryPhotos.map(photo => photo.url), ['one', 'two', 'three', 'four', 'five'].map(name => `/images/gallery/${name}.webp`));
  assert.deepEqual(galleryPhotos.map(photo => photo.sortOrder), [0, 1, 2, 3, 4]);
  assert.deepEqual(weddingPhotos.filter(photo => photo.type === 'GALLERY').slice(0, 5), galleryPhotos);
  for (const photo of galleryPhotos) {
    const image = await sharp(`public${photo.url}`).metadata();
    assert.equal(image.format, 'webp');
    assert.ok(Math.max(image.width!, image.height!) <= 2048);
  }
  // A picture may appear in both the hero and gallery. Keep the configured
  // portrait roles intact rather than excluding a gallery image by its source.
  assert.equal(weddingPhotos.find(photo => photo.type === 'HERO')?.url, '/images/current/hero-high-resolution.webp');
  assert.equal(weddingPhotos.find(photo => photo.type === 'GROOM')?.url, '/images/current/groom-portrait.webp');
  assert.equal(weddingPhotos.find(photo => photo.type === 'BRIDE')?.url, '/images/current/PersonalPotrait1.webp');
});

test("legacy stored photos resolve to the current collection without changing IDs or order", () => {
  const old = { id: "seed-gallery-3", type: "GALLERY", url: "/images/legacy.jpeg", alt: "Old photo", sortOrder: 7 };
  const resolved = resolveWeddingPhoto(old);
  assert.equal(resolved.id, old.id);
  assert.equal(resolved.sortOrder, old.sortOrder);
  assert.equal(resolved.url, weddingPhotos.find(photo => photo.id === old.id)!.url);
  assert.equal(old.url, "/images/legacy.jpeg", "Rendering must not mutate stored data");
  assert.equal(resolveWeddingPhoto({ ...old, url: "https://example.public.blob.vercel-storage.com/wedding/initial/seed-gallery-3.jpeg" }).url, resolved.url);
});

test("future admin uploads, current assets, music, and role replacements remain intact", () => {
  for (const asset of [
    { id: "seed-hero", type: "HERO", url: "https://example.public.blob.vercel-storage.com/wedding/new/hero.webp", alt: "New admin upload" },
    { id: "admin-upload", type: "GALLERY", url: "/images/custom.webp", alt: "Custom upload" },
    { id: "seed-music", type: "MUSIC", url: "/music/wildest-dreams.mp3", alt: "Music" },
    { id: "seed-gallery-0", type: "HERO", url: "/images/custom.webp", alt: "Different role" },
    weddingPhotos[0]
  ]) assert.equal(resolveWeddingPhoto(asset), asset);
});
