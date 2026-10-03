type VenueLocation = {
  mapsUrl: string | null;
  venueName: string;
  venueAddress: string;
  latitude: number | null;
  longitude: number | null;
};

export async function mapPreviewUrl(settings: VenueLocation) {
  let query = `${settings.venueName} ${settings.venueAddress}`.trim();
  if (settings.latitude != null && settings.longitude != null) {
    query = `${settings.latitude},${settings.longitude}`;
  } else if (settings.mapsUrl) {
    try {
      let url = new URL(settings.mapsUrl);
      if (url.protocol === "https:" && (url.hostname === "maps.app.goo.gl" || (url.hostname === "goo.gl" && url.pathname.startsWith("/maps")))) {
        const response = await fetch(url, {
          redirect: "manual",
          signal: AbortSignal.timeout(4000),
          next: { revalidate: 3600 }
        });
        const destination = response.headers.get("location");
        if (destination) url = new URL(destination);
      }
      if (url.protocol === "https:" && ["www.google.com", "google.com", "maps.google.com"].includes(url.hostname)) {
        if (url.pathname.startsWith("/maps/embed")) return url.toString();
        const coordinates = url.pathname.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/)
          || url.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
        const place = url.pathname.match(/\/maps\/place\/([^/]+)/);
        query = url.searchParams.get("query") || url.searchParams.get("q")
          || (coordinates ? `${coordinates[1]},${coordinates[2]}` : place ? decodeURIComponent(place[1].replaceAll("+", " ")) : query);
      }
    } catch {
      // Keep the venue address as a fallback if a share link cannot be resolved.
    }
  }
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;
}
