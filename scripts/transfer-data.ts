// One-time migration preserves the existing wedding and guest IDs. Never runs in the app.
import dotenv from 'dotenv';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { PrismaClient, type Prisma } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { validatePostgresUrl } from '../lib/postgres-config';
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });
const mode = process.argv[2];
const destination = '.local/wedding-data.backup.json';
const url = mode === 'import' ? process.env.DIRECT_URL : process.env.DATABASE_URL;
if (!url) throw new Error('Configure the source or target database URL.');
const validation = validatePostgresUrl(url, mode === 'import');
if (!validation.ok) throw new Error(validation.message);
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url, max: 1 }) });
async function main() {
try {
  if (mode === 'export') {
    const [settings, content, colors, theme, sections, media, guests, rsvps] = await Promise.all([
      prisma.weddingSettings.findMany(), prisma.invitationContent.findMany(), prisma.dressCodeColor.findMany(), prisma.themeSetting.findMany(), prisma.sectionSetting.findMany(), prisma.mediaAsset.findMany(), prisma.guest.findMany(), prisma.rSVP.findMany()
    ]);
    await mkdir('.local', { recursive: true });
    await writeFile(destination, JSON.stringify({ version: 1, settings, content, colors, theme, sections, media, guests, rsvps }, null, 2), { mode: 0o600 });
    console.log('Saved private wedding-data backup in .local. It is ignored by Git.');
  } else if (mode === 'import') {
    const backup = JSON.parse(await readFile(destination, 'utf8'), (key, value) => ['createdAt', 'updatedAt', 'weddingDate', 'rsvpDeadline'].includes(key) && value ? new Date(value) : value);
    if (backup.version !== 1) throw new Error('Unsupported backup version.');
    await prisma.$transaction(async tx => {
      for (const row of backup.settings as Prisma.WeddingSettingsCreateInput[]) await tx.weddingSettings.upsert({ where: { id: row.id }, update: {}, create: row });
      for (const row of backup.content as Prisma.InvitationContentCreateInput[]) await tx.invitationContent.upsert({ where: { id: row.id }, update: {}, create: row });
      for (const row of backup.colors as Prisma.DressCodeColorCreateInput[]) await tx.dressCodeColor.upsert({ where: { id: row.id }, update: {}, create: row });
      for (const row of backup.theme as Prisma.ThemeSettingCreateInput[]) await tx.themeSetting.upsert({ where: { id: row.id }, update: {}, create: row });
      for (const row of backup.sections as Prisma.SectionSettingCreateInput[]) await tx.sectionSetting.upsert({ where: { sectionKey: row.sectionKey }, update: {}, create: row });
      for (const row of backup.media as Prisma.MediaAssetCreateInput[]) await tx.mediaAsset.upsert({ where: { id: row.id }, update: {}, create: row });
      for (const row of backup.guests as Prisma.GuestCreateInput[]) await tx.guest.upsert({ where: { inviteSlug: row.inviteSlug }, update: {}, create: row });
      for (const row of backup.rsvps as Prisma.RSVPUncheckedCreateInput[]) await tx.rSVP.upsert({ where: { guestId: row.guestId }, update: {}, create: row });
    }, { timeout: 30_000 });
    console.log('Imported wedding data into Prisma Postgres. Existing target records were preserved.');
  } else throw new Error('Use export or import.');
} catch { console.error('Data transfer failed. Check configuration, migrations, and the private backup file.'); process.exitCode = 1; }
finally { await prisma.$disconnect(); }

}
void main();
