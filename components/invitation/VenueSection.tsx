import { CalendarPlus, MapPinned, Navigation } from "lucide-react";
import type { WeddingData } from "@/lib/invitation";
import { formatDisplayDate, googleCalendarLink } from "@/lib/calendar";
import { Reveal } from "./Reveal";

export default function VenueSection({ data }: { data: WeddingData }) {
  const maps = data.settings.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${data.settings.venueName} ${data.settings.venueAddress}`)}`;
  return (
    <section id="venue" className="bg-white/35">
      <Reveal className="section-shell text-center">
        <p className="eyebrow">{data.content.venueHeading}</p>
        <h2 className="mt-4 font-serif text-4xl">{data.settings.venueName}</h2>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted">{data.settings.venueAddress}</p>
        <p className="mt-5 text-sm uppercase tracking-[0.2em] text-sage">
          {formatDisplayDate(data.settings.weddingDate)} • {data.settings.startTime} – {data.settings.endTime}
        </p>
        <div className="mx-auto mt-9 grid max-w-2xl gap-3 sm:grid-cols-3">
          <a className="inline-flex items-center justify-center gap-2 rounded-full border border-sage/25 bg-white/70 px-5 py-3 text-sm font-bold text-sage transition hover:bg-sage hover:text-white" href={maps} target="_blank" rel="noreferrer">
            <MapPinned className="h-4 w-4" /> View Location
          </a>
          <a className="inline-flex items-center justify-center gap-2 rounded-full border border-sage/25 bg-white/70 px-5 py-3 text-sm font-bold text-sage transition hover:bg-sage hover:text-white" href={maps} target="_blank" rel="noreferrer">
            <Navigation className="h-4 w-4" /> Get Directions
          </a>
          <a className="inline-flex items-center justify-center gap-2 rounded-full border border-sage/25 bg-white/70 px-5 py-3 text-sm font-bold text-sage transition hover:bg-sage hover:text-white" href={googleCalendarLink(data)} target="_blank" rel="noreferrer">
            <CalendarPlus className="h-4 w-4" /> Add to Calendar
          </a>
        </div>
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
