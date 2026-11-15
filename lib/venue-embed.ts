import { getVenueCoordinates } from './venue-links';

// Google Maps → Share → Embed a map, supplied for CALI Raffles Place.
// Keep this exact share embed rather than constructing an output=embed URL.
export const CALI_VENUE_EMBED_URL = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1994.409938243403!2d103.85223296667175!3d1.2818344870148626!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31da19e3709e7593%3A0xe4de1fd725975dcf!2sCALI%20Raffles%20Place%20Restaurant!5e0!3m2!1sen!2sth!4v1794740253103!5m2!1sen!2sth';

export function venueEmbedUrl(venue: {
  latitude: number | null;
  longitude: number | null;
  venueAddress: string;
}) {
  const coordinates = getVenueCoordinates(venue);
  if (coordinates) {
    // A manually supplied share embed identifies one venue. Never show CALI's
    // map if an administrator later configures a different location.
    return Math.abs(coordinates.lat - 1.2822) < 0.000001
      && Math.abs(coordinates.lng - 103.8513) < 0.000001 ? CALI_VENUE_EMBED_URL : null;
  }
  if (venue.latitude != null || venue.longitude != null) return null;
  const address = venue.venueAddress.trim().replace(/\s+/g, ' ').toLowerCase();
  return address === '2 finlayson green, level 2, singapore 049247' ? CALI_VENUE_EMBED_URL : null;
}
