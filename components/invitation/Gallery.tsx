"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { WeddingData } from "@/lib/invitation";
import { Reveal } from "./Reveal";

export default function Gallery({ data }: { data: WeddingData }) {
  const reducedMotion = useReducedMotion();
  const images = data.media.filter(asset => asset.type === "GALLERY");
  const [active, setActive] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const activeImage = active === null ? null : images[active];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (active !== null && !dialog.open) dialog.showModal();
    if (active === null && dialog.open) dialog.close();
  }, [active]);

  function move(direction: number) {
    setActive(current => current === null ? null : (current + direction + images.length) % images.length);
  }

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
            <motion.button type="button" initial={reducedMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.8, delay: (index % 3) * 0.08 }} key={image.id} onClick={() => setActive(index)} aria-label={`View photo ${index + 1}: ${image.alt || "Our wedding moments"}`} className="group relative aspect-[4/5] overflow-hidden rounded-[1.25rem] border border-sage/12 bg-cream">
              <Image src={image.url} alt={image.alt || "Wedding gallery photo"} fill loading="lazy" quality={75} sizes="(max-width: 767px) calc((100vw - 44px) / 2), (max-width: 1152px) calc((100vw - 72px) / 3), 360px" className="object-cover transition duration-500 group-hover:scale-[1.025]" />
            </motion.button>
          ))}
        </div>
      </div>
      <dialog ref={dialogRef} className="gallery-dialog" aria-label="Gallery image viewer" onCancel={() => setActive(null)} onClose={() => setActive(null)} onClick={event => { if (event.target === event.currentTarget) setActive(null); }} onKeyDown={event => {
        if (event.key === "Tab") {
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not([disabled])"));
          const current = controls.indexOf(document.activeElement as HTMLButtonElement);
          const next = (current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
          event.preventDefault();
          controls[next]?.focus();
        }
        if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
        if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
      }}>
        <button type="button" className="gallery-close grid h-11 w-11 place-items-center rounded-full bg-white/95 text-ink" onClick={() => setActive(null)} aria-label="Close gallery"><X aria-hidden="true" className="h-5 w-5" /></button>
        {activeImage && <div className="gallery-image-frame">
          <Image src={activeImage.url} alt={activeImage.alt || "Wedding gallery photo"} fill quality={90} sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1504px) calc(100vw - 64px), 1440px" className="object-contain" />
        </div>}
        <div className="gallery-controls">
          <button type="button" className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-ink" onClick={() => move(-1)} aria-label="Previous image"><ChevronLeft aria-hidden="true" className="h-5 w-5" /></button>
          <p className="min-w-16 text-center text-sm tabular-nums text-white" aria-live="polite">{active === null ? "" : `${active + 1} / ${images.length}`}</p>
          <button type="button" className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-ink" onClick={() => move(1)} aria-label="Next image"><ChevronRight aria-hidden="true" className="h-5 w-5" /></button>
        </div>
      </dialog>
    </section>
  );
}
