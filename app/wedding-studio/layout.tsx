import type { Metadata } from 'next';

// Authentication pages and session-protected content are always request-specific.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
