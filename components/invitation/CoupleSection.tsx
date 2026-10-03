import Image from "next/image";
import type { WeddingData } from "@/lib/invitation";
import { Reveal } from "./Reveal";

export default function CoupleSection({ data }: { data: WeddingData }) {
  const groomPhoto = data.media.find((asset) => asset.type === "GROOM")?.url || "/images/groom-portrait.jpeg";
  const bridePhoto = data.media.find((asset) => asset.type === "BRIDE")?.url || "/images/bride-portrait.jpeg";
  const people = [
    {
      name: data.settings.groomName,
      photo: groomPhoto,
      parents: data.content.groomParents,
      description: data.content.groomDescription
    },
    {
      name: data.settings.brideName,
      photo: bridePhoto,
      parents: data.content.brideParents,
      description: data.content.brideDescription
    }
  ];

  return (
    <section id="couple" className="bg-white/38">
      <div className="section-shell">
        <Reveal className="text-center">
          <p className="eyebrow">{data.content.coupleHeading}</p>
          <h2 className="script mt-4 text-6xl text-sage sm:text-7xl">The Couple</h2>
        </Reveal>
        <div className="mt-12 grid gap-12 md:grid-cols-2">
          {people.map((person, index) => (
            <Reveal key={person.name} delay={index * 0.12} className="text-center">
              <div className="relative mx-auto aspect-[2/3] w-64 overflow-hidden rounded-t-[9rem] rounded-b-2xl border border-sage/20 bg-cream p-2 shadow-[0_20px_70px_rgba(68,60,53,0.10)] sm:w-72">
                <Image src={person.photo} alt={person.name} fill sizes="(max-width: 640px) 256px, 288px" className="portrait-photo object-cover object-top" />
              </div>
              <h3 className="mt-7 font-serif text-3xl text-ink">{person.name}</h3>
              {person.parents && <p className="mt-3 text-sm uppercase tracking-[0.18em] text-sage">{person.parents}</p>}
              {person.description && <p className="mx-auto mt-4 max-w-sm leading-7 text-muted">{person.description}</p>}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
