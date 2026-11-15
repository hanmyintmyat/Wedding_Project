import { put } from '@vercel/blob/client';
import { adminFetch } from './admin-fetch';
import type { z } from 'zod';
import type { uploadMetaSchema } from './media-validation';

export async function uploadMedia(pathname: string, file: File, meta: z.output<typeof uploadMetaSchema>, onProgress: (percentage: number) => void) {
  // Request the constrained client token ourselves: upload() discards the
  // endpoint's useful 401/403/503 response and reports only a generic token error.
  const { clientToken } = await adminFetch<{ clientToken: string }>('/api/admin/media/upload', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'blob.generate-client-token',
      payload: { pathname, clientPayload: JSON.stringify(meta), multipart: false }
    })
  });
  if (typeof clientToken !== 'string' || !clientToken.startsWith('vercel_blob_client_')) {
    throw new Error('Unable to start upload. Please check Blob storage configuration.');
  }
  // Only this short-lived, path-constrained client token reaches the browser.
  return put(pathname, file, {
    access: 'public',
    token: clientToken,
    contentType: file.type,
    onUploadProgress: event => onProgress(Math.round(event.percentage))
  });
}
