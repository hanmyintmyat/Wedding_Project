import type { WeddingData } from "@/lib/invitation";
import { Reveal } from "./Reveal";
import BotanicalCorners from "./BotanicalCorners";

export default function DressCode({ data }: { data: WeddingData }) {
  return (
    <section id="dress-code" className="paper-section">
      <BotanicalCorners enabled={data.theme.floralEnabled} />
      <Reveal className="section-shell text-center">
        <p className="eyebrow">{data.content.dressCodeHeading}</p>
        <h2 className="mx-auto mt-4 max-w-lg font-serif text-[clamp(1.8rem,6vw,2.5rem)] leading-snug text-balance">{data.content.dressCodeSubtitle}</h2>
        <p className="mt-10 text-xs font-bold uppercase tracking-[0.24em] text-sage">Optional Colors</p>
        <div className="mx-auto mt-7 flex max-w-2xl flex-wrap justify-center gap-x-5 gap-y-7 sm:gap-x-8">
          {data.colors.map((color) => (
            <div key={color.id} className="grid w-20 justify-items-center gap-3">
              <span className="h-14 w-14 rounded-full border border-black/5 shadow-[inset_0_0_0_3px_rgba(255,255,255,0.3)]" style={{ backgroundColor: color.hex }} />
              <span className="text-center text-xs leading-5 text-muted">{color.name}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
