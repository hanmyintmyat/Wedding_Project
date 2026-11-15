import dotenv from 'dotenv';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Prisma } from '../generated/prisma/client';
import { getPrismaClient } from '../lib/db';
import { galleryPhotos } from '../config/wedding-media';
import { updateWeddingContent } from '../lib/wedding-content-update';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

async function main() {
  for (const photo of galleryPhotos) {
    if (!existsSync(resolve(`public${photo.url}`))) throw new Error(`Required gallery file is missing: public${photo.url}. No database changes were made.`);
  }
  const db = getPrismaClient();
  try {
    const [settings, media] = await Promise.all([db.weddingSettings.findMany(), db.mediaAsset.findMany()]);
    const folder = resolve('.local/wedding-content-backups');
    mkdirSync(folder, { recursive: true, mode: 0o700 });
    writeFileSync(resolve(folder, `${Date.now()}.json`), JSON.stringify({ settings, media }, null, 2), { mode: 0o600, flag: 'wx' });
    const result = await db.$transaction(updateWeddingContent, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });
    console.log(`Venue updated in ${result.venueRecords} settings record(s). Added ${result.galleryAdded} One–Five gallery image(s). Existing guests, RSVPs, other settings and media were preserved.`);
    console.log('A private settings/media backup is saved under .local/wedding-content-backups. Deploy the updated source to refresh the public content cache.');
  } finally {
    await db.$disconnect();
  }
}

main().catch(error => {
  console.error(error instanceof Prisma.PrismaClientKnownRequestError ? `Content update failed (${error.code}). No reset was performed.` : error instanceof Error && error.message.startsWith('Required gallery file') ? error.message : 'Content update failed. Check database access and required gallery assets. No reset was performed.');
  process.exitCode = 1;
});
