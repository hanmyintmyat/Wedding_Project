type Venue = {
  latitude: number | null;
  longitude: number | null;
  venueAddress: string;
  venueName: string;
};

export function buildVenueMapsLinks(venue: Venue) {
  const { latitude, longitude } = venue;
  const coordinates = latitude != null && longitude != null
    && Number.isFinite(latitude) && Number.isFinite(longitude)
    && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
  const destination = coordinates ? `${latitude},${longitude}` : venue.venueAddress.trim() || venue.venueName.trim();
  const query = coordinates ? destination : encodeURIComponent(destination);
  return {
    location: `https://www.google.com/maps/search/?api=1&query=${query}`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${query}`
  };
}

export function venueAddressLines(address: string) {
  return address.replace(/,\s*(Singapore\b)/i, '\n$1');
}

export function isEmbeddedBrowser(userAgent: string) {
  // Best-effort hint only. Never change or intercept navigation based on a UA.
  return /FBAN|FBAV|FB_IAB|Messenger|Instagram|\bLine\/|WhatsApp|MicroMessenger|TikTok/i.test(userAgent);
}
