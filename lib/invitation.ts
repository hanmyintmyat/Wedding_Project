import { MediaType } from "@prisma/client";
import { weddingConfig } from "@/config/wedding.config";
import { prisma } from "./db";
import { mapPreviewUrl } from "./maps";
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
  dressCodeWarning: "Please avoid wearing white.",
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

export async function getWeddingData() {
  try {
    const [settings, content, colors, media, sections, theme] = await Promise.all([
      prisma.weddingSettings.findFirst({ orderBy: { createdAt: "desc" } }),
      prisma.invitationContent.findFirst({ orderBy: { createdAt: "desc" } }),
      prisma.dressCodeColor.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.mediaAsset.findMany({ orderBy: [{ type: "asc" }, { sortOrder: "asc" }] }),
      prisma.sectionSetting.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.themeSetting.findFirst({ orderBy: { createdAt: "desc" } })
    ]);

    return normalizeWeddingData({
      settings,
      content,
      colors,
      media,
      sections,
      theme
    });
  } catch {
    return normalizeWeddingData({});
  }
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

  const media = input.media?.length
    ? input.media.map((asset) => {
        if (asset.type === MediaType.GROOM && asset.url === "/images/025eab17-7b4c-4bde-ac3f-caffddb382f7.jpeg") return { ...asset, url: "/images/groom-portrait.jpeg" };
        if (asset.type === MediaType.BRIDE && asset.url === "/images/27ad605a-ef78-4998-8d57-2fb427d1f3f1.jpeg") return { ...asset, url: "/images/bride-portrait.jpeg" };
        return asset;
      })
    : [
        { id: "hero", type: MediaType.HERO, url: weddingConfig.heroImage, alt: "Wedding couple", sortOrder: 0 },
        { id: "groom", type: MediaType.GROOM, url: "/images/groom-portrait.jpeg", alt: settings.groomName, sortOrder: 0 },
        { id: "bride", type: MediaType.BRIDE, url: "/images/bride-portrait.jpeg", alt: settings.brideName, sortOrder: 0 },
        { id: "music", type: MediaType.MUSIC, url: weddingConfig.music, alt: settings.musicTitle, sortOrder: 0 },
        ...[
          "025eab17-7b4c-4bde-ac3f-caffddb382f7.jpeg",
          "27ad605a-ef78-4998-8d57-2fb427d1f3f1.jpeg",
          "6ea1dea4-d46a-495b-b8f3-3bdfdff81612.jpeg",
          "bf9b09d4-e414-4ada-a6dd-77a47aa2075a.jpeg",
          "f1f8a894-c43f-48e1-9c0b-d714a074a587.jpeg",
          "fb994e98-0ee4-4033-a35d-303d09bcbe21.jpeg"
        ].map((file, sortOrder) => ({
          id: `gallery-${sortOrder}`,
          type: MediaType.GALLERY,
          url: `/images/${file}`,
          alt: "Wedding gallery photo",
          sortOrder
        }))
      ];
  const rawContent = input.content || {};
  const content = Object.fromEntries(
    Object.entries(fallbackContent).map(([key, value]) => [key, rawContent[key as keyof typeof fallbackContent] ?? value])
  ) as typeof fallbackContent;

  return {
    mapsEmbedUrl: await mapPreviewUrl(settings),
    settings,
    content,
    colors: input.colors?.length
      ? input.colors
      : [
          { id: "dusty-blue", name: "Dusty Blue", hex: "#B8C9E8", sortOrder: 0 },
          { id: "blush-pink", name: "Blush Pink", hex: "#EFC6D8", sortOrder: 1 },
          { id: "sage-green", name: "Sage Green", hex: "#BFCDB2", sortOrder: 2 },
          { id: "soft-yellow", name: "Soft Yellow", hex: "#F5E8A9", sortOrder: 3 },
          { id: "mauve", name: "Mauve", hex: "#CDB3C8", sortOrder: 4 }
        ],
    media,
    sections: input.sections?.length ? input.sections : fallbackSections,
    theme: input.theme || fallbackTheme
  };
}
