export const studioPath = '/wedding-studio';
export const studioLoginPath = `${studioPath}/login`;

export function studioDestination(callbackUrl: string | null) {
  if (!callbackUrl?.startsWith('/') || callbackUrl.startsWith('//')) return studioPath;
  try {
    const url = new URL(callbackUrl, 'https://wedding.invalid');
    if (url.origin !== 'https://wedding.invalid') return studioPath;
    if (url.pathname !== studioPath && !url.pathname.startsWith(`${studioPath}/`)) return studioPath;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return studioPath;
  }
}
