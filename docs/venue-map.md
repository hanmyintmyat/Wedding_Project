# Wedding venue map

The interactive map uses the exact **Google Maps → Share → Embed a map** URL
supplied for CALI Raffles Place. It is stored in `lib/venue-embed.ts` and rendered
by `components/invitation/VenueMap.tsx`. No API key, JavaScript API loader,
environment variable or Vercel configuration is required.

The rounded container is 300px high on mobile, 350px on tablet and 400px on
desktop. Every browser, including Messenger, Facebook and Instagram, receives
the same interactive embed. The unsupported `q=...&output=embed` form is absent.

View Location and Get Directions still use admin-configured coordinates, then
address/name fallbacks. Copy Address and Add to Calendar are unchanged. Because
the share embed identifies a specific place, a later admin change to another
location displays the venue fallback instead of silently showing CALI's map.
Supply a new Google share-embed URL in code when moving to another venue.

Reported iframe errors show the venue fallback. Browsers do not reliably expose
cross-origin frame failures to the parent page, so external venue links remain
available above the map. Actual Messenger/Facebook/Instagram WebViews need
real-device verification; user-agent emulation alone cannot prove their behavior.
