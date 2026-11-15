Final production audit — 14 November 2026

Production: https://wedding-project-tau-sepia.vercel.app

The deployed invitation works, but invitation distribution should wait for the local fixes to be deployed, real venue details to be entered, and successful production admin login to be verified. The application has no obvious capacity bottleneck for 400 invitations and 400–500 RSVP users. No paid infrastructure was added.

This report distinguishes deployed behavior from the corrected local production build. This audit did not deploy, change the schema, or modify existing guest/RSVP records. Temporary audit records were removed. The original 10 guests and 7 RSVPs remain; before/after checksums matched during local integration testing.

1. **Public site status**

   The home page and `/invite?to=Phyo%20Thandar%20Aung` return HTTP 200 and render correctly. English and Myanmar personalization work. Open Invitation reveals the sections and starts music from the click. Pause/resume work, with exactly one audio element and no music download before opening.

   | Requested flow | Deployed evidence | Local correction / limitation |
   | --- | --- | --- |
   | Public home | Cover, names, wedding date and opening button work | No redesign |
   | Personalized invitation | Requested name appears on cover and RSVP form | Guest lookup remains dynamic |
   | Open Invitation | Cover exits; enabled sections appear | Passed |
   | Music after opening | Playback advances, volume 0.55; pause/resume work | Passed in Chromium |
   | Mobile layouts | All seven requested widths pass | See item 2 |
   | Guest personalization | English and Myanmar names render | Names identify guests; see security limitation |
   | Joyfully Accept | HTTP 200; guest/RSVP accepted; count 2 stored | Passed |
   | Regretfully Decline | HTTP 200; guest/RSVP declined; count 0 stored | Passed |
   | Refresh persistence | Database persists; deployed form resets to Accept / 1 | Fixed and browser-tested locally |
   | Duplicate prevention | Concurrent and case-varied repeats keep one RSVP | Distinct punctuation variants overwrite one another live; fixed locally |
   | Admin authentication | `/admin` redirects to login; workspace credentials rejected | Positive production login unverified; local login passed |
   | Admin totals | Positive production session unavailable | All six local cards match production database totals |
   | Guest list | Protected from unauthenticated access | Local authenticated list shows all 10 records |
   | RSVP list | Protected from unauthenticated access | Local authenticated list shows all 7 records |
   | Venue / Maps | View Location resolves; Directions uses placeholder address | Directions fixed locally; venue content needs owner input |
   | Save the Date | January 2027 calendar highlights the 10th; calendar template uses 10:00–15:00 | Calendar location remains placeholder; confirm timezone |
   | Dress colors | Six configured colors plus Avoid White render as 56 × 56 px circles | Passed |
   | Gallery | All 9 configured gallery images load; viewer, navigation and Escape work | Passed |
   | `/api/health` | HTTP 200: `{"app":"ok","database":"ok"}`; `no-store` | Passed |
   | Error handling | Invalid JSON/RSVP: sanitized 400; missing pages/files: 404 | Local database failure: sanitized 503 and retryable form error |

2. **Mobile status**

   Browser-tested cover and opened layouts at 320, 360, 375, 390, 430, 768 and 1024 px. No horizontal overflow; RSVP controls fit; Open Invitation stays inside the viewport, including 320 × 568. The sampled production session recorded zero layout shift. These were Chromium viewport tests, not physical iOS/Safari tests or a Lighthouse performance certification.

3. **Database status**

   Production connectivity and actual RSVP writes were verified. Runtime uses the pooled Prisma Postgres connection, SSL, a shared Prisma client and a three-connection pool. The existing unique RSVP guest ID prevents multiple RSVP rows for one guest. Public writes update Guest and RSVP in one transaction with conflict retry. No schema change or migration was needed.

   Current totals: 10 guests, 4 accepted, 3 pending, 3 declined, 7 RSVP records, and 9 accepted attendees. Guest/RSVP status mismatches: zero. One existing accepted RSVP exceeds the current two-person limit; two existing declines have nonzero guest counts. Those historical values were preserved. Current public writes enforce the two-person limit and normalize declined counts to zero.

4. **RSVP status**

   Local fixes restore saved attendance/count/confirmation after refresh through the existing guest lookup. They also let a guest edit a saved response and preserve an earlier wedding wish unless a new message is submitted. Wishes and contact details are not serialized into the public invitation payload. A submission from the generic home updates its name query parameter so refresh can recover the receipt.

   A reproduced production bug merged different names with the same readable slug. New guest identities now include a deterministic hash of the full name; existing guests still match by name, without changing their IDs/slugs or existing links. Admin creation uses the same identity function and rejects existing names; admin editing rejects another guest's name. Local browser tests cover punctuation collisions, repeated/case-varied writes, duplicate admin creation and duplicate renaming. Exactly identical names still cannot identify separate people in this name-based link design.

5. **Admin status**

   Deployed unauthenticated admin API reads, exports and tested mutations return 401. Cross-origin admin writes return 403. Source review confirms server-side authorization on admin handlers. The Blob upload-completion callback uses signed service verification rather than a browser session.

   Using a randomly generated temporary environment account with the local production build, login, authenticated API access, both lists and all six dashboard totals passed against the same database. No admin account was inserted into the database. This does not certify successful login on the deployed site: the workspace account was rejected there. Vercel account/deployment inspection was unavailable because the connector requires reauthentication.

