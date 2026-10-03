import dotenv from "dotenv";
import { PrismaClient, RSVPStatus, MediaType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { weddingConfig } from "../config/wedding.config";

dotenv.config({ path: ".env.local" });
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl })
});

const myanmarIntro = `မင်္ဂလာရှိသော ဤနေ့ထူးနေ့မြတ်တွင်
ချစ်ခင်ရသူများနှင့်အတူ ပျော်ရွှင်မှုများမျှဝေလိုပါသဖြင့်
ကျွန်ုပ်တို့၏ မင်္ဂလာအခမ်းအနားသို့
ကြွရောက်ချီးမြှင့်ပေးပါရန် လေးစားစွာ ဖိတ်ကြားအပ်ပါသည်`;

const guests = [
  ["Phyo Thandar Aung", RSVPStatus.ACCEPTED, 2],
  ["Ei Ei Khin", RSVPStatus.PENDING, 1],
  ["Aung Ko Ko", RSVPStatus.DECLINED, 1],
  ["Su Myat Noe", RSVPStatus.ACCEPTED, 3],
  ["Htet Htet Win", RSVPStatus.PENDING, 1],
  ["Nay Lin Tun", RSVPStatus.ACCEPTED, 2],
  ["Thiri Shwe", RSVPStatus.DECLINED, 1],
  ["May Zin Oo", RSVPStatus.PENDING, 1],
  ["Kaung Sett Hein", RSVPStatus.ACCEPTED, 2],
  ["Yadanar Moe", RSVPStatus.PENDING, 1]
] as const;

const galleryImages = [
  "025eab17-7b4c-4bde-ac3f-caffddb382f7.jpeg",
  "27ad605a-ef78-4998-8d57-2fb427d1f3f1.jpeg",
  "29d04a16-b44c-4e83-b9fe-8e1ced3bc8f0.jpeg",
  "6ea1dea4-d46a-495b-b8f3-3bdfdff81612.jpeg",
  "bf9b09d4-e414-4ada-a6dd-77a47aa2075a.jpeg",
  "c82dbefe-cea9-40a8-ab7a-d1ead24a725a.jpeg",
  "f1f8a894-c43f-48e1-9c0b-d714a074a587.jpeg",
  "fb994e98-0ee4-4033-a35d-303d09bcbe21.jpeg",
  "fdef1fc0-a66d-4134-a2b8-802b47647597.jpeg"
];

