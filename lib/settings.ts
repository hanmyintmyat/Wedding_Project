import { getPrismaClient } from "./db";
import { contentSchema, themeSchema, weddingSettingsSchema } from "./validations";

export async function saveWeddingSettings(input: unknown) {
  const data = weddingSettingsSchema.parse(input);
  const existing = await getPrismaClient().weddingSettings.findFirst();
  const payload = {
    ...data,
    weddingDate: new Date(`${data.weddingDate}T10:00:00+06:30`),
    rsvpDeadline: data.rsvpDeadline ? new Date(`${data.rsvpDeadline}T23:59:59+06:30`) : null,
    mapsUrl: data.mapsUrl || null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null
  };
  return existing
    ? getPrismaClient().weddingSettings.update({ where: { id: existing.id }, data: payload })
    : getPrismaClient().weddingSettings.create({ data: payload });
}

export async function saveContent(input: unknown) {
  const data = contentSchema.parse(input);
  const existing = await getPrismaClient().invitationContent.findFirst();
  return existing
    ? getPrismaClient().invitationContent.update({ where: { id: existing.id }, data })
    : getPrismaClient().invitationContent.create({ data });
}

export async function saveTheme(input: unknown) {
  const data = themeSchema.parse(input);
  const existing = await getPrismaClient().themeSetting.findFirst();
  return existing
    ? getPrismaClient().themeSetting.update({ where: { id: existing.id }, data })
    : getPrismaClient().themeSetting.create({ data });
}
