import type { WeddingData } from "@/lib/invitation";
import { formatDisplayDate } from "@/lib/calendar";
import { Reveal } from "./Reveal";

export default function Footer({ data }: { data: WeddingData }) {
  return (
    <footer className="relative overflow-hidden bg-sage/10 pb-24 md:pb-0">
      <Reveal className="section-shell text-center">
        <p className="script text-6xl text-sage">Thank You</p>
        <p className="mt-5 font-serif text-2xl">{data.content.thankYouText}</p>
        <p className="mx-auto mt-4 max-w-xl leading-7 text-muted">{data.content.footerMessage}</p>
        <div className="mx-auto my-9 h-px w-24 bg-sage/35" />
        <p className="script flex flex-col items-center gap-2 text-[clamp(2rem,9vw,3.5rem)] leading-[1.2] text-ink">
          <span className="block max-w-full">{data.settings.groomName}</span>
          <span className="block text-[0.75em]">&</span>
          <span className="block max-w-full">{data.settings.brideName}</span>
        </p>
        <p className="mt-5 text-sm uppercase tracking-[0.24em] text-sage">{formatDisplayDate(data.settings.weddingDate)}</p>
      </Reveal>
    </footer>
  );
}
