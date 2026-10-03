# Final Vercel deployment guide

The current project uses Next.js, Prisma 7.10.0, Prisma Postgres and Vercel Blob. Deploy the existing repository; the wedding design and schema are preserved. No deployment or GitHub push has been performed automatically.

## Environment variables

Set these in Vercel Production before the final production deployment. Add separate resources and URLs for Preview if enabling preview deployments. Do not expose credentials with NEXT_PUBLIC_ prefixes.

| Variable | Production value to enter privately |
| --- | --- |
| DATABASE_URL | Existing Prisma Postgres pooled TCP connection with SSL |
| DIRECT_URL | Matching direct TCP connection with SSL, used by Prisma CLI/migrations |
| AUTH_SECRET | Use the newly rotated secret from your ignored local environment file, or generate another unique secret privately with `openssl rand -base64 48` |
| NEXT_PUBLIC_SITE_URL | Your full production HTTPS origin, without a trailing slash |
| NEXTAUTH_URL | Exactly the same HTTPS origin; NextAuth v4 uses it for canonical authentication URLs |
| ADMIN_EMAIL | Your chosen admin login email |
| ADMIN_PASSWORD | Unique password of at least 12 characters; replace the old default |
| BLOB_READ_WRITE_TOKEN | Read/write token for the public Vercel Blob store connected to this project |

Use your intended custom domain for both URL variables, or the stable production Vercel hostname displayed for your project. No database URL or secret values are included in this guide.

`NEXT_PUBLIC_SITE_URL` drives generated invitation links, CSV exports, metadata and admin previews. Vercel production refuses a missing, local or non-HTTPS configured site URL. API requests and admin navigation use same-origin relative routes. Google Maps/Calendar URLs remain their respective external service URLs.

## Exact GitHub push commands

Run these yourself after reviewing the source changes. The existing origin is `https://github.com/hanmyintmyat/Wedding_Project.git`, and the branch is `main`.

```bash
cd /home/han/Desktop/Wedding
git status --short
git add -A
git diff --cached --check
git diff --cached --stat
git ls-files '.env*'
git commit -m "Prepare wedding invitation for Vercel production"
git push origin main
```

The environment-file check should list only `.env.example`, which contains blank placeholders. If any other environment file appears, remove it from the index before committing. Review the staged summary, including the existing changes from earlier preparation. Do not force push. No source push is performed by npm scripts.

## Vercel import and deployment

1. Push the reviewed source with the commands above. Keep `package-lock.json`, `prisma.config.ts`, schema, migration SQL and all source files. Generated Prisma files, `.next`, node_modules, `.local` and private environment files are ignored.
2. Open Vercel → Add New → Project. Connect the GitHub account and import **hanmyintmyat/Wedding_Project**. Use the **main** production branch.
3. Select framework **Next.js**, root directory the repository root (`./`), install command **npm ci**, build command **npm run build**, and output directory **Next.js default**. Use **Node.js 22.x**, pinned by package.json. Keep development dependencies enabled during installation so Prisma generation, TypeScript and build tooling are available. Do not set a custom start server or use static export.
4. Add the eight variables above. If Blob is not ready yet, configure the seven other variables for an initial deployment, then complete step 5 and redeploy before testing uploads or launching to guests. The build does not require a Blob token; uploads do.
5. Create a **public** Vercel Blob store in the same Vercel team. Connect it to this project for Production; verify that BLOB_READ_WRITE_TOKEN is present in the project's Production environment. If using an existing store, connect that store and use its token. Redeploy whenever environment variables are added or changed.
6. From a trusted terminal with the production variables privately configured (the CLI loads `.env.local`, then `.env`), run the commands below. The verified cloud database already contains both migrations and imported wedding data; `migrate deploy` should have nothing pending. Seed can create your own admin account and safely preserve saved content and RSVP responses. Initial media migration reads bundled source photos once and stores Blob URLs in the cloud database.

   ```bash
   npm ci
   npm run check:production
   npx prisma validate
   npx prisma generate
   npx prisma migrate deploy
   npx prisma db seed
   npm run media:cloud
   npm run lint
   npm run build
   ```

   Use Node.js 22 locally for this release verification. Fix any failed configuration check before launching. Never reset the database or run migrate dev against production. Build/install do not apply migrations automatically.
