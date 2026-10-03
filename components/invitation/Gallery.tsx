"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { WeddingData } from "@/lib/invitation";
import { Reveal } from "./Reveal";

export default function Gallery({ data }: { data: WeddingData }) {
  const reducedMotion = useReducedMotion();
  const images = data.media.filter((asset) => asset.type === "GALLERY");
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (active === null) return;
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowRight") setActive((active + 1) % images.length);
      if (event.key === "ArrowLeft") setActive((active - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, images.length]);

  if (!images.length) return null;

  return (
    <section id="gallery">
      <div className="section-shell">
        <Reveal className="text-center">
          <p className="eyebrow">{data.content.galleryHeading}</p>
          <h2 className="script mt-4 text-6xl text-sage">Our Moments</h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {images.map((image, index) => (
            <motion.button initial={reducedMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.8, delay: (index % 3) * 0.08 }} key={image.id} onClick={() => setActive(index)} className="group relative aspect-[4/5] overflow-hidden rounded-[1.25rem] border border-sage/12 bg-cream">
              <Image src={image.url} alt={image.alt || "Wedding gallery photo"} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.025]" />
            </motion.button>
          ))}
        </div>
      </div>
      {active !== null && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/82 p-4" role="dialog" aria-modal="true" aria-label="Gallery image viewer">
          <button className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-ink" onClick={() => setActive(null)} aria-label="Close gallery">
            <X className="h-5 w-5" />
          </button>
          <button className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink" onClick={() => setActive((active - 1 + images.length) % images.length)} aria-label="Previous image">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="relative h-[82vh] w-[min(92vw,900px)]">
            <Image src={images[active].url} alt={images[active].alt || "Wedding gallery photo"} fill sizes="92vw" className="object-contain" />
          </div>
          <button className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink" onClick={() => setActive((active + 1) % images.length)} aria-label="Next image">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </section>
  );
}
