# Venue, One–Five gallery and Wedding Studio update

The existing Next.js, Vercel, Prisma Postgres, NextAuth and Blob architecture is retained. No schema migration or database reset is needed. Do not rerun the general seed against an existing production database for this update.

The administration UI is now `/wedding-studio`, with login at `/wedding-studio/login`. The old `/admin` UI routes return 404 without advertising the new location. Existing `/api/admin/*` endpoints remain protected by the same server-side session and same-origin checks. The Studio layout adds `noindex, nofollow`, and all dashboard pages sit under an authenticated route-group layout. Login, logout and internal navigation use the new paths. Production session cookies retain NextAuth's HttpOnly, Secure and SameSite=Lax defaults. No existing distributed login rate limiter is configured; this update does not substitute a process-local counter for one.

The venue is **CALI @ Ascott Raffles Place**, **2 Finlayson Green, Level 2, Singapore 049247**, with **Raffles Place MRT Exit I** shown as additional directions. Stored coordinates are **1.2822, 103.8513**. Maps use standard HTTPS anchors, coordinates first, then address, then venue name. Copy Address and the in-app-browser hint remain available. Calendar location and details use the updated venue.

Run `npm run content:update` from the project directory with the intended database configured privately in `.env.local` or the process environment. This explicit command backs up existing settings and media privately under `.local/wedding-content-backups`, updates only the five venue fields, adds One–Five with orders 0–4, and moves existing gallery records after them without deleting any. Hero, groom, bride, music, guest, RSVP, content and theme records are preserved. Repeating the command with all five gallery IDs present preserves subsequent Earlier/Later ordering. It does not run automatically during installation, build, requests or deployment.

The command checks that all five optimized gallery files below exist before it changes the database. Uploaded originals remain local; commit the optimized public WebP files. The source update changes the content cache key so the new deployment fetches the updated database content immediately.

The floral paper artwork remains the original `/images/current/floral-paper.webp`. Corner opacity is raised to 0.75, with responsive sizes from 144px on phones to 336px on larger screens. Existing ivory texture, masks, content layering, reduced-motion cover fix, persistent first-click audio and favicon are retained.

Before manually pushing, run `npx prisma validate`, `npx prisma generate`, `npm run lint`, `npm run build`, `node --import tsx --test tests/*.test.ts`, and `node --experimental-vm-modules --test load-tests/safety.test.mjs`. Verify the new login, authenticated pages, old-route 404s, Maps, gallery ordering and all requested viewport widths. A successful local build is not a deployment or a live Blob upload test; the existing server-only Blob token is still required for cloud uploads.

## Final gallery sources and order

| Order | Original source in project root | Optimized public asset | sortOrder |
| --- | --- | --- | --- |
| One | `one.jpeg` | `public/images/gallery/one.webp` | 0 |
| Two | `two.jpeg` | `public/images/gallery/two.webp` | 1 |
| Three | `three.jpeg` | `public/images/gallery/three.webp` | 2 |
| Four | `Four.jpeg` | `public/images/gallery/four.webp` | 3 |
| Five | `Five.jpeg` | `public/images/gallery/five.webp` | 4 |

All five renamed sources are included, even when a photo is also used as a hero. The existing desktop hero file and the HERO, GROOM, BRIDE and MUSIC database records are unchanged. Gallery thumbnails retain responsive next/image sizes, lazy loading and object-cover cropping; the lightbox uses object-contain to show the full image without stretching. The original JPEGs are preserved locally. Only the optimized WebP assets need to be included in the source push.

## Completed validation

The explicit content-update command was applied to the configured Prisma Postgres database after a private settings/media backup. It added five gallery records at the front and preserved all original media IDs, URLs and captions. Existing gallery records remain after them. Hash checks confirmed guests, RSVPs, invitation content, themes, colors, section settings, portrait/music records, the desktop hero file and wedding setting values are unchanged.

