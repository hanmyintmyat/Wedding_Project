# Final wedding design, photos, and responsive layout

Updated the existing invitation in place. The schema, migrations, guest personalization, RSVP business logic, authentication, production environment configuration, venue settings, music source, and event/calendar data are preserved.

## Design and responsive behavior

- Removed dress-code guidance text and its admin editing control. The public section contains only the heading, attire subtitle, optional-color heading, and the five circular swatches: Dusty Blue, Sage Green, Soft Yellow, Mocha, and Champagne Beige.
- Kept the existing database field for schema compatibility; the public loader clears that unused field before serialization, and fresh-install seed defaults leave it empty. No live database content was rewritten.
- Reduced the script names with bounded `clamp()` typography. A shared name component centers the ampersand on both the landing screen and thank-you section.
- Retained subtle ivory texture and botanical corners, controlled by the existing floral setting. Important text stays readable.
- Preserved the January 2027 calendar and January 10 highlight. The minimal four-unit countdown updates every second using the existing Asia/Yangon calendar timezone and configured start time.
- Reserved a bottom control dock outside the scrollable content viewport. Navigation and music cannot cover RSVP controls, text, or footer content. The music player is compact on phones/tablets and displays its title on desktop. Music still starts from Open Invitation.
- Kept full-width mobile RSVP fields/buttons with controls at least 44px high. Only presentation classes changed in the RSVP form.
- Gallery thumbnails remain lazy and responsive. The full-quality viewer uses a modal dialog with a focus trap, Escape/arrow-key controls, focus restoration, and labeled 44px buttons.
- Darkened small sage text and control backgrounds slightly for readable contrast while retaining the wedding palette.

## Current photo collection

Only prepared derivatives of the latest uploaded photographs are deployed under `public/images/current/`. Camera originals remain in the project folder and are excluded from Git; none were deleted. Prepared assets have orientation applied and metadata stripped without stretching.

| Role | Uploaded source | Prepared asset |
| --- | --- | --- |
| Desktop/tablet hero | `IMG_3633.jpeg` (8000 × 5336) | `hero-high-resolution.webp` (3840px wide) |
| Mobile hero | `MainHeroPhoto.jpeg` | `MainHeroPhoto.webp` (native portrait resolution) |
| Groom | `053362bb-9ca8-4061-8825-c42cb1a1dc00.jpeg` | `groom-portrait.webp` |
| Bride | `PersonalPotrait1.jpeg` | `PersonalPotrait1.webp` |
| Gallery 1 | `23f08fba-01d9-464c-8be8-dda6dae28279.jpeg` | matching `.webp` |
| Gallery 2 | `488050b3-0ffd-4ecf-a15b-09ef6b544622.jpeg` | matching `.webp` |
| Gallery 3 | `4fdd3c07-8230-4fc0-a145-6728f0daf6fe.jpeg` | matching `.webp` |
| Gallery 4 | `IMG_3633.jpeg` | `hero-high-resolution.webp` |
| Gallery 5 | `bc22d4db-a5e6-4ab2-8244-385fe23d1a96.jpeg` | matching `.webp` |
| Gallery 6 | `d0bffa64-ac24-45a6-af9c-52613e661d0c.jpeg` | matching `.webp` |
| Gallery 7 | `d531e78c-82c0-48b4-8958-1286ea711970.jpeg` | matching `.webp` |
| Gallery 8 | `cac0a7db-e1c4-415d-9707-3f5f668d16e4.jpeg` | matching `.webp` |
| Floral reference | `_.jpeg` | `floral-paper.webp` |

The existing database currently enables eight gallery slots. Its earlier deletion of `seed-gallery-4` is honored. The manifest also retains the new `8fc27136-fb9f-42d0-9ffe-a3b1a8feccec.webp` for the original nine-slot fallback/fresh-install collection; rendering does not recreate a deleted database record.

Photo derivatives use quality 88 without enlarging the source. Next.js delivers responsive hero variants at quality 85, thumbnails at 75, and viewer images at 90. The roughly 34 MB camera original is never served directly. Media-specific hero preloads and high fetch priority load only the appropriate mobile or desktop image. Crop-aware sizes account for the image width needed in tall tablet viewports. This uses the current Next.js image APIs instead of its deprecated priority prop. Other images do not preload.

## Legacy photo cleanup and admin compatibility

Removed 25 legacy tracked photographs from the root/public deployment assets, including the old MainPhoto hero, old portraits, and old UUID gallery set. They are archived without data loss under the ignored `.local/final-production/legacy-photos/` directory. The redundant prepared low-resolution copy of the camera composition is archived there as well.