6. **Performance issues found**

   Shared wedding content is already cached for 300 seconds with the `wedding-content` tag. Admin settings/media changes invalidate the tag and public paths. Guest data remains outside that cache; RSVP POST writes remain uncached. Cache invalidation was reviewed in source; a live admin-edit/revalidation cycle could not be tested without a production session.

   Sections receive shared data instead of issuing database queries. The corrected guest lookup selects only the greeting and minimal RSVP receipt, without a second guest fetch. The admin dashboard still reads all guests to calculate totals; at approximately 400 records this is small and does not justify adding infrastructure.

   Photos use `next/image`, responsive sizes and reserved image containers. Only the cover image preloads; gallery photos lazy-load. The deprecated hero `priority` prop was replaced by the current `preload` prop. Audio uses `preload="none"`, starts in the opening click handler and shares one audio instance.

   Five concurrent read-only production page requests returned HTTP 200. Sample time to headers was approximately 0.68–1.65 seconds and full HTML completion 0.68–3.32 seconds. This was a small smoke test, not a 400-concurrent-user load test.

7. **Security issues found**

   The original production dependency audit reported seven affected packages: one critical, five high and one moderate. Local updates use Next.js / eslint-config-next 16.4.6, Zod 4.6.6, undici 6.29.1, fast-uri 3.1.9 and an `@vercel/cli-config` 0.3.6 override to remove its vulnerable Zod dependency. Final `npm audit --omit=dev` reports zero vulnerabilities. These updates require deployment. Next.js's upstream advisory documents affected and patched versions: [Next.js upstream advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw). The exact installed production dependency versions could not be inspected through Vercel.

   The full audit still reports eight moderate findings in the development-only ESLint/typescript-eslint/minimatch dependency chain. A compatible `npm audit fix` did not clear them. No forced major override was applied to the lint toolchain. They are absent from the production dependency audit.

   Only the blank `.env.example` is tracked; no real environment file appeared in the inspected Git history. Production `.env` and `.env.local` requests return 404. Thirteen public JavaScript assets were scanned: no workspace credential values, `ADMIN_PASSWORD`, Blob token marker or database URL marker were found. Source review also keeps credentials/database access on the server. Production errors tested did not expose raw Prisma errors; local database failure responses were likewise sanitized.

   Residual limitation: RSVP identity is a name, not guest authentication. Someone who knows a guest's name can submit or replace that response, and the public endpoint can create unlisted guests. There is no application-level rate limiter. Strong guest authenticity would require signed/unguessable invitation identifiers and write protection; it is not supplied by a name query parameter. Do not rename a guest after sharing a name-based link without sending the updated link.

8. **Changes made**

   - Restored RSVP receipts after refresh and preserved private wishes during attendance updates.
   - Fixed punctuation collisions in RSVP/guest creation and guarded duplicate names in admin edits.
   - Selected minimal dynamic guest data instead of fetching entire guest records.
   - Corrected Directions to use the resolved map destination when coordinates are absent.
   - Updated the hero preload API and patched vulnerable dependencies/lockfile.
   - Added guest-identity regression tests and this report.

   Existing local authentication/configuration edits were preserved and their tests passed. No deployment, paid service, schema change, redesign or modification of pre-existing guest/RSVP data was performed.

9. **Readiness for 400 guests**

   There is no obvious application/database bottleneck for approximately 400 personalized links, 400–500 RSVP users, 15 optimized photos, one track and five months of ordinary use. Database volume is small, public settings are shared, and media is delivered separately from the database. Current Guest and RSVP tables together occupy roughly 144 KiB including their indexes; this is a small dataset, not a projected quota guarantee.

   The approximately 6.3 MiB track is the largest per-visitor asset: 500 complete downloads are roughly 3.1 GiB, and repeat visits increase that figure. No paid infrastructure appears necessary for the stated traffic. Actual account quotas, billing, retention and five-month service continuity were not verified because Vercel account access was unavailable. Capacity assessment is an estimate, not a 400-user stress-test result.

10. **Before sending invitation links**

    - Deploy the tested fixes and security updates, then recheck the deployed receipt/collision behavior.
    - Replace “Wedding Venue” and “Update venue address here” with the real venue name/address. These currently affect directions and calendar location.
    - Confirm event timezone: calendar links use `Asia/Yangon`, while the configured Maps share resolves to coordinates in Singapore. Confirm the date, times and RSVP deadline as well.
    - Verify successful admin login on production and confirm dashboard, guest list, RSVP list and an admin content edit/revalidation cycle there.
    - Review the three legacy RSVP counts; they were intentionally preserved.
    - Decide whether name-only RSVP identity is sufficient before distributing all links. Separate guests with exactly the same name need distinct invitation identities.

Validation: `npm run lint` and `npm run build` pass on Node 22.23.1. Authentication and guest-identity tests pass. Production Chromium checks, local production-build browser tests, error-path checks and raw HTTP authorization checks are recorded under the ignored `.local/production-audit/` directory. No credentials or browser authentication state were saved as audit artifacts.
