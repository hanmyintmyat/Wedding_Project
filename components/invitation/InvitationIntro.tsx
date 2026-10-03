import type { WeddingData } from "@/lib/invitation";
import { Reveal } from "./Reveal";

export default function InvitationIntro({ data }: { data: WeddingData }) {
  return (
    <section id="intro" className="relative floral-corner">
      <Reveal className="section-shell text-center">
        <p className="eyebrow">With Joyful Hearts</p>
        <div className="mx-auto my-9 h-px w-28 bg-sage/35" />
        <p className="mx-auto max-w-2xl whitespace-pre-line font-serif text-2xl leading-relaxed text-ink sm:text-3xl">{data.content.englishIntro}</p>
        <p className="font-myanmar mx-auto mt-10 max-w-3xl whitespace-pre-line text-base text-muted sm:text-lg">{data.content.myanmarIntro}</p>
      </Reveal>
    </section>
  );
}
