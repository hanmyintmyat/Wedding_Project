import type { Prisma } from '@/generated/prisma/client';
import { weddingConfig } from '@/config/wedding.config';
import { galleryPhotos } from '@/config/wedding-media';

// Run explicitly, never during a page request or build. Keep later CMS edits,
// replacements and Earlier/Later ordering authoritative after this initial update.
export async function updateWeddingContent(tx: Prisma.TransactionClient) {
  const venue = await tx.weddingSettings.updateMany({
    data: {
      venueName: weddingConfig.venue,
      venueAddress: weddingConfig.address,
      mapsUrl: weddingConfig.mapsUrl,
      latitude: weddingConfig.latitude,
      longitude: weddingConfig.longitude
    }
  });
  if (!venue.count) throw new Error('Existing wedding settings were not found. No content was updated.');
  const gallery = await tx.mediaAsset.findMany({ where: { type: 'GALLERY' }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
  const allPresent = galleryPhotos.every(photo => gallery.some(asset => asset.id === photo.id));
  if (allPresent) return { venueRecords: venue.count, galleryAdded: 0 };

  const newGalleryIds = new Set(galleryPhotos.map(photo => photo.id));
  const preserved = gallery.filter(asset => !newGalleryIds.has(asset.id));
  for (const [index, asset] of preserved.entries()) {
    await tx.mediaAsset.update({ where: { id: asset.id }, data: { sortOrder: index + galleryPhotos.length } });
  }
  for (const photo of galleryPhotos) {
    const existing = await tx.mediaAsset.findUnique({ where: { id: photo.id } });
    if (existing && existing.type !== 'GALLERY') throw new Error('A gallery identifier belongs to another media role. No content was updated.');
    await tx.mediaAsset.upsert({
      where: { id: photo.id },
      update: { sortOrder: photo.sortOrder },
      create: photo
    });
  }
  return { venueRecords: venue.count, galleryAdded: galleryPhotos.filter(photo => !gallery.some(asset => asset.id === photo.id)).length };
}