const sections = [
  "intro",
  "couple",
  "event",
  "save-date",
  "dress-code",
  "venue",
  "gallery",
  "rsvp",
  "footer"
];

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12)
    }
  });

  const existingSettings = await prisma.weddingSettings.findFirst();
  if (!existingSettings) {
    await prisma.weddingSettings.create({
      data: {
        groomName: weddingConfig.groom,
        brideName: weddingConfig.bride,
        weddingDate: new Date(`${weddingConfig.date}T10:00:00+06:30`),
        startTime: weddingConfig.startTime,
        endTime: weddingConfig.endTime,
        rsvpDeadline: new Date(`${weddingConfig.rsvpDeadline}T23:59:59+06:30`),
        venueName: weddingConfig.venue,
        venueAddress: weddingConfig.address,
        mapsUrl: weddingConfig.mapsUrl,
        latitude: weddingConfig.latitude,
        longitude: weddingConfig.longitude,
        musicTitle: weddingConfig.musicTitle,
        musicEnabled: true,
        musicVolume: 0.55
      }
    });
  }

  if (!(await prisma.invitationContent.findFirst())) {
    await prisma.invitationContent.create({
      data: {
        landingHeading: "The Wedding Of",
        greetingTemplate: "Dear Beloved {name}",
        englishIntro: "We joyfully request the honor of your presence\nat the celebration of our marriage.",
        myanmarIntro,
        footerMessage: "Your presence, love, and blessings mean the world to us.",
        thankYouText: "For being a part of our journey.",
        groomParents: "",
        brideParents: "",
        groomDescription: "With a grateful heart and joyful spirit.",
        brideDescription: "With warmth, grace, and love."
      }
    });
  }

  const colors = [
    ["Dusty Blue", "#B8C9E8"],
    ["Blush Pink", "#EFC6D8"],
    ["Sage Green", "#BFCDB2"],
    ["Soft Yellow", "#F5E8A9"],
    ["Mauve", "#CDB3C8"]
  ];
  for (const [sortOrder, [name, hex]] of colors.entries()) {
    await prisma.dressCodeColor.upsert({
      where: { id: `seed-color-${sortOrder}` },
      update: { name, hex, sortOrder },
      create: { id: `seed-color-${sortOrder}`, name, hex, sortOrder }
    });
  }

  for (const [sortOrder, sectionKey] of sections.entries()) {
    await prisma.sectionSetting.upsert({
      where: { sectionKey },
      update: { sortOrder },
      create: { sectionKey, enabled: true, sortOrder }
    });
  }

  if (!(await prisma.themeSetting.findFirst())) {
    await prisma.themeSetting.create({
      data: {
        primaryColor: "#75856f",
        secondaryColor: "#d9a8a7",
        backgroundColor: "#fffaf2",
        headingFont: "Playfair Display",
        bodyFont: "Noto Sans",
        scriptFont: "Great Vibes",
        floralEnabled: true,
        preset: "Elegant Sage"
      }
    });
  }

  await prisma.mediaAsset.upsert({
    where: { id: "seed-hero" },
    update: { url: "/images/MainPhoto.jpeg" },
    create: { id: "seed-hero", type: MediaType.HERO, url: "/images/MainPhoto.jpeg", alt: "Wedding couple", sortOrder: 0 }
  });
  await prisma.mediaAsset.upsert({
    where: { id: "seed-groom" },
    update: { url: "/images/groom-portrait.jpeg" },
    create: { id: "seed-groom", type: MediaType.GROOM, url: "/images/groom-portrait.jpeg", alt: "Myo Thwin Kyaw", sortOrder: 0 }
  });
  await prisma.mediaAsset.upsert({
    where: { id: "seed-bride" },
    update: { url: "/images/bride-portrait.jpeg" },
    create: { id: "seed-bride", type: MediaType.BRIDE, url: "/images/bride-portrait.jpeg", alt: "Khaing Su Wai", sortOrder: 0 }
  });
  await prisma.mediaAsset.upsert({
    where: { id: "seed-music" },
    update: { url: weddingConfig.music },
    create: { id: "seed-music", type: MediaType.MUSIC, url: weddingConfig.music, alt: weddingConfig.musicTitle, sortOrder: 0 }
  });
  for (const [sortOrder, file] of galleryImages.entries()) {
    await prisma.mediaAsset.upsert({
      where: { id: `seed-gallery-${sortOrder}` },
      update: { url: `/images/${file}`, sortOrder },
      create: { id: `seed-gallery-${sortOrder}`, type: MediaType.GALLERY, url: `/images/${file}`, alt: "Wedding gallery photo", sortOrder }
    });
  }

  for (const [name, status, guestCount] of guests) {
    const guest = await prisma.guest.upsert({
      where: { inviteSlug: slugify(name) },
      update: {
        status,
        fullName: name,
        displayName: name.split(" ")[0],
        personalizedGreeting: `Dear Beloved ${name}`
      },
      create: {
        fullName: name,
        displayName: name.split(" ")[0],
        inviteSlug: slugify(name),
        personalizedGreeting: `Dear Beloved ${name}`,
        status,
        notes: "Seed guest"
      }
    });

    if (status !== RSVPStatus.PENDING) {
      await prisma.rSVP.upsert({
        where: { guestId: guest.id },
        update: { attendanceStatus: status, guestCount },
        create: {
          guestId: guest.id,
          attendanceStatus: status,
          guestCount,
          message: status === RSVPStatus.ACCEPTED ? "So happy to celebrate with you." : "Sending love from afar."
        }
      });
    } else {
      await prisma.rSVP.deleteMany({ where: { guestId: guest.id } });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
