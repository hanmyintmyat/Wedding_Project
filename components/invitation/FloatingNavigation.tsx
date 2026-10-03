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

const mobileItems = items.filter((item) => item.label !== "Couple");

export default function FloatingNavigation() {
  function scrollToSection(href: string) {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <nav className="fixed left-1/2 top-5 z-30 hidden -translate-x-1/2 rounded-full border border-sage/15 bg-white/75 px-4 py-2 shadow-sm backdrop-blur lg:block" aria-label="Wedding sections">
        <div className="flex items-center gap-1">
          {items.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => scrollToSection(item.href)}
              className="rounded-full px-3 py-2 text-xs font-bold uppercase tracking-widest text-sage transition hover:bg-sage/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
      <nav className="fixed bottom-3 left-1/2 z-40 w-[min(94vw,390px)] -translate-x-1/2 rounded-full border border-sage/15 bg-white/88 px-2 py-2 shadow-xl backdrop-blur lg:hidden" aria-label="Wedding sections">
        <div className="grid grid-cols-5 gap-1">
          {mobileItems.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => scrollToSection(item.href)}
              className="grid min-h-11 justify-items-center gap-1 rounded-full px-1 py-1.5 text-[0.62rem] font-bold text-sage transition hover:bg-sage/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
