import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Prisma } from '../generated/prisma/client';
import { updateWeddingContent } from '../lib/wedding-content-update';
import { galleryPhotos } from '../config/wedding-media';
import { weddingConfig } from '../config/wedding.config';

test('content update adds ordered One–Five records, preserves other media and retains later CMS order on repeat', async () => {
  type Asset = { id: string; type: string; url: string; alt: string; sortOrder: number };
  const assets: Asset[] = [
    { id: 'hero', type: 'HERO', url: '/images/custom-hero.webp', alt: 'Current hero', sortOrder: 0 },
    { id: 'groom', type: 'GROOM', url: '/images/current-groom.webp', alt: 'Current groom', sortOrder: 0 },
    { id: 'bride', type: 'BRIDE', url: '/images/current-bride.webp', alt: 'Current bride', sortOrder: 0 },
    { id: 'music', type: 'MUSIC', url: '/music/wildest-dreams-trimmed.mp3', alt: 'Current music', sortOrder: 0 },
    { id: 'old-gallery', type: 'GALLERY', url: '/images/old-gallery.webp', alt: 'Existing photo', sortOrder: 0 }
  ];
  const original = structuredClone(assets);
  let savedVenue: unknown;
  const tx = {
    weddingSettings: { updateMany: async ({ data }: { data: unknown }) => { savedVenue = data; return { count: 1 }; } },
    mediaAsset: {
      findMany: async () => assets.filter(asset => asset.type === 'GALLERY').sort((a, b) => a.sortOrder - b.sortOrder),
      findUnique: async ({ where }: { where: { id: string } }) => assets.find(asset => asset.id === where.id) || null,
      update: async ({ where, data }: { where: { id: string }; data: Partial<Asset> }) => Object.assign(assets.find(asset => asset.id === where.id)!, data),
      upsert: async ({ where, update, create }: { where: { id: string }; update: Partial<Asset>; create: Asset }) => {
        const existing = assets.find(asset => asset.id === where.id);
        if (existing) return Object.assign(existing, update);
        assets.push({ ...create }); return create;
      }
    }
  } as unknown as Prisma.TransactionClient;
  assert.deepEqual(await updateWeddingContent(tx), { venueRecords: 1, galleryAdded: 5 });
  assert.deepEqual(savedVenue, { venueName: weddingConfig.venue, venueAddress: weddingConfig.address, mapsUrl: weddingConfig.mapsUrl, latitude: weddingConfig.latitude, longitude: weddingConfig.longitude });
  assert.deepEqual(assets.filter(asset => asset.type !== 'GALLERY'), original.filter(asset => asset.type !== 'GALLERY'));
  assert.equal(assets.find(asset => asset.id === 'old-gallery')?.url, '/images/old-gallery.webp');
  assert.equal(assets.find(asset => asset.id === 'old-gallery')?.sortOrder, 5);
  const ordered = () => assets.filter(asset => asset.type === 'GALLERY').sort((a, b) => a.sortOrder - b.sortOrder);
  assert.deepEqual(ordered().slice(0, 5).map(asset => asset.id), galleryPhotos.map(photo => photo.id));
  assets.find(asset => asset.id === 'galaxy-1')!.sortOrder = 1;
  assets.find(asset => asset.id === 'galaxy-2')!.sortOrder = 0;
  const customOrder = ordered().map(asset => asset.id);
  assert.deepEqual(await updateWeddingContent(tx), { venueRecords: 1, galleryAdded: 0 });
  assert.deepEqual(ordered().map(asset => asset.id), customOrder);
  assert.equal(new Set(assets.map(asset => asset.url)).size, assets.length);
});