7. Click **Deploy** when the configuration is ready, or **Redeploy** if completing Blob configuration after an initial import. Wait for Ready and inspect the build logs. Run the post-deployment tests below on the production hostname. After the repository is connected, subsequent pushes to main normally trigger production deployments through Vercel's Git integration.
8. Open Project → Settings → Domains → Add Domain. Enter the custom domain and configure the registrar DNS records exactly as Vercel displays them. Wait for domain verification and HTTPS. Set NEXT_PUBLIC_SITE_URL and NEXTAUTH_URL to this domain if they were initially set to the Vercel hostname, then redeploy and repeat tests on the custom domain.
9. Leave the laptop off and verify the public page, RSVP and admin from another device. Normal CMS changes use `/admin` and do not need Git pushes or deployments.

## Exact post-deployment test URLs

Replace `YOURDOMAIN.com` with the verified custom domain or stable production `.vercel.app` hostname.

| URL | Expected test |
| --- | --- |
| https://YOURDOMAIN.com/ | Invitation loads with existing design/photos |
| https://YOURDOMAIN.com/invite?to=Phyo%20Thandar%20Aung | Personalized greeting; Open Invitation; music; mobile rendering; Accepted count 1/message Congratulations; then Declined update |
| https://YOURDOMAIN.com/api/health | HTTP 200 and `{"app":"ok","database":"ok"}` |
| https://YOURDOMAIN.com/admin | Logged out: redirect to login; logged in: cloud dashboard stats |
| https://YOURDOMAIN.com/admin/login | Strong configured credentials work; secure session cookies |
| https://YOURDOMAIN.com/admin/guests | Guest list, generated custom-domain invitation links and CSV links |
| https://YOURDOMAIN.com/admin/rsvp | Same guest's single response appears and persists after refresh |
| https://YOURDOMAIN.com/admin/media | Upload, preview, replace, delete, gallery reorder; URLs point to Blob |
| https://YOURDOMAIN.com/admin/content | Saved content appears after public refresh |
| https://YOURDOMAIN.com/admin/event | Saved event/venue updates Maps and Calendar links |
| https://YOURDOMAIN.com/api/admin/guests | Incognito/logged out: HTTP 401; no guest data |
| https://YOURDOMAIN.com/api/admin/rsvp | Incognito/logged out: HTTP 401; no RSVP data |

`/api/rsvp` is a POST endpoint: test through the public RSVP form rather than opening it as a browser page. Confirm repeat submission updates the same RSVP. Change dress-code colors in `/admin/design` and verify the public invitation after refresh. Test `/admin/settings` section visibility. Confirm the site has no development indicator.

Admin page queries and browser create/update/delete API actions check server-side ADMIN authorization. Upload-token generation also checks the session and request origin. Blob completion callbacks carry SDK-verified signatures and an authorized database upload intent rather than a browser session.

## Verification and remaining configuration

See PRODUCTION_VALIDATION.md for live Prisma Postgres, seed and RSVP results from preparation. The deployment audit confirmed no private environment files in the current Git index or reachable Git history. Only the blank .env.example is tracked. A historical commit contained the former development Auth secret, which was also still configured locally. The active local Auth secret was rotated privately; use this new secret (or another freshly generated one) in Vercel. The old value remains inactive in Git history. No current database/Auth/Blob secret values are present in tracked working files.

The local development configuration still needs a strong admin password, Blob token and production HTTPS site/auth URLs before `npm run check:production` can pass. Blob upload code is ready, but real production uploads must be tested with a connected store. No custom domain has been claimed or connected by the agent.

References: [Vercel Git import](https://vercel.com/docs/git), [Node.js version selection](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [environment variables](https://vercel.com/docs/environment-variables), [Vercel Blob](https://vercel.com/docs/vercel-blob), [NextAuth options](https://next-auth.js.org/configuration/options).
