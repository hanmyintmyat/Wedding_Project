import { CalendarDays, Clock, MapPin, Music } from "lucide-react";
import type { WeddingData } from "@/lib/invitation";
import { formatDisplayDate } from "@/lib/calendar";
import { Reveal } from "./Reveal";

export default function EventDetails({ data }: { data: WeddingData }) {
  const items = [
    { icon: CalendarDays, label: "Date", value: formatDisplayDate(data.settings.weddingDate) },
    { icon: Clock, label: "Time", value: `${data.settings.startTime} – ${data.settings.endTime}` },
    { icon: MapPin, label: "Venue", value: data.settings.venueName },
    { icon: Music, label: "Soundtrack", value: data.settings.musicTitle }
  ];

  return (
    <section id="event">
      <div className="section-shell">
        <Reveal className="text-center">
          <p className="eyebrow">{data.content.eventHeading}</p>
          <h2 className="mt-4 font-serif text-4xl sm:text-5xl">A Day to Remember</h2>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => (
            <Reveal key={item.label} delay={index * 0.08} className="rounded-2xl border border-sage/15 bg-white/55 p-5 text-center shadow-sm">
              <item.icon aria-hidden className="mx-auto h-6 w-6 text-sage" />
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.22em] text-sage">{item.label}</p>
              <p className="mt-3 text-sm leading-6 text-muted">{item.value}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
