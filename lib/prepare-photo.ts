import { IMAGE_LIMIT } from './media-validation';

// Resize camera photos before uploading. Visitors receive responsive next/image variants.
export async function preparePhoto(file: File) {
  if (file.size > 25 * 1024 * 1024) throw new Error('Choose a photo smaller than 25 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not prepare this photo.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let blob: Blob | null = null;
    for (const quality of [0.85, 0.75, 0.65]) {
      blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', quality));
      if (blob && blob.size <= 1.5 * 1024 * 1024) break;
    }
    if (!blob || blob.size > IMAGE_LIMIT) throw new Error('Please export a smaller photo and try again.');
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: blob.type });
  } finally { bitmap.close(); }
}
