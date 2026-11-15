"use client";

import { CalendarHeart, GalleryHorizontal, Heart, Home, MapPin, Users } from "lucide-react";

const items = [
  { href: "#intro", label: "Home", icon: Home },
  { href: "#couple", label: "Couple", icon: Users },
  { href: "#event", label: "Event", icon: CalendarHeart },
  { href: "#venue", label: "Venue", icon: MapPin },
  { href: "#gallery", label: "Gallery", icon: GalleryHorizontal },
  { href: "#rsvp", label: "RSVP", icon: Heart }
];

export default function FloatingNavigation() {
  function scrollToSection(href: string) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelector(href)?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
  }

  return (
    <nav className="invitation-navigation min-w-0 flex-1 rounded-full border border-sage/15 bg-white/90 px-1.5 py-1 shadow-sm md:max-w-xl md:px-3" aria-label="Wedding sections">
      <div className="grid grid-cols-5 gap-0.5 md:grid-cols-6 md:gap-1">
        {items.map(item => (
          <button key={item.href} type="button" onClick={() => scrollToSection(item.href)} aria-controls={item.href.slice(1)}
            className={`${item.label === "Couple" ? "hidden md:grid" : "grid"} min-h-11 min-w-0 content-center justify-items-center gap-1 rounded-full px-0.5 py-1 text-[0.6rem] font-semibold text-sage hover:bg-sage/10 focus-visible:outline-2 md:px-2 md:text-xs`}>
            <item.icon aria-hidden="true" className="h-4 w-4" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
