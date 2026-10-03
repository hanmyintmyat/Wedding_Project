import dotenv from 'dotenv';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { put } from '@vercel/blob';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { validatePostgresUrl } from '../lib/postgres-config';
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });
const databaseUrl = process.env.DIRECT_URL;
const validation = validatePostgresUrl(databaseUrl, true);
if (!validation.ok) throw new Error(validation.message);
if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('Configure Blob before moving media.');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl, max: 1 }) });
const root = path.resolve('public');
async function main() {
try {
  for (const asset of await prisma.mediaAsset.findMany()) {
    if (!asset.url.startsWith('/images/') && !asset.url.startsWith('/music/')) continue;
    const filename = path.resolve(root, '.' + asset.url);
    if (!filename.startsWith(root + path.sep)) throw new Error('Invalid media path.');
    const body = await readFile(filename);
    const extension = path.extname(filename).toLowerCase();
    const contentType = ({ '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg' } as Record<string, string>)[extension];
    if (!contentType) throw new Error('Unsupported media format.');
    const blob = await put(`wedding/initial/${asset.id}${extension}`, body, { access: 'public', contentType, addRandomSuffix: false, allowOverwrite: true });
    await prisma.mediaAsset.update({ where: { id: asset.id }, data: { url: blob.url } });
    console.log(`Moved ${asset.type} to Blob.`);
  }
  console.log('Existing photos and music are hosted in Blob. Rerun safely; migrated URLs are skipped.');
} catch { console.error('Media migration failed. Check Prisma Postgres, Blob, and source media files.'); process.exitCode = 1; }
finally { await prisma.$disconnect(); }

}
void main();
