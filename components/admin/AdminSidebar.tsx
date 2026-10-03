"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { CalendarHeart, Eye, FileText, ImageIcon, LayoutDashboard, LogOut, MapPinned, Palette, Settings, Shirt, Users } from "lucide-react";
import clsx from "clsx";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/guests", label: "Guests", icon: Users },
  { href: "/admin/rsvp", label: "RSVP", icon: CalendarHeart },
  { href: "/admin/event", label: "Event", icon: MapPinned },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/design", label: "Design", icon: Palette },
  { href: "/admin/preview", label: "Preview", icon: Eye },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 border-r border-sage/15 bg-cream/75 p-5 backdrop-blur lg:block">
      <Link href="/admin" className="block rounded-2xl border border-sage/15 bg-white/60 p-5">
        <p className="script text-4xl text-sage">Wedding CMS</p>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted">Invitation Admin</p>
      </Link>
      <nav className="mt-6 grid gap-1" aria-label="Admin navigation">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-muted transition hover:bg-white/80 hover:text-sage",
              pathname === item.href && "bg-white text-sage shadow-sm"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <button onClick={() => signOut({ callbackUrl: "/admin/login" })} className="mt-8 flex w-full items-center gap-3 rounded-xl border border-sage/15 px-3 py-3 text-sm font-bold text-muted hover:bg-white">
        <LogOut className="h-4 w-4" /> Sign Out
      </button>
      <div className="mt-8 flex items-center gap-2 text-xs text-muted">
        <Shirt className="h-4 w-4 text-sage" />
        Elegant Sage theme active
      </div>
    </aside>
  );
}
