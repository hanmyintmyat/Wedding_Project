import { z } from "zod";

export const rsvpSchema = z.object({
  guestName: z.string().trim().min(2, "Please enter your name").max(120),
  attendanceStatus: z.enum(["ACCEPTED", "DECLINED"]),
  guestCount: z.coerce.number().int().min(0).max(2, "A maximum of 2 guests is allowed."),
  message: z.string().trim().max(1000).optional().or(z.literal(""))
}).refine(data => data.attendanceStatus !== "ACCEPTED" || data.guestCount >= 1, { message: "Please include at least one guest.", path: ["guestCount"] });

export const guestSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  displayName: z.string().trim().max(80).optional().or(z.literal("")),
  personalizedGreeting: z.string().trim().max(160).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  status: z.enum(["ACCEPTED", "DECLINED", "PENDING"]).default("PENDING"),
  notes: z.string().trim().max(1000).optional().or(z.literal(""))
});

const eventTimeSchema = z.string().trim().refine(value => {
  const match = value.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  return !!match && Number(match[2] || 0) <= 59 && (match[3] ? Number(match[1]) >= 1 && Number(match[1]) <= 12 : Number(match[1]) <= 23);
}, 'Use a time such as 10:00 AM or 14:00.');

export const weddingSettingsSchema = z.object({
  groomName: z.string().trim().min(1).max(120),
  brideName: z.string().trim().min(1).max(120),
  weddingDate: z.string().date(),
  startTime: eventTimeSchema,
  endTime: eventTimeSchema,
  rsvpDeadline: z.string().date().optional().or(z.literal("")),
  venueName: z.string().trim().min(1).max(160),
  venueAddress: z.string().trim().max(500),
  mapsUrl: z.string().url().refine(value => {
    if (!URL.canParse(value)) return false;
    const url = new URL(value);
    return url.protocol === 'https:' && ['google.com', 'www.google.com', 'maps.google.com', 'maps.app.goo.gl', 'goo.gl'].includes(url.hostname);
  }, 'Use a Google Maps HTTPS link.').optional().or(z.literal("")),
  latitude: z.preprocess(value => value === "" ? null : value, z.coerce.number().min(-90).max(90).optional().nullable()),
  longitude: z.preprocess(value => value === "" ? null : value, z.coerce.number().min(-180).max(180).optional().nullable()),
  musicTitle: z.string().trim().min(1).max(160),
  musicEnabled: z.coerce.boolean(),
  musicVolume: z.coerce.number().min(0).max(1)
});

export const contentSchema = z.object({
  landingHeading: z.string().trim().min(1).max(120),
  greetingTemplate: z.string().trim().min(1).max(160),
  englishIntro: z.string().trim().min(1).max(500),
  myanmarIntro: z.string().trim().min(1).max(1000),
  footerMessage: z.string().trim().min(1).max(500),
  thankYouText: z.string().trim().min(1).max(250),
  coupleHeading: z.string().trim().max(120),
  eventHeading: z.string().trim().max(120),
  venueHeading: z.string().trim().max(120),
  galleryHeading: z.string().trim().max(120),
  rsvpHeading: z.string().trim().max(120),
  saveDateHeading: z.string().trim().max(120),
  dressCodeHeading: z.string().trim().max(120),
  dressCodeSubtitle: z.string().trim().max(160),
  dressCodeWarning: z.string().trim().max(200),
  groomParents: z.string().trim().max(240).optional().or(z.literal("")),
  brideParents: z.string().trim().max(240).optional().or(z.literal("")),
  groomDescription: z.string().trim().max(500).optional().or(z.literal("")),
  brideDescription: z.string().trim().max(500).optional().or(z.literal(""))
});

export const dressColorSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(80),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  sortOrder: z.coerce.number().int().min(0)
});

export const themeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  headingFont: z.enum(["Playfair Display", "Cormorant Garamond", "Libre Baskerville"]),
  bodyFont: z.enum(["Noto Sans", "Inter", "Noto Sans Myanmar"]),
  scriptFont: z.enum(["Great Vibes", "Parisienne", "Allura"]),
  floralEnabled: z.coerce.boolean(),
  preset: z.enum(["Elegant Sage", "Soft Blush", "Classic Ivory", "Warm Beige"])
});

export const sectionSchema = z.object({
  sectionKey: z.enum(["intro", "couple", "event", "save-date", "dress-code", "venue", "gallery", "rsvp", "footer"]),
  enabled: z.coerce.boolean(),
  sortOrder: z.coerce.number().int().min(0)
});

export const mediaMetaSchema = z.object({
  type: z.enum(["HERO", "GROOM", "BRIDE", "GALLERY", "MUSIC"]),
  alt: z.string().trim().max(160).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).default(0)
});
