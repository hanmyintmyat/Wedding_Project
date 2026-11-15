import { unstable_cache } from "next/cache";
import { MediaType } from "@/generated/prisma/client";
import { weddingConfig } from "@/config/wedding.config";
import { resolveWeddingPhoto, weddingPhotos } from "@/config/wedding-media";
import { getPrismaClient } from "./db";
import { mapPreviewUrl } from "./maps";
import type { RSVPReceipt } from "./invitation-utils";
export { greetingFor, slugifyName } from "./invitation-utils";

export type WeddingData = Awaited<ReturnType<typeof getWeddingData>>;

const fallbackContent = {
  landingHeading: "The Wedding Of",
  greetingTemplate: "Dear Beloved {name}",
  englishIntro: "We joyfully request the honor of your presence\nat the celebration of our marriage.",
  myanmarIntro: `မင်္ဂလာရှိသော ဤနေ့ထူးနေ့မြတ်တွင်
ချစ်ခင်ရသူများနှင့်အတူ ပျော်ရွှင်မှုများမျှဝေလိုပါသဖြင့်
ကျွန်ုပ်တို့၏ မင်္ဂလာအခမ်းအနားသို့
ကြွရောက်ချီးမြှင့်ပေးပါရန် လေးစားစွာ ဖိတ်ကြားအပ်ပါသည်`,
  footerMessage: "Your presence, love, and blessings mean the world to us.",
  thankYouText: "For being a part of our journey.",
  coupleHeading: "Together With Their Families",
  eventHeading: "Event Details",
  venueHeading: "Venue",
  galleryHeading: "Gallery",
  rsvpHeading: "RSVP",
  saveDateHeading: "Save The Date",
  dressCodeHeading: "Dress Code",
  dressCodeSubtitle: "Smart Casual / Elegant Attire",
  // Kept empty for compatibility with the existing stored content schema.
  dressCodeWarning: "",
  groomParents: "",
  brideParents: "",
  groomDescription: "With a grateful heart and joyful spirit.",
  brideDescription: "With warmth, grace, and love."
};

const fallbackTheme = {
  primaryColor: "#75856f",
  secondaryColor: "#d9a8a7",
  backgroundColor: "#fffaf2",
  headingFont: "Playfair Display",
  bodyFont: "Noto Sans",
  scriptFont: "Great Vibes",
  floralEnabled: true,
  preset: "Elegant Sage"
};

const fallbackSections = [
  "intro",
  "couple",
  "event",
  "save-date",
  "dress-code",
  "venue",
  "gallery",
  "rsvp",
  "footer"
].map((sectionKey, sortOrder) => ({ sectionKey, enabled: true, sortOrder }));

// Shared content only. Personalization and RSVP are deliberately outside this cache.
export async function getWeddingDataLive() {
  const [settings, content, colors, media, sections, theme] = await Promise.all([
    getPrismaClient().weddingSettings.findFirst({ orderBy: { createdAt: "desc" } }),
    getPrismaClient().invitationContent.findFirst({ orderBy: { createdAt: "desc" } }),
    getPrismaClient().dressCodeColor.findMany({ orderBy: { sortOrder: "asc" } }),
    getPrismaClient().mediaAsset.findMany({ orderBy: [{ type: "asc" }, { sortOrder: "asc" }] }),
    getPrismaClient().sectionSetting.findMany({ orderBy: { sortOrder: "asc" } }),
    getPrismaClient().themeSetting.findFirst({ orderBy: { createdAt: "desc" } })
  ]);
  return normalizeWeddingData({ settings, content, colors, media, sections, theme });
}

// Keep the existing rendering model; the supported Data Cache persists on Vercel.
// Do not catch inside this function: failed refreshes must not replace good cache entries.
const getCachedWeddingData = unstable_cache(getWeddingDataLive, ['wedding-content-final-layout-2026-11-15'], {
  tags: ['wedding-content'], revalidate: 300
});

export async function getWeddingData() {
  try { return await getCachedWeddingData(); }
  catch { return normalizeWeddingData({}); }
}

