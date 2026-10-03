import type { Metadata } from "next";
import { Great_Vibes, Noto_Sans, Noto_Sans_Myanmar, Playfair_Display } from "next/font/google";
import "./globals.css";

const body = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

const heading = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap"
});

const script = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
  display: "swap"
});

const myanmar = Noto_Sans_Myanmar({
  subsets: ["myanmar"],
  variable: "--font-myanmar",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Myo Thwin Kyaw & Khaing Su Wai Wedding",
  description: "A romantic wedding invitation for 10 January 2027.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${body.variable} ${heading.variable} ${script.variable} ${myanmar.variable}`}>
      <body>{children}</body>
    </html>
  );
}
