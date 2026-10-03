CREATE TABLE "MediaUpload" (
  "id" TEXT NOT NULL,
  "pathname" TEXT NOT NULL,
  "type" "MediaType" NOT NULL,
  "alt" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "replaceId" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaUpload_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MediaUpload_pathname_key" ON "MediaUpload"("pathname");
