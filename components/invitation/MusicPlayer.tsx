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
      className="music-toggle flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-white/70 bg-sage px-3 text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage lg:max-w-56 lg:px-4"
      type="button"
      title={`${label}: ${title}`}
      aria-label={label}
      aria-pressed={playing}
    >
      {playing ? <Pause aria-hidden className="h-4 w-4" /> : <Play aria-hidden className="h-4 w-4" />}
      <span className="hidden max-w-40 truncate text-xs lg:block">{title}</span>
    </button>
  );
}
