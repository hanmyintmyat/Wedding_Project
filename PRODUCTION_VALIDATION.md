# Prisma Postgres production verification

Verified against the configured cloud database. The original wedding design, admin layout, photos, music, text and Prisma models were preserved. Nothing was pushed or deployed to Vercel.

## Database configuration

- Prisma CLI, generated client and `@prisma/adapter-pg`: **7.10.0**.
- Runtime uses the pooled `DATABASE_URL` through the shared lazy `PrismaPg` singleton (`pg` driver, max 3 connections, 10-second connection timeout, 20-second idle timeout).
- Prisma CLI, migrations, seed and transfer scripts use `DIRECT_URL`. Neither connection falls back to a local database.
- Pure configuration validation requires Prisma Postgres TCP endpoints and SSL, and rejects local URLs. All credentials remain in ignored environment files.
- `prisma-client` outputs to `generated/prisma`; generated code is ignored and regenerated on install/build. Existing models and both committed migrations are intact.

## Passed checks

- `npm install`, `npx prisma -v`, `npx prisma validate`, `npx prisma generate`, `npm run lint`, `npm run build`.
- Pooled and direct PostgreSQL connections: `SELECT 1` succeeded.
- `/api/health`: HTTP 200, `{ "app": "ok", "database": "ok" }`.
- `npx prisma migrate deploy`: both existing migrations applied to the empty cloud database. A repeat run confirmed no pending migrations. No reset, destructive push or `migrate dev` was used.
- Imported the existing private wedding-data backup before seed. All settings, content, colors, photos/music URLs, sections, theme, guests and RSVP records matched the source backup.
- `npx prisma db seed` ran twice using temporary verification admin credentials. All ten named dummy guests exist. Two seed runs preserved all imported wedding content, guests and responses exactly.
- Personalized Phyo Thandar Aung invitation rendered; Open Invitation and music worked in the production build.
- Browser submitted Accepted, count 1, message Congratulations. An independent direct Prisma query confirmed the saved cloud response. Three concurrent repeat submissions all succeeded with one guest RSVP record.
- Browser submitted Declined. The existing response updated to Declined with guest count 0 and the same message; a direct cloud query confirmed one RSVP record.
- Production admin login tested using the temporary seeded database account, distinct from the configured environment admin. This exercises cloud user lookup and password verification.
- All six dashboard values matched authenticated cloud API results before and after refresh. The response appeared in `/admin/rsvp` and persisted after refresh.
- Final test data: Phyo Thandar Aung remains **Declined**, count **0**, message **Congratulations**, as requested by the final decline test.
- Final dashboard: Total Guests 11; Invited 11; Accepted 4; Pending 3; Declined 4; Total RSVP Guests 8. These include the existing guest and responses from the original backup.
- Simulated missing database configuration: health HTTP 503 with safe status; RSVP HTTP 503 with the exact friendly retry message; public invitation rendered fallback content. No raw database details were returned to guests.
- Unauthenticated admin API HTTP 401; invalid RSVP HTTP 400; no browser framework error overlay.
- Temporary verification database user and credential file removed; test browsers and production test servers stopped.
- `git diff --check` passed. Environment files, generated client, node_modules and .next are not tracked.
- `npm audit --omit=dev`: zero production dependency advisories. Five development-only ESLint dependency advisories remain upstream; forcing the suggested major dependency changes would conflict with the installed Next.js setup.

## Remaining production configuration

`npm run check:production` deliberately still fails against the local development configuration: the default admin password must be replaced, Blob credentials are absent, and local site/auth URLs must be replaced by the production HTTPS domain in Vercel.

Set all eight documented Vercel variables: DATABASE_URL, DIRECT_URL, AUTH_SECRET, NEXT_PUBLIC_SITE_URL, NEXTAUTH_URL, ADMIN_EMAIL, ADMIN_PASSWORD, BLOB_READ_WRITE_TOKEN. Use the verified Prisma Postgres pooled/direct pair privately. Choose your own strong admin password; temporary test credentials were removed and are not your login credentials. Rerun seed with your chosen credentials to create your own database admin account, preserving existing data.

Connect a public Blob store, migrate initial media with `npm run media:cloud`, and test real upload/replace/delete flows. Import the reviewed repository into Vercel, deploy only after configuration checks pass, connect the custom domain, verify HTTPS, and repeat RSVP/admin/media tests on the actual domain. Laptop-off production operation cannot be verified until the cloud frontend is deployed.

## Final deployment audit

- `npm run lint` and `npm run build` passed on **Node.js 22.23.3**; package.json and lockfile pin the Vercel Node.js major to `22.x`.
- Invitation generation, CSV exports, metadata and admin previews use NEXT_PUBLIC_SITE_URL. A missing/local/non-HTTPS production site URL is rejected. Google service URLs and same-origin internal API/navigation routes are preserved.
- Installed NextAuth v4 code confirms NEXTAUTH_URL is the canonical auth origin and takes precedence over forwarded-host detection.
- Production-server smoke checks passed: invitation renders; cloud health is HTTP 200; unauthenticated admin read/export/create/upload-token APIs return HTTP 401; /admin shows the login page. Blob completion callbacks are SDK signature-verified; ordinary browser admin actions check ADMIN sessions.
- No private environment files are tracked or appear in reachable history. A historical development Auth secret was found and the active local secret was rotated privately. Use the new secret in Vercel. No currently configured database/Auth/Blob secret values are present in tracked working files or reachable history.
- Wedding design files and Prisma schema hashes remain unchanged during this final audit. Preview URL changes preserve all styling.
- VERCEL_DEPLOYMENT.md contains exact environment variable names, GitHub push commands, Vercel import settings and post-deployment test URLs. No GitHub push, Vercel deployment or domain change was performed.
