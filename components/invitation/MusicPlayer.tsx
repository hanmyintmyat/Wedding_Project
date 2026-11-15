"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useRef, type RefObject } from "react";

export default function MusicPlayer({ audioRef, title, playing, volume, muted }: {
  audioRef: RefObject<HTMLAudioElement | null>;
  title: string;
  playing: boolean;
  volume: number;
  muted: boolean;
}) {
  const lastVolume = useRef(volume || 0.55);
  const silent = muted || volume === 0;

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => undefined);
    else audio.pause();
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.muted || audio.volume === 0) {
      if (audio.volume === 0) audio.volume = lastVolume.current;
      audio.muted = false;
    } else audio.muted = true;
  }

  const label = playing ? "Pause music" : "Play music";
  const controlClass = "music-toggle flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-white/70 bg-sage px-3 text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage";

  return (
    <div className="music-player flex shrink-0 items-center gap-1" role="group" aria-label="Wedding music">
      <button onClick={togglePlay} className={controlClass} type="button" title={`${label}: ${title}`} aria-label={label} aria-pressed={playing}>
        {playing ? <Pause aria-hidden="true" className="h-4 w-4" /> : <Play aria-hidden="true" className="h-4 w-4" />}
        <span className="hidden max-w-28 truncate text-xs lg:block">{title}</span>
      </button>
      <button onClick={toggleMute} className={controlClass} type="button" title={silent ? "Unmute music" : "Mute music"} aria-label={silent ? "Unmute music" : "Mute music"} aria-pressed={silent}>
        {silent ? <VolumeX aria-hidden="true" className="h-4 w-4" /> : <Volume2 aria-hidden="true" className="h-4 w-4" />}
      </button>
      <label className="ml-1 hidden items-center xl:flex">
        <span className="sr-only">Music volume</span>
        <input type="range" min={0} max={1} step={0.05} value={volume} aria-label="Music volume" onChange={event => {
          const audio = audioRef.current;
          if (!audio) return;
          const value = Number(event.currentTarget.value);
          if (value > 0) lastVolume.current = value;
          audio.volume = value;
          if (value > 0) audio.muted = false;
        }} className="min-h-11 w-20 cursor-pointer accent-sage" />
      </label>
    </div>
  );
}
