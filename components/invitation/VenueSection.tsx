import type { WeddingData } from "@/lib/invitation";
import { formatDisplayDate, googleCalendarLink } from "@/lib/calendar";
import { buildVenueMapsLinks } from "@/lib/venue-links";
import { Reveal } from "./Reveal";
import VenueActions from "./VenueActions";

export default function VenueSection({ data }: { data: WeddingData }) {
  const maps = buildVenueMapsLinks(data.settings);
  return (
    <section id="venue" className="bg-white/35">
      <Reveal className="section-shell text-center">
        <p className="eyebrow">{data.content.venueHeading}</p>
        <h2 className="mt-4 font-serif text-4xl">{data.settings.venueName}</h2>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted">{data.settings.venueAddress}</p>
        <p className="mt-5 text-sm uppercase tracking-[0.2em] text-sage">
          {formatDisplayDate(data.settings.weddingDate)} • {data.settings.startTime} – {data.settings.endTime}
        </p>
        <VenueActions location={maps.location} directions={maps.directions} address={data.settings.venueAddress} calendar={googleCalendarLink(data)} />
        <div className="mx-auto mt-8 h-[320px] max-w-3xl overflow-hidden rounded-2xl border border-sage/15 bg-cream sm:h-[400px]">
          <iframe
            title={`Google Maps preview of ${data.settings.venueName}`}
            src={data.mapsEmbedUrl}
            className="h-full w-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </Reveal>
    </section>
  );
}
