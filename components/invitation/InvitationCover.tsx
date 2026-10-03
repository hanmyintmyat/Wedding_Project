"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { WeddingData } from "@/lib/invitation";

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
  const [year, month, day] = data.settings.weddingDate.slice(0, 10).split("-");
  const coverDate = `${day} • ${month} • ${year}`;
  return (
    <motion.section exit={{ opacity: 0 }} transition={{ duration: 0.65, ease: "easeInOut" }} className="fixed inset-0 z-50 flex min-h-[100dvh] items-center justify-start overflow-hidden bg-ink px-4 py-[clamp(1rem,3dvh,2.5rem)] text-white">
      <motion.div initial={{ scale: 1.06 }} animate={{ scale: 1 }} transition={{ duration: 5, ease: "easeOut" }} className="absolute inset-0">
        <Image src={hero} alt="Wedding invitation cover photo" fill priority sizes="100vw" className="object-cover object-bottom" />
      </motion.div>
      <div className="absolute inset-0 bg-black/35 sm:bg-[linear-gradient(90deg,rgba(30,43,28,0.85),rgba(30,43,28,0.40)_55%,rgba(30,43,28,0.08))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,0.34))]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="relative mx-auto flex max-h-[calc(100dvh-2rem)] w-[min(92vw,1120px)] flex-col items-start justify-center text-left"
      >
        <p className="mb-3 max-w-lg whitespace-pre-line font-serif text-xl italic text-white sm:text-2xl">{greeting.replace("Beloved Beloved Guest", "Beloved Guest")}</p>
        <p className="mb-6 max-w-md whitespace-pre-line font-serif text-sm leading-7 text-white/90 sm:text-base">{data.content.englishIntro}</p>
        <p className="eyebrow max-w-full text-[clamp(0.62rem,1.8vw,0.78rem)] text-white/80">{data.content.landingHeading}</p>
        <h1 className="mt-[clamp(0.7rem,2.2dvh,1.65rem)] max-w-full font-serif leading-[0.88] text-white">
          <span className="script block max-w-full break-words text-[clamp(2rem,8.6vw,5rem)]">{data.settings.groomName}</span>
          <span className="script block py-[clamp(0.08rem,0.7dvh,0.35rem)] text-[clamp(2rem,6vw,3.5rem)] text-white/90">&</span>
          <span className="script block max-w-full break-words text-[clamp(2rem,8.6vw,5rem)]">{data.settings.brideName}</span>
        </h1>
        <p className="mt-[clamp(0.85rem,2.4dvh,1.8rem)] font-serif text-[clamp(0.86rem,2.4vw,1.15rem)] tracking-[0.32em] text-white/90">{coverDate}</p>
        <div className="my-[clamp(0.9rem,2.7dvh,1.9rem)] h-px w-24 bg-white/55" />

        <button
          onClick={onOpen}
          className="mt-[clamp(1rem,3dvh,2.1rem)] min-h-11 rounded-full border border-white/70 bg-sage/90 px-6 py-3 text-[clamp(0.72rem,2vw,0.86rem)] font-bold uppercase tracking-[0.2em] text-white shadow-2xl transition hover:bg-sage focus-visible:outline-white sm:px-8"
        >
          Open Invitation
        </button>
      </motion.div>
    </motion.section>
  );
}
