type Venue = {
  latitude: number | null;
  longitude: number | null;
  venueAddress: string;
  venueName: string;
};

export function getVenueCoordinates(venue: Pick<Venue, 'latitude' | 'longitude'>) {
  const { latitude, longitude } = venue;
  const valid = latitude != null && longitude != null
    && Number.isFinite(latitude) && Number.isFinite(longitude)
    && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
  return valid ? { lat: latitude, lng: longitude } : null;
}

export function buildVenueMapsLinks(venue: Venue) {
  const coordinates = getVenueCoordinates(venue);
  const destination = coordinates ? `${coordinates.lat},${coordinates.lng}` : venue.venueAddress.trim() || venue.venueName.trim();
  const query = encodeURIComponent(destination);
  return {
    location: destination ? `https://www.google.com/maps/search/?api=1&query=${query}` : '',
    directions: destination ? `https://www.google.com/maps/dir/?api=1&destination=${query}` : ''
  };
}

export function venueAddressLines(address: string) {
  return address.replace(/,\s*(Singapore\b)/i, '\n$1');
}

export function isEmbeddedBrowser(userAgent: string) {
  // Best-effort hint only. Never change or intercept navigation based on a UA.
  return /FBAN|FBAV|FB_IAB|Messenger|Instagram|\bLine\/|WhatsApp|MicroMessenger|TikTok/i.test(userAgent);
}
