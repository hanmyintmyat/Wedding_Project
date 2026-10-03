import { put } from "@vercel/blob";
import { prisma } from "./db";
import { mediaMetaSchema } from "./validations";

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg"
]);

export async function uploadMedia(formData: FormData) {
  const file = formData.get("file");
  const meta = mediaMetaSchema.parse({
    type: formData.get("type"),
    alt: formData.get("alt") || "",
    sortOrder: formData.get("sortOrder") || 0
  });

  if (!(file instanceof File)) {
    throw new Error("A media file is required.");
  }
  if (!allowedTypes.has(file.type)) {
    throw new Error("Unsupported file type.");
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("File is larger than the 15 MB limit.");
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required for production-compatible uploads.");
  }

  const blob = await put(`wedding/${Date.now()}-${file.name}`, file, {
    access: "public",
    contentType: file.type
  });

  return prisma.mediaAsset.create({
    data: {
      type: meta.type,
      url: blob.url,
      alt: meta.alt,
      sortOrder: meta.sortOrder
    }
  });
}
