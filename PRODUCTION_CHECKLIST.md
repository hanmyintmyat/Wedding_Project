# Production deployment checklist

Build readiness and cloud launch are separate. Tick launch items only after testing the real cloud deployment; a local production build is not proof that Prisma Postgres, Blob, DNS, or HTTPS are configured.

- [ ] GitHub repository clean; source reviewed and pushed; no credentials/artifacts tracked
- [ ] Environment variables configured (`npm run check:production` passes)
- [x] Prisma Postgres database connected with pooled URL and SSL
- [x] Prisma migrations deployed (`npx prisma migrate deploy`)
- [x] Existing wedding content/guests/RSVP data transferred and checked
- [x] Seed successful; rerun preserves edits and responses (temporary verification account removed; seed your own admin credentials before launch)
- [ ] Initial photos and music moved to Blob (`npm run media:cloud`)
- [ ] Admin login works with secure HTTPS cookies
- [ ] Unauthorized `/admin` access redirects to login
- [ ] Unauthorized `/api/admin/*` actions return 401/403
- [ ] Main invitation works
- [ ] Personalized guest URL works
- [ ] Open Invitation works
- [ ] Music works after opening and play/pause works
- [ ] Initial page does not download the music track
- [ ] RSVP accepted works
- [ ] RSVP declined works (zero attending guests)
- [ ] Repeat/concurrent RSVP updates do not create duplicates
- [ ] Admin RSVP update works
- [ ] Venue links work
- [ ] Add to Calendar reflects saved names, time, date, venue and address
- [ ] Photos load with responsive optimized sizes
- [ ] Vercel Blob upload works (photo and audio)
- [ ] Photo replacement, deletion and preview work
- [ ] Gallery reordering works
- [ ] English/Myanmar content, venue and dress-code edits appear after public refresh
- [ ] Section visibility changes appear after public refresh
- [ ] Mobile responsive at 320, 360, 375, 390, 393, 430px
- [ ] Tablet/desktop responsive at 768, 1024, 1440px
- [x] Production build passes (`npm install`, `npx prisma generate`, `npm run lint`, `npm run build`)
- [ ] `/api/health` reports application/database status safely
- [ ] Database interruption shows cached/fallback public content and friendly RSVP/admin errors
- [ ] Custom domain connected
- [ ] HTTPS works
- [ ] Production has no development indicator, debug overlays or development components
- [ ] Website, admin, RSVP, photos and music work with the laptop turned off
