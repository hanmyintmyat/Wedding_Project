export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    const url = new URL(configured);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid site URL.');
    if (process.env.VERCEL_ENV === 'production' && (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname))) {
      throw new Error('Production requires a public HTTPS NEXT_PUBLIC_SITE_URL.');
    }
    return url.origin;
  }
  if (process.env.VERCEL_ENV === 'production') {
    throw new Error('Production requires NEXT_PUBLIC_SITE_URL.');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return '';
}

export function invitationLink(name: string) {
  return `${getSiteUrl()}/invite?to=${encodeURIComponent(name)}`;
}
