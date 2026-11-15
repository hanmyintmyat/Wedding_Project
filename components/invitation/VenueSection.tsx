import type { WeddingData } from "@/lib/invitation";
import { formatDisplayDate, googleCalendarLink } from "@/lib/calendar";
import { buildVenueMapsLinks, venueAddressLines } from "@/lib/venue-links";
import { Reveal } from "./Reveal";
import VenueActions from "./VenueActions";
import { MapPinned } from "lucide-react";

export default function VenueSection({ data }: { data: WeddingData }) {
  const maps = buildVenueMapsLinks(data.settings);
  const venueName = data.settings.venueName.trim() || "Wedding venue";
  const address = venueAddressLines(data.settings.venueAddress.trim());
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
        <div className="mx-auto mt-8 h-[320px] max-w-3xl overflow-hidden rounded-2xl border border-sage/15 bg-cream sm:h-[400px]" role="region" aria-label="Venue location preview">
          {/* The key-free preview is safe in every browser, including embedded
              browsers that block Google frames. Never request an iframe first. */}
          <div className="flex h-full min-w-0 flex-col items-center justify-center px-5 py-6 sm:px-8">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-sage/20 bg-ivory/80 text-sage">
              <MapPinned aria-hidden="true" className="h-8 w-8" />
            </span>
            <h3 className="mt-5 max-w-full font-serif text-xl text-ink sm:text-2xl">{venueName}</h3>
            {address && <p className="mt-3 max-w-md whitespace-pre-line text-sm leading-7 text-muted">{address}</p>}
            <p className="mt-5 text-xs leading-6 text-sage">{maps.location ? "Tap View Location to open the map" : "Venue details will be shared soon."}</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
