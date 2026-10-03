"use client";

import { AnimatePresence, MotionConfig } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { WeddingData } from "@/lib/invitation";
import { greetingFor } from "@/lib/invitation-utils";
import InvitationCover from "./InvitationCover";
import InvitationIntro from "./InvitationIntro";
import CoupleSection from "./CoupleSection";
import EventDetails from "./EventDetails";
import SaveTheDateCalendar from "./SaveTheDateCalendar";
import DressCode from "./DressCode";
import VenueSection from "./VenueSection";
import Gallery from "./Gallery";
import RSVPForm from "./RSVPForm";
import FloatingNavigation from "./FloatingNavigation";
import Footer from "./Footer";
import MusicPlayer from "./MusicPlayer";

export default function InvitationExperience({ data, guestName, personalizedGreeting }: { data: WeddingData; guestName: string; personalizedGreeting?: string | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const music = data.media.find((asset) => asset.type === "MUSIC")?.url || "/music/wildest-dreams.mp3";
  const [opened, setOpened] = useState(false);
  const sections = useMemo(() => data.sections.filter((section) => section.enabled).sort((a, b) => a.sortOrder - b.sortOrder), [data.sections]);
  const hero = data.media.find((asset) => asset.type === "HERO")?.url || "/images/MainPhoto.jpeg";
  const greeting = personalizedGreeting || greetingFor(data.content.greetingTemplate, guestName);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !data.settings.musicEnabled) return;
    audio.volume = data.settings.musicVolume;

  }, [data.settings.musicEnabled, data.settings.musicVolume, music]);

  function openInvitation() {
    if (data.settings.musicEnabled) void audioRef.current?.play().catch(() => undefined);
    setOpened(true);
    setTimeout(() => document.getElementById("intro")?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  return (
    <MotionConfig reducedMotion="user">
    <main className="wedding-experience"
      style={
        {
          "--sage": data.theme.primaryColor,
          "--blush": data.theme.secondaryColor,
          "--ivory": data.theme.backgroundColor
        } as React.CSSProperties
      }
    >
      {data.settings.musicEnabled && (
        <>
          <audio ref={audioRef} src={music} loop preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
          <MusicPlayer audioRef={audioRef} title={data.settings.musicTitle} playing={playing} />
        </>
      )}
      <AnimatePresence>
        {!opened && <InvitationCover key="cover" data={data} hero={hero} greeting={greeting} onOpen={openInvitation} />}
      </AnimatePresence>
      {opened && <div>
        <FloatingNavigation />
        {sections.map((section) => {
          switch (section.sectionKey) {
            case "intro":
              return <InvitationIntro key={section.sectionKey} data={data} />;
            case "couple":
              return <CoupleSection key={section.sectionKey} data={data} />;
            case "event":
              return <EventDetails key={section.sectionKey} data={data} />;
            case "save-date":
              return <SaveTheDateCalendar key={section.sectionKey} data={data} />;
            case "dress-code":
              return <DressCode key={section.sectionKey} data={data} />;
            case "venue":
              return <VenueSection key={section.sectionKey} data={data} />;
            case "gallery":
              return <Gallery key={section.sectionKey} data={data} />;
            case "rsvp":
              return <RSVPForm key={section.sectionKey} guestName={guestName === "Beloved Guest" ? "" : guestName} />;
            case "footer":
              return <Footer key={section.sectionKey} data={data} />;
            default:
              return null;
          }
        })}
      </div>}
    </main>
    </MotionConfig>
  );
}
