CREATE TYPE "Role" AS ENUM ('ADMIN');
CREATE TYPE "RSVPStatus" AS ENUM ('ACCEPTED', 'DECLINED', 'PENDING');
CREATE TYPE "MediaType" AS ENUM ('HERO', 'GROOM', 'BRIDE', 'GALLERY', 'MUSIC');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'ADMIN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Guest" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "displayName" TEXT,
  "inviteSlug" TEXT NOT NULL,
  "personalizedGreeting" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "status" "RSVPStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RSVP" (
  "id" TEXT NOT NULL,
  "guestId" TEXT NOT NULL,
  "attendanceStatus" "RSVPStatus" NOT NULL DEFAULT 'PENDING',
  "guestCount" INTEGER NOT NULL DEFAULT 1,
  "message" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RSVP_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WeddingSettings" (
  "id" TEXT NOT NULL,
  "groomName" TEXT NOT NULL,
  "brideName" TEXT NOT NULL,
  "weddingDate" TIMESTAMP(3) NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "rsvpDeadline" TIMESTAMP(3),
  "venueName" TEXT NOT NULL,
  "venueAddress" TEXT NOT NULL,
  "mapsUrl" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "musicTitle" TEXT NOT NULL,
  "musicEnabled" BOOLEAN NOT NULL DEFAULT true,
  "musicVolume" DOUBLE PRECISION NOT NULL DEFAULT 0.55,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WeddingSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvitationContent" (
  "id" TEXT NOT NULL,
  "landingHeading" TEXT NOT NULL,
  "greetingTemplate" TEXT NOT NULL,
  "englishIntro" TEXT NOT NULL,
  "myanmarIntro" TEXT NOT NULL,
  "footerMessage" TEXT NOT NULL,
  "thankYouText" TEXT NOT NULL,
  "coupleHeading" TEXT NOT NULL DEFAULT 'Together With Their Families',
  "eventHeading" TEXT NOT NULL DEFAULT 'Event Details',
  "venueHeading" TEXT NOT NULL DEFAULT 'Venue',
  "galleryHeading" TEXT NOT NULL DEFAULT 'Gallery',
  "rsvpHeading" TEXT NOT NULL DEFAULT 'RSVP',
  "saveDateHeading" TEXT NOT NULL DEFAULT 'Save The Date',
  "dressCodeHeading" TEXT NOT NULL DEFAULT 'Dress Code',
  "dressCodeSubtitle" TEXT NOT NULL DEFAULT 'Smart Casual / Elegant Attire',
  "dressCodeWarning" TEXT NOT NULL DEFAULT 'Please avoid wearing white.',
  "groomParents" TEXT,
  "brideParents" TEXT,
  "groomDescription" TEXT,
  "brideDescription" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InvitationContent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DressCodeColor" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "hex" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DressCodeColor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaAsset" (
  "id" TEXT NOT NULL,
  "type" "MediaType" NOT NULL,
  "url" TEXT NOT NULL,
  "alt" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SectionSetting" (
  "id" TEXT NOT NULL,
  "sectionKey" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SectionSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ThemeSetting" (
  "id" TEXT NOT NULL,
  "primaryColor" TEXT NOT NULL,
  "secondaryColor" TEXT NOT NULL,
  "backgroundColor" TEXT NOT NULL,
  "headingFont" TEXT NOT NULL,
  "bodyFont" TEXT NOT NULL,
  "scriptFont" TEXT NOT NULL,
  "floralEnabled" BOOLEAN NOT NULL DEFAULT true,
  "preset" TEXT NOT NULL DEFAULT 'Elegant Sage',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ThemeSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Guest_inviteSlug_key" ON "Guest"("inviteSlug");
CREATE INDEX "Guest_fullName_idx" ON "Guest"("fullName");
CREATE INDEX "Guest_status_idx" ON "Guest"("status");
CREATE UNIQUE INDEX "RSVP_guestId_key" ON "RSVP"("guestId");
CREATE INDEX "RSVP_attendanceStatus_idx" ON "RSVP"("attendanceStatus");
CREATE INDEX "MediaAsset_type_sortOrder_idx" ON "MediaAsset"("type", "sortOrder");
CREATE UNIQUE INDEX "SectionSetting_sectionKey_key" ON "SectionSetting"("sectionKey");

ALTER TABLE "RSVP"
  ADD CONSTRAINT "RSVP_guestId_fkey"
  FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
