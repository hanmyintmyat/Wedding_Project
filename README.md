# Wedding invitation — production deployment

The existing invitation for Myo Thwin Kyaw & Khaing Su Wai is preserved: photographs, personalized greetings, Myanmar and English text, RSVP, music, calendar, venue, dress code, and admin CMS. Production runs on **Vercel + Prisma Postgres + a public Vercel Blob store**. GitHub holds source code. No VPS, Docker, laptop, or local database is required after deployment.

For final GitHub push commands, exact Vercel settings and post-deployment test URLs, follow [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md). Nothing is deployed automatically.

## Runtime architecture

Guest browser → custom HTTPS domain → Vercel Next.js pages/API/admin → Prisma → pooled Prisma Postgres.
Admin media upload → authenticated Vercel token endpoint → browser directly uploads to Blob → verified Blob callback / authenticated finalization → URL saved in Prisma Postgres.

Public shared wedding content uses Next.js Data Cache, revalidated every five minutes and expired immediately after admin edits. Admin reads and RSVP writes use the database directly. Failed cache refreshes throw, retaining previous good cache entries; a cold cache falls back to the bundled invitation content. Guest personalization is separate from the shared cache. Cache retention is best effort, not a substitute for database availability. All normal changes appear after refreshing the public page, without rebuilding or redeploying.

## Environment variables

Copy `.env.example` only when configuring development. Never commit real `.env*` files. Configure production values in **Vercel → Project → Settings → Environment Variables → Production**. Use a separate Prisma Postgres database and Blob store for Preview; do not point preview/test deployments at your live RSVP database.

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Prisma Postgres pooled TCP URL with SSL (`sslmode=require` or `verify-full`) |
| `DIRECT_URL` | Prisma Postgres direct TCP URL, with SSL, for migrations/seed |
| `AUTH_SECRET` | Random secret of at least 32 characters; `openssl rand -base64 48` |
| `NEXTAUTH_URL` | Full public HTTPS domain, e.g. `https://myoandkhaing.com` |
| `NEXT_PUBLIC_SITE_URL` | Same HTTPS domain; used in invitation links, CSV exports, and metadata |
| `BLOB_READ_WRITE_TOKEN` | Token from the **public** Blob store connected to the project |
| `ADMIN_EMAIL` | Your admin login email |
| `ADMIN_PASSWORD` | Unique password, at least 12 characters; no default credentials |

The project currently uses NextAuth v4, so `NEXTAUTH_URL` is required. `AUTH_SECRET` is passed explicitly to NextAuth. Legacy `NEXTAUTH_SECRET` is accepted, but is unnecessary when `AUTH_SECRET` is supplied. Production uses secure cookies; HTTPS is required. Do not expose these secrets as `NEXT_PUBLIC_*` variables.

In the Prisma Console, select your existing database and open **Connect to your database**. Copy its **pooled TCP** connection into `DATABASE_URL` and its **direct TCP** connection into `DIRECT_URL` privately. They must refer to the same database and role. Do not use an Accelerate `prisma://` URL with the PostgreSQL adapter.

Prisma **7.10.0** stores the CLI connection in `prisma.config.ts` as `env("DIRECT_URL")`; there is no runtime-URL fallback. The `prisma-client` generator writes TypeScript into `generated/prisma`, regenerated on install/build and ignored by Git. Every application query uses the shared lazy singleton with `PrismaPg` from `@prisma/adapter-pg@7.10.0` and the `pg` driver. Its installed constructor accepts a `pg.PoolConfig`. Runtime uses **only the pooled `DATABASE_URL`**, with at most three connections per warm instance, a 10-second connection timeout, and idle connections released after 20 seconds. Seed, migrations and Studio use **the direct `DIRECT_URL`**. Both require SSL. No local database dependency remains.

For development, configure these same cloud URLs privately in `.env.local`. Restart Next.js after changing credentials. CLI commands explicitly load `.env.local`, then `.env`, while configured process variables take precedence. Database CLI commands reject local, pooled or non-SSL `DIRECT_URL` values before connecting; generation and validation do not contact the database. Run `npx prisma studio` to manage the configured direct Prisma Postgres database.

## Exact deployment steps

