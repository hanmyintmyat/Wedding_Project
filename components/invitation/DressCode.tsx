import { X } from "lucide-react";
import type { WeddingData } from "@/lib/invitation";
import { Reveal } from "./Reveal";

export default function DressCode({ data }: { data: WeddingData }) {
  return (
    <section id="dress-code">
      <Reveal className="section-shell text-center">
        <p className="eyebrow">{data.content.dressCodeHeading}</p>
        <h2 className="mt-4 font-serif text-4xl">{data.content.dressCodeSubtitle}</h2>
        <p className="mx-auto mt-5 max-w-xl text-muted">{data.content.dressCodeWarning}</p>
        <p className="mt-10 text-xs font-bold uppercase tracking-[0.24em] text-sage">Optional Colors</p>
        <div className="mt-7 flex flex-wrap justify-center gap-5 sm:gap-8">
          {data.colors.map((color) => (
            <div key={color.id} className="grid w-20 justify-items-center gap-3">
              <span className="h-14 w-14 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: color.hex }} />
              <span className="text-center text-xs leading-5 text-muted">{color.name}</span>
            </div>
          ))}
          <div className="grid w-20 justify-items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-full border border-sage/35 bg-white">
              <X className="h-5 w-5 text-sage" />
            </span>
            <span className="text-center text-xs leading-5 text-muted">Avoid White</span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