Removed stale rendering/seed arrays and replaced them with `config/wedding-media.ts`. Existing seeded media IDs resolve to the current photos on read; IDs, ordering, deletion state, and future admin uploads remain intact. The authenticated media-list endpoint uses the same resolver. The media migration utility resolves current paths as well, so it does not depend on removed legacy files. The content cache key is versioned to prevent reuse of the previous photo payload.

No production seeding, migrations, imports, uploads, environment updates, or database writes were performed.

## Files changed

- Invitation components: cover, experience, couple names/portraits, botanical corners, intro, dress code, calendar/countdown, gallery, footer, navigation, music player, and RSVP presentation.
- `components/admin/ContentEditor.tsx`: removed the obsolete warning editor.
- `app/globals.css`: responsive typography, reserved dock/scroll area, dialog layout, focus/contrast, and paper decoration.
- `config/wedding-media.ts`, `config/wedding.config.ts`, `lib/invitation.ts`, `lib/calendar.ts`: photo selection/compatibility, cache version, countdown timestamp, and existing-schema compatibility.
- `app/api/admin/media/route.ts`: consistent current-photo URLs for existing media IDs.
- `next.config.ts`: explicit image-quality allowlist.
- `prisma/seed.ts`: current-photo/palette defaults and empty unused guidance field; not executed against production.
- `scripts/migrate-media.ts`: current-photo path compatibility; not executed against production.
- `.gitignore`: excludes uploaded root camera originals while keeping prepared public assets tracked.
- `tests/wedding-media.test.ts`, `tests/wedding-calendar.test.ts`: asset integrity, resolution/aspect ratio, identity compatibility, and calendar/timezone coverage.
- `public/images/current/`: prepared current photographs/reference; legacy photo files removed from the deployed set.
- `AGENTS.md`: retained the heading update generated by Next.js.

## Validation

Completed on Node 22.23.1 and Next.js 16.4.6:

- `npm install`.
- `npx prisma validate`; schema and migrations unchanged.
- `npx prisma generate`.
- `npm run lint` with zero warnings.
- `npm run build`.
- All 11 automated tests, media-format/size validation, and the existing sanitized database-failure browser check.
- Production-build Chromium coverage at 320, 360, 375, 390, 393, 430, 768, 820, 1024, 1280, 1366, 1440, and 1920 pixels.
- No horizontal overflow, clipped RSVP controls, navigation/music overlap, or oversized name wrapping in those checks. Both ampersands are centered. All content images decode successfully.
- Countdown ticks; January 10 is highlighted; the five requested colors render without guidance text; gallery uses new photos and a keyboard-trapped quality-90 viewer.
- Music remains paused before opening, starts after opening, and pauses/resumes correctly. Footer date remains clear of navigation.
- Real browser/API/database tests of accept/decline, refresh restoration, home-page query restoration, and private-wish preservation used only a disposable local PostgreSQL database.
- Admin login, all seven admin pages, media reads/previews/reordering, and existing synthetic-record preservation passed.
- Read-only checks against the existing configured database confirmed `/invite?to=Phyo%20Thandar%20Aung` at mobile/tablet/desktop widths and HTTP 200 health JSON with both statuses `ok`.
- Before/after read-only checksums matched for Guest, RSVP, WeddingSettings, InvitationContent, MediaAsset, User, DressCodeColor, SectionSetting, and ThemeSetting.
- Production dependency audit: zero vulnerabilities. The unchanged development ESLint dependency chain still has eight moderate npm audit findings.

Detailed browser results and screenshots are retained under ignored `.local/final-production/`. These results validate local builds; production certification still requires the intended Git commit to deploy successfully and the live checks below to pass.

## After deployment

1. Confirm Vercel Production is Ready for the intended main-branch commit and the production domain is assigned to it.
2. Check `/api/health` for HTTP 200, `Cache-Control: no-store`, and `{"app":"ok","database":"ok"}`.
3. Open `/invite?to=Phyo%20Thandar%20Aung` at phone, tablet, and desktop sizes. Verify the responsive hero, greeting, names, opening, music, calendar/countdown, dress colors, new gallery, footer, and usable venue links.
4. Inspect the browser console/network for failed assets, hydration errors, image warnings, and unexpected API failures.
5. Confirm successful production admin login and correct existing guests/RSVPs, wishes, settings, totals, and media. Confirm unauthenticated admin APIs still return 401.
6. Do not overwrite real responses for testing. Live RSVP write tests require dedicated authorized test identities; verify accept, decline/count-zero normalization, refresh persistence, and wish preservation, then remove only those test identities.
7. Review build/function logs for the deployment. Keep the release unverified until its live acceptance checks pass.