- `npx prisma validate`: passed.
- Prisma generation through the production build: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `node --import tsx --test tests/*.test.ts`: 38 passed, 0 failed.
- `node --experimental-vm-modules --test load-tests/safety.test.mjs`: 11 passed, 0 failed.
- Total automated tests: **49 passed, 0 failed**.
- Production-build browser verification: One–Five appear first in both public gallery data and the authenticated Media Library; all five images decode successfully; Earlier/Later changes and restores the intended order; the lightbox works.
- All requested widths passed: 320, 360, 375, 390, 430, 768, 820, 1024, 1280, 1440 and 1920px. No horizontal overflow, duplicate audio instances, visible invitation music controls, browser hydration errors, React errors or image errors were observed.
- Background playback starts from Open Invitation and remains active during gallery scrolling and interaction.
- Previous route, venue, floral, cookie and Maps checks remain recorded in `.local/venue-studio-update`. The production session checks use the existing NextAuth encoder for a local integration-test session; live Vercel credentials were not changed or tested. Real credential login/logout were separately checked in development.

**Ready for a manual source push.** The missing-gallery-asset blocker is resolved. Include all five new public gallery assets and the moved Wedding Studio route files. Nothing was pushed or deployed automatically; Vercel will serve the new bundled image paths after the updated source is deployed.

## Exact changed files

- `PRODUCTION_CHECKLIST.md` — updated
- `PRODUCTION_UPDATE.md` — added
- `README.md` — updated
- `VERCEL_DEPLOYMENT.md` — updated
- `app/admin/content/page.tsx` — removed; moved to Wedding Studio
- `app/admin/design/page.tsx` — removed; moved to Wedding Studio
- `app/admin/error.tsx` — removed; moved to Wedding Studio
- `app/admin/event/page.tsx` — removed; moved to Wedding Studio
- `app/admin/guests/page.tsx` — removed; moved to Wedding Studio
- `app/admin/layout.tsx` — removed; moved to Wedding Studio
- `app/admin/login/page.tsx` — removed; moved to Wedding Studio
- `app/admin/media/page.tsx` — removed; moved to Wedding Studio
- `app/admin/page.tsx` — removed; moved to Wedding Studio
- `app/admin/preview/page.tsx` — removed; moved to Wedding Studio
- `app/admin/rsvp/page.tsx` — removed; moved to Wedding Studio
- `app/admin/settings/page.tsx` — removed; moved to Wedding Studio
- `app/globals.css` — updated
- `app/wedding-studio/(protected)/content/page.tsx` — added
- `app/wedding-studio/(protected)/design/page.tsx` — added
- `app/wedding-studio/(protected)/event/page.tsx` — added
- `app/wedding-studio/(protected)/guests/page.tsx` — added
- `app/wedding-studio/(protected)/layout.tsx` — added
- `app/wedding-studio/(protected)/media/page.tsx` — added
- `app/wedding-studio/(protected)/page.tsx` — added
- `app/wedding-studio/(protected)/preview/page.tsx` — added
- `app/wedding-studio/(protected)/rsvp/page.tsx` — added
- `app/wedding-studio/(protected)/settings/page.tsx` — added
- `app/wedding-studio/error.tsx` — added
- `app/wedding-studio/layout.tsx` — added
- `app/wedding-studio/login/page.tsx` — added
- `components/admin/AdminSidebar.tsx` — updated
- `components/invitation/BotanicalCorners.tsx` — updated
- `components/invitation/Gallery.tsx` — updated
- `components/invitation/VenueActions.tsx` — updated
- `components/invitation/VenueSection.tsx` — updated
- `config/wedding-media.ts` — updated
- `config/wedding.config.ts` — updated
- `lib/admin-routes.ts` — added
- `lib/auth.ts` — updated
- `lib/calendar.ts` — updated
- `lib/invitation.ts` — updated
- `lib/revalidate.ts` — updated
- `lib/venue-links.ts` — updated
- `lib/wedding-content-update.ts` — added
- `load-tests/rsvp.js` — updated
- `load-tests/safety.test.mjs` — updated
- `package.json` — updated
- `prisma/seed.ts` — updated
- `public/images/gallery/five.webp` — added
- `public/images/gallery/four.webp` — added
- `public/images/gallery/one.webp` — added
- `public/images/gallery/three.webp` — added
- `public/images/gallery/two.webp` — added
- `scripts/update-wedding-content.ts` — added
- `tests/admin-routes.test.ts` — added
- `tests/media-upload.test.ts` — updated
- `tests/venue-links.test.ts` — updated
- `tests/wedding-calendar.test.ts` — updated
- `tests/wedding-content-update.test.ts` — added
- `tests/wedding-media.test.ts` — updated
