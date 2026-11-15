"use client";

import Image, { getImageProps } from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { WeddingData } from "@/lib/invitation";
import CoupleNames from "./CoupleNames";
import { weddingConfig } from "@/config/wedding.config";

export default function InvitationCover({
  data,
  hero,
  greeting,
  onOpen
}: {
  data: WeddingData;
  hero: string;
  greeting: string;
  onOpen: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const currentCollection = hero === weddingConfig.heroImage;
  const mobileHero = currentCollection ? weddingConfig.mobileHeroImage : hero;
  // Cover crops can render wider than the visible viewport on portrait tablets.
  // Account for that width so the browser does not stretch a small rendition.
  const desktopSizes = currentCollection ? "(min-aspect-ratio: 3/2) 100vw, 150dvh" : "100vw";
  const mobileSizes = currentCollection ? "(min-aspect-ratio: 2/3) 100vw, 67dvh" : "100vw";
  const heroImageProps = { alt: "Wedding invitation cover photo", fill: true, quality: 85 };
  const desktopSrcSet = getImageProps({ ...heroImageProps, sizes: desktopSizes, src: hero }).props.srcSet;
  const mobileSrcSet = getImageProps({ ...heroImageProps, sizes: mobileSizes, src: mobileHero }).props.srcSet;
  const [year, month, day] = data.settings.weddingDate.slice(0, 10).split("-");
  const coverDate = `${day} • ${month} • ${year}`;
  return (
    <motion.section exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.65, ease: "easeInOut" }} className="invitation-cover fixed inset-0 z-50 overflow-y-auto bg-ink text-white" aria-label="Your wedding invitation">
      {/* Media-specific preloads prioritize only the crop this viewport needs. */}
      <link rel="preload" as="image" media="(max-width: 767px)" imageSrcSet={mobileSrcSet} imageSizes={mobileSizes} fetchPriority="high" />
      <link rel="preload" as="image" media="(min-width: 768px)" imageSrcSet={desktopSrcSet} imageSizes={desktopSizes} fetchPriority="high" />
      <motion.div initial={reducedMotion ? false : { scale: 1.06 }} animate={{ scale: 1 }} transition={{ duration: 5, ease: "easeOut" }} className="absolute inset-0">
        <picture>
          <source media="(min-width: 768px)" srcSet={desktopSrcSet} sizes={desktopSizes} />
          <Image {...heroImageProps} alt={heroImageProps.alt} src={mobileHero} sizes={mobileSizes} loading="eager" fetchPriority="high" className="hero-image object-cover" />
        </picture>
      </motion.div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(22,34,24,0.38),rgba(22,34,24,0.32)_55%,rgba(22,34,24,0.04)_80%)] sm:bg-[linear-gradient(90deg,rgba(22,34,24,0.62),rgba(22,34,24,0.28)_48%,rgba(22,34,24,0.04))]" />
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="hero-content relative mx-auto flex min-h-full w-[min(100%-2.5rem,1120px)] flex-col items-center text-center sm:items-start sm:justify-center sm:text-left"
      >
        <p className="hero-greeting max-w-[22rem] whitespace-pre-line break-words font-serif text-[clamp(0.88rem,3.4vw,1.1rem)] italic leading-relaxed tracking-[0.025em] text-white/95">{greeting.replace("Beloved Beloved Guest", "Beloved Guest")}</p>
        <div className="my-4 h-px w-12 bg-white/45 sm:my-5" />
        <p className="hero-intro mb-5 max-w-[22rem] whitespace-pre-line font-serif text-[0.78rem] leading-6 text-white/85 sm:text-sm">{data.content.englishIntro}</p>
        <p className="max-w-full text-[0.6rem] font-medium uppercase tracking-[0.3em] text-white/85 sm:text-[0.68rem]">{data.content.landingHeading}</p>
        <h1 className="mt-4 max-w-full text-white">
          <CoupleNames groom={data.settings.groomName} bride={data.settings.brideName} className="hero-names" />
        </h1>
        <p className="mt-5 font-serif text-[0.78rem] tracking-[0.24em] text-white/90 sm:mt-7 sm:text-sm">{coverDate}</p>

        <button
          onClick={onOpen}
          className="mt-7 min-h-11 rounded-full border border-white/60 bg-white/12 px-6 py-3 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-white shadow-lg backdrop-blur-sm transition hover:bg-white/25 focus-visible:outline-white sm:mt-8 sm:px-8 sm:text-xs"
        >
          Open Invitation
        </button>
      </motion.div>
    </motion.section>
  );
}
