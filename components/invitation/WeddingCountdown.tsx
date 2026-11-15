"use client";

import { useEffect, useState } from "react";

export default function WeddingCountdown({ target }: { target: number }) {
  // A stable first render avoids server/client clock differences at hydration.
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!Number.isFinite(target)) return;
    const timer = window.setInterval(() => setRemaining(Math.max(0, Math.floor((target - Date.now()) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  if (!Number.isFinite(target)) return null;
  const units = [
    { label: "Days", value: remaining === null ? null : Math.floor(remaining / 86400) },
    { label: "Hours", value: remaining === null ? null : Math.floor(remaining / 3600) % 24 },
    { label: "Minutes", value: remaining === null ? null : Math.floor(remaining / 60) % 60 },
    { label: "Seconds", value: remaining === null ? null : remaining % 60 }
  ];

  return (
    <div className="mx-auto mt-10 max-w-sm border-t border-sage/20 pt-8" role="timer" aria-label="Countdown to our wedding" aria-live="off">
      <p className="font-serif text-base italic text-muted">{remaining === 0 ? "Our wedding day has arrived" : "Counting down to forever"}</p>
      <dl className="mt-5 grid grid-cols-4 divide-x divide-sage/20">
        {units.map(unit => (
          <div key={unit.label} className="flex min-w-0 flex-col-reverse gap-2 px-1">
            <dt className="text-[0.56rem] uppercase tracking-[0.12em] text-muted sm:text-[0.65rem] sm:tracking-[0.18em]">{unit.label}</dt>
            <dd className="font-serif text-[clamp(1.6rem,6vw,2.5rem)] leading-none tabular-nums text-sage">{unit.value === null ? "—" : String(unit.value).padStart(2, "0")}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