export async function getGuestInvitation(name: string) {
  try {
    // One guest lookup per request; never serialize contact details or RSVP wishes.
    const guest = await getPrismaClient().guest.findFirst({
      where: { fullName: { equals: name, mode: 'insensitive' } },
      select: {
        personalizedGreeting: true,
        rsvp: { select: { attendanceStatus: true, guestCount: true } }
      }
    });
    const rsvp: RSVPReceipt | null = guest?.rsvp && guest.rsvp.attendanceStatus !== "PENDING"
      ? { attendanceStatus: guest.rsvp.attendanceStatus, guestCount: guest.rsvp.attendanceStatus === "DECLINED" ? 0 : guest.rsvp.guestCount }
      : null;
    return { personalizedGreeting: guest?.personalizedGreeting || null, rsvp };
  } catch { return null; }
}

async function normalizeWeddingData(input: {
  settings?: {
    groomName: string;
    brideName: string;
    weddingDate: Date;
    startTime: string;
    endTime: string;
    rsvpDeadline: Date | null;
    venueName: string;
    venueAddress: string;
    mapsUrl: string | null;
    latitude: number | null;
    longitude: number | null;
    musicTitle: string;
    musicEnabled: boolean;
    musicVolume: number;
  } | null;
  content?: Partial<Record<keyof typeof fallbackContent, string | null>> | null;
  colors?: Array<{ id: string; name: string; hex: string; sortOrder: number }>;
  media?: Array<{ id: string; type: MediaType; url: string; alt: string | null; sortOrder: number }>;
  sections?: Array<{ sectionKey: string; enabled: boolean; sortOrder: number }>;
  theme?: typeof fallbackTheme | null;
}) {
  const settings = input.settings
    ? {
        ...input.settings,
        weddingDate: input.settings.weddingDate.toISOString(),
        rsvpDeadline: input.settings.rsvpDeadline?.toISOString() || null
      }
    : {
        groomName: weddingConfig.groom,
        brideName: weddingConfig.bride,
        weddingDate: `${weddingConfig.date}T03:30:00.000Z`,
        startTime: weddingConfig.startTime,
        endTime: weddingConfig.endTime,
        rsvpDeadline: `${weddingConfig.rsvpDeadline}T17:29:59.000Z`,
        venueName: weddingConfig.venue,
        venueAddress: weddingConfig.address,
        mapsUrl: weddingConfig.mapsUrl,
        latitude: weddingConfig.latitude,
        longitude: weddingConfig.longitude,
        musicTitle: weddingConfig.musicTitle,
        musicEnabled: true,
        musicVolume: 0.55
      };

  const media = input.media
    ? input.media.map(resolveWeddingPhoto)
    : [
        ...weddingPhotos,
        { id: "music", type: MediaType.MUSIC, url: weddingConfig.music, alt: settings.musicTitle, sortOrder: 0 }
      ];
  const rawContent = input.content || {};
  const content = Object.fromEntries(
    Object.entries(fallbackContent).map(([key, value]) => [key, rawContent[key as keyof typeof fallbackContent] ?? value])
  ) as typeof fallbackContent;
  content.dressCodeWarning = "";

  return {
    mapsEmbedUrl: await mapPreviewUrl(settings),
    settings,
    content,
    colors: input.colors
      ? input.colors
      : [
          { id: "dusty-blue", name: "Dusty Blue", hex: "#B8C9E8", sortOrder: 0 },
          { id: "sage-green", name: "Sage Green", hex: "#BFCDB2", sortOrder: 1 },
          { id: "soft-yellow", name: "Soft Yellow", hex: "#F5E8A9", sortOrder: 2 },
          { id: "mocha", name: "Mocha", hex: "#BFA392", sortOrder: 3 },
          { id: "champagne-beige", name: "Champagne Beige", hex: "#E6C694", sortOrder: 4 }
        ],
    media,
    sections: input.sections ? input.sections : fallbackSections,
    theme: input.theme || fallbackTheme
  };
}
