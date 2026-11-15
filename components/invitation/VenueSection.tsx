import type { WeddingData } from "@/lib/invitation";
import { formatDisplayDate, googleCalendarLink } from "@/lib/calendar";
import { buildVenueMapsLinks, venueAddressLines } from "@/lib/venue-links";
import { venueEmbedUrl } from "@/lib/venue-embed";
import { Reveal } from "./Reveal";
import VenueActions from "./VenueActions";
import VenueMap from "./VenueMap";

export default function VenueSection({ data }: { data: WeddingData }) {
  const maps = buildVenueMapsLinks(data.settings);
  const venueName = data.settings.venueName.trim() || "Wedding venue";
  const address = venueAddressLines(data.settings.venueAddress.trim());
  const embedUrl = venueEmbedUrl(data.settings);
  return (
    <section id="venue" className="bg-white/35">
      <Reveal className="section-shell text-center">
        <p className="eyebrow">{data.content.venueHeading}</p>
        <h2 className="mt-4 font-serif text-4xl">{venueName}</h2>
        <p className="mx-auto mt-4 max-w-2xl whitespace-pre-line leading-8 text-muted">{address}</p>
        <p className="mt-3 text-sm leading-7 text-sage">{data.settings.venueDirections}</p>
        <p className="mt-5 text-sm uppercase tracking-[0.2em] text-sage">
          {formatDisplayDate(data.settings.weddingDate)} • {data.settings.startTime} – {data.settings.endTime}
        </p>
        <VenueActions location={maps.location} directions={maps.directions} address={data.settings.venueAddress} calendar={googleCalendarLink(data)} />
        <VenueMap key={embedUrl} embedUrl={embedUrl} venueName={venueName} address={address} locationUrl={maps.location} />
      </Reveal>
    </section>
  );
}
