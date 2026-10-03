import { prisma } from "./db";
import { contentSchema, themeSchema, weddingSettingsSchema } from "./validations";

export async function saveWeddingSettings(input: unknown) {
  const data = weddingSettingsSchema.parse(input);
  const existing = await prisma.weddingSettings.findFirst();
  const payload = {
    ...data,
    weddingDate: new Date(`${data.weddingDate}T10:00:00+06:30`),
    rsvpDeadline: data.rsvpDeadline ? new Date(`${data.rsvpDeadline}T23:59:59+06:30`) : null,
    mapsUrl: data.mapsUrl || null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null
  };
  return existing
    ? prisma.weddingSettings.update({ where: { id: existing.id }, data: payload })
    : prisma.weddingSettings.create({ data: payload });
}

export async function saveContent(input: unknown) {
  const data = contentSchema.parse(input);
  const existing = await prisma.invitationContent.findFirst();
  return existing
    ? prisma.invitationContent.update({ where: { id: existing.id }, data })
    : prisma.invitationContent.create({ data });
}

export async function saveTheme(input: unknown) {
  const data = themeSchema.parse(input);
  const existing = await prisma.themeSetting.findFirst();
  return existing
    ? prisma.themeSetting.update({ where: { id: existing.id }, data })
    : prisma.themeSetting.create({ data });
}
