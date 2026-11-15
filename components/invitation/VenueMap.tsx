"use client";

import { useEffect, useRef, useState } from 'react';
import { MapPinned } from 'lucide-react';

type Props = {
  embedUrl: string | null;
  venueName: string;
  address: string;
  locationUrl: string;
};

export default function VenueMap({ embedUrl, venueName, address, locationUrl }: Props) {
  const [failed, setFailed] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const showFallback = () => setFailed(true);
    // Frame errors do not bubble through React's delegated event handler.
    // Browsers can also suppress cross-origin errors entirely; keep the
    // external venue actions available independently of the frame.
    frame.addEventListener('error', showFallback);
    return () => frame.removeEventListener('error', showFallback);
  }, [embedUrl]);

  return (
    <div className="relative isolate mx-auto mt-8 h-[300px] w-full max-w-3xl overflow-hidden rounded-2xl border border-sage/15 bg-cream md:h-[350px] lg:h-[400px]" role="region" aria-label="Wedding venue map">
      {embedUrl && !failed ? (
        <iframe
          ref={frameRef}
          title={`Map of ${venueName}`}
          src={embedUrl}
          width="600"
          height="450"
          className="h-full w-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div className="flex h-full min-w-0 flex-col items-center justify-center overflow-auto px-4 py-3 text-center sm:px-8">
          <MapPinned aria-hidden="true" className="h-6 w-6 shrink-0 text-sage sm:h-8 sm:w-8" />
          <h3 className="mt-2 shrink-0 font-serif text-xl text-ink sm:text-2xl">View Wedding Venue</h3>
          <p className="mt-1 max-w-full shrink-0 font-serif text-base leading-6 break-words text-ink sm:text-lg">{venueName}</p>
          {address && <p className="mt-1 max-w-md shrink-0 text-xs leading-5 break-words whitespace-pre-line text-muted sm:text-sm sm:leading-6">{address}</p>}
          {!locationUrl && <p className="mt-1 shrink-0 text-xs text-sage">Venue details will be shared soon.</p>}
          {locationUrl && <a href={locationUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 max-w-full shrink-0 items-center justify-center rounded-full border border-sage/25 bg-white/70 px-5 py-2 text-sm font-bold text-sage transition hover:bg-sage hover:text-white">View Location</a>}
        </div>
      )}
    </div>
  );
}
