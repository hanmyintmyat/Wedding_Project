"use client";

import { Pause, Play } from "lucide-react";
import type { RefObject } from "react";

export default function MusicPlayer({
  audioRef,
  title,
  playing
}: {
  audioRef: RefObject<HTMLAudioElement | null>;
  title: string;
  playing: boolean;
}) {
  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      await audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
  }

  const label = playing ? "Pause music" : "Play music";

  return (
    <button
      onClick={togglePlay}
      className="fixed right-3 bottom-24 z-[60] grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-white/70 bg-sage/90 text-white shadow-lg backdrop-blur focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage sm:right-4 lg:bottom-5"
      type="button"
      title={`${label}: ${title}`}
      aria-label={label}
      aria-pressed={playing}
    >
      {playing ? <Pause aria-hidden className="h-4 w-4" /> : <Play aria-hidden className="h-4 w-4" />}
    </button>
  );
}