1. Review the source diff. Run `git status` and confirm `.env*` secrets (except `.env.example`), `.local`, `.next`, and `node_modules` are ignored. Push the reviewed source and `prisma/migrations` to the existing GitHub repository.
2. Import that repository into Vercel. Select the **Next.js** framework preset and the repository root. Use Node.js 22. Use `npm ci` to install and `npm run build` to build; no custom server/start command is needed on Vercel.
3. Use the existing **Prisma Postgres** database. In Prisma Console → Database → Connect, copy its pooled TCP URL and direct TCP URL. For this small invitation, one production database is sufficient.
4. Add the pooled URL as `DATABASE_URL` in Vercel Production.
5. Add the direct URL as `DIRECT_URL`.
6. Generate and add `AUTH_SECRET`.
7. Add `NEXT_PUBLIC_SITE_URL` and `NEXTAUTH_URL`, initially your intended domain or the stable Vercel production URL. Add your `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
8. Create a **public Vercel Blob** store under Vercel Storage and connect it to this project/environment.
9. Verify `BLOB_READ_WRITE_TOKEN` is injected into the Production environment. Keep Preview storage separate.
10. Before launching, run migrations once from a trusted terminal with the **Prisma Postgres** environment loaded:

    ```bash
    npm install
    npx prisma generate
    npm run check:production
    npx prisma migrate deploy
    ```

    `prisma migrate deploy` applies committed SQL; it does not reset the database. Never run `migrate dev` against production. Migration commands are not part of request handlers or automatic build steps.

11. Preserve your existing data before seeding. See **Moving existing data** below. Then run `npx prisma db seed` to fill initial defaults and the ten named dummy guests. The seed uses upserts with empty updates and does not overwrite saved content, photos, or RSVP responses. Remove dummy guests through Admin if they are not actual invitees. Seed requires a unique admin password of at least 12 characters. The temporary verification admin account has been removed; seed with your own configured credentials to create your database admin account.
12. Move initial media into Blob with `npm run media:cloud`, then run `npm run lint` and `npm run build`. Deploy through Vercel only after these checks pass. The script uploads the existing photos/music and updates their database URLs; no new artwork or design is created. Bundled files in `public` also work from Vercel as a fallback, without depending on laptop files.
13. Add the custom domain in Vercel → Project → Settings → Domains. Set the DNS records **exactly as Vercel shows** at your registrar. Confirm Vercel's verification and HTTPS certificate. If the URL changed, update both site/auth URL variables and redeploy once. Domain changes require configuration deployment; ordinary CMS changes do not.
14. Test a personalized link, Open Invitation, music, accepted and declined RSVP, duplicate RSVP submission, venue links, calendar, and images on your phone. Verify responses in `/admin/rsvp`.
15. Test `/admin` login, unauthorized access, content/date/venue/color edits, photo and music uploads/replacement/deletion, gallery ordering, and a refreshed public invitation. Confirm `/api/health` returns safe statuses. Complete `PRODUCTION_CHECKLIST.md` before sharing links.

No automatic deployment or GitHub push is performed by the build scripts.

## Moving existing data without losing edits

The private `.local/wedding-data.backup.json` from the previous preparation preserves existing local data. Import that backup into Prisma Postgres; the application and transfer script now use the PostgreSQL adapter and cannot export a local PostgreSQL server. For an existing Prisma Postgres source, the optional export command is:

```bash
# With the Prisma Postgres source pooled DATABASE_URL privately loaded:
npm run data:export
```

This writes `.local/wedding-data.backup.json`, ignored by Git and readable only by your user. It contains wedding settings, content, colors, sections, media, guests and RSVPs; it does not export admin credentials. Keep a private backup until cloud verification is complete.

Next, set `DATABASE_URL` and `DIRECT_URL` to **Prisma Postgres**, run the migrations, then:

```bash
npm run data:import
npx prisma db seed
npm run media:cloud
```

Import into an empty, migrated Prisma Postgres database before seeding. Import preserves IDs and does not overwrite existing target rows. Conflicting preexisting guest IDs cause the transaction to fail instead of partially importing RSVPs. Seeding creates your admin account from the configured credentials. Do not run seed regularly after launch; use the admin CMS.

## Admin and media management

Visit `https://YOURDOMAIN.com/admin` from any browser. Manage guests, RSVP responses, event dates/times, venue/maps, names, Myanmar/English text, footer, dress code, optional colors, theme, section visibility/order, hero/bride/groom photos, gallery and music.

Photos: JPG/JPEG, PNG, WebP, AVIF. The admin browser resizes uploads to a longest edge of 2400px and encodes WebP, targeting at most 1.5 MB when practical; the validated upload ceiling is 5 MB. Camera originals up to 25 MB can be prepared in the browser. Transparent photos retain transparency. Public images use responsive `next/image`, a prioritized hero, and lazy loading below the fold.

Audio: MP3, M4A, OGG, maximum 15 MB. Audio uses `preload="none"`, and attempts playback when Open Invitation is clicked. The play/pause button remains available if the browser blocks playback. The initial invitation does not download the music track.

Upload bytes go directly to Blob, bypassing Vercel's 4.5 MB function request limit. Only authenticated admins can obtain constrained, short-lived upload tokens. Blob signed callbacks are verified by the SDK; both callback and browser finalization can save the upload idempotently. A replacement becomes visible only after database commit; old Blob files are deleted when unused. Gallery images can be reordered with Earlier/Later buttons. Cleanup failures are logged safely and do not break the replacement. Local development needs a public callback URL/tunnel only to exercise Blob callbacks; production callbacks are handled entirely by Vercel.

## Routine checks and maintenance

```bash
npx prisma generate
npm run lint
npm run build
npm run check:production
```

`check:production` validates environment shapes without printing secrets, and deliberately fails for local database URLs or missing cloud credentials. Successful generation/build does not prove a remote database or Blob token is connected; test them on the deployment.

`/api/health` returns only `app` and `database` status, with HTTP 503 on a database outage. Admin shows database connection health and whether storage is configured. Error responses do not reveal credentials, connection strings, stack traces or server paths.

For about 100 guests, 15 photos, one song, and five months, use Vercel's normal Next.js hosting, Prisma Postgres pooling, and Blob CDN. No queues, external cache service, VPS, or scheduled maintenance server are necessary. Set billing alerts in each provider and review storage/bandwidth usage after sharing invitations. Keep private Prisma Postgres backups and avoid deleting the database/store until the RSVP and photo archive is saved.

Official references: [Prisma Postgres connections](https://www.prisma.io/docs/postgres/database/connecting-to-your-database), [Blob client uploads](https://vercel.com/docs/vercel-blob/client-upload), [NextAuth configuration](https://next-auth.js.org/configuration/options), [Vercel custom domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain).
