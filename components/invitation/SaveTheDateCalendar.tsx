import type { WeddingData } from "@/lib/invitation";
import { buildMonthCalendar } from "@/lib/calendar";
import { Reveal } from "./Reveal";

export default function SaveTheDateCalendar({ data }: { data: WeddingData }) {
  const calendar = buildMonthCalendar(data.settings.weddingDate);
  return (
    <section id="save-date" className="bg-cream/55">
      <Reveal className="section-shell max-w-xl text-center">
        <p className="eyebrow">{data.content.saveDateHeading}</p>
        <h2 className="mt-4 font-serif text-4xl">{calendar.monthLabel}</h2>
        <div className="mx-auto mt-10 max-w-md rounded-[1.5rem] border border-sage/18 bg-white/62 p-5 shadow-[0_20px_80px_rgba(68,60,53,0.07)]">
          <div className="grid grid-cols-7 gap-1 text-xs font-bold uppercase tracking-widest text-sage">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1">
            {calendar.cells.map((day, index) => (
              <div key={`${day}-${index}`} className="grid aspect-square place-items-center text-sm text-muted">
                {day && (
                  <span className={day === calendar.highlightedDay ? "grid h-10 w-10 place-items-center rounded-full bg-blush/45 font-bold text-ink ring-1 ring-blush" : ""}>
                    {day}
                    {day === calendar.highlightedDay && <span className="sr-only"> wedding day</span>}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        <p className="mt-8 font-serif text-xl text-ink">We can&apos;t wait to celebrate this special day with you.</p>
      </Reveal>
    </section>
  );
}
