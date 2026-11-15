"use client";

import { CalendarPlus, Copy, MapPinned, Navigation } from "lucide-react";
import { useRef, useState } from "react";

const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-sage/25 bg-white/70 px-4 py-3 text-sm font-bold text-sage transition hover:bg-sage hover:text-white";

export default function VenueActions({ location, directions, address, calendar }: { location: string; directions: string; address: string; calendar: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");
  const manualAddress = useRef<HTMLInputElement>(null);
  const value = address.trim();

  async function copyAddress() {
    if (!value) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        setStatus("copied");
        return;
      }
    } catch {
      // Embedded browsers may deny the modern clipboard permission.
    }
    const previousFocus = document.activeElement;
    const field = document.createElement("textarea");
    field.value = value;
    field.readOnly = true;
    field.style.cssText = "position:fixed;left:-9999px;top:0;font-size:16px";
    document.body.appendChild(field);
    let copied = false;
    try {
      field.select();
      field.setSelectionRange(0, value.length);
      copied = document.execCommand("copy");
    } catch {
      // Keep the address selectable when all clipboard APIs are blocked.
    } finally {
      field.remove();
      if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
    }
    setStatus(copied ? "copied" : "manual");
    if (!copied) requestAnimationFrame(() => { manualAddress.current?.focus(); manualAddress.current?.select(); });
  }

  return (
    <div className="mx-auto mt-9 max-w-3xl">
      <div className="venue-actions grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {location && <a className={buttonClass} href={location} target="_blank" rel="noopener noreferrer"><MapPinned aria-hidden="true" className="h-4 w-4 shrink-0" /> View Location</a>}
        {directions && <a className={buttonClass} href={directions} target="_blank" rel="noopener noreferrer"><Navigation aria-hidden="true" className="h-4 w-4 shrink-0" /> Get Directions</a>}
        <button type="button" className={buttonClass} onClick={copyAddress} disabled={!value}><Copy aria-hidden="true" className="h-4 w-4 shrink-0" /> Copy Address</button>
        <a className={buttonClass} href={calendar} target="_blank" rel="noopener noreferrer"><CalendarPlus aria-hidden="true" className="h-4 w-4 shrink-0" /> Add to Calendar</a>
      </div>
      <p role="status" aria-live="polite" className="mt-3 text-sm text-sage">
        {status === "copied" ? "Address copied" : status === "manual" ? "Select the address below and copy it." : !value ? "The venue address is not available yet." : ""}
      </p>
      {status === "manual" && <input ref={manualAddress} readOnly value={value} aria-label="Venue address to copy" onFocus={event => event.currentTarget.select()} className="mt-2 min-h-11 w-full rounded-xl border border-sage/25 bg-white/80 px-3 py-2 text-sm text-ink" />}
    </div>
  );
}
