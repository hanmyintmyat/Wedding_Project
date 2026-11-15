import type { WeddingData } from "@/lib/invitation";
import { formatDisplayDate } from "@/lib/calendar";
import { Reveal } from "./Reveal";
import BotanicalCorners from "./BotanicalCorners";
import CoupleNames from "./CoupleNames";

export default function Footer({ data }: { data: WeddingData }) {
  return (
    <footer className="paper-section overflow-hidden bg-sage/5">
      <BotanicalCorners enabled={data.theme.floralEnabled} />
      <Reveal className="section-shell text-center">
        <h2 className="script text-[clamp(3.4rem,12vw,4.5rem)] leading-normal text-sage">Thank You</h2>
        <p className="mt-3 font-serif text-xl sm:text-2xl">{data.content.thankYouText}</p>
        <p className="mx-auto mt-4 max-w-xl leading-7 text-muted">{data.content.footerMessage}</p>
        <div className="mx-auto my-9 h-px w-24 bg-sage/35" />
        <p className="flex justify-center text-ink">
          <CoupleNames groom={data.settings.groomName} bride={data.settings.brideName} className="footer-names" />
        </p>
        <p className="mt-7 text-xs uppercase tracking-[0.2em] text-sage sm:text-sm">{formatDisplayDate(data.settings.weddingDate)}</p>
      </Reveal>
    </footer>
  );
}
