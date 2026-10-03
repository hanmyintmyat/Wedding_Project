# Wedding Invitation Website

A production-ready, mobile-first wedding invitation website for **Myo Thwin Kyaw & Khaing Su Wai** with a secure admin CMS, RSVP storage, media management, Prisma/PostgreSQL persistence, and production-compatible Vercel Blob uploads.

## Stack

- Next.js 16 App Router, TypeScript, Tailwind CSS 4
- Framer Motion, Lucide React
- Prisma ORM 7 with PostgreSQL
- NextAuth credentials authentication
- Zod + React Hook Form
- Vercel Blob media uploads

## Local Setup

```bash
npm install
cp .env.example .env
```

Fill `.env`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
NEXTAUTH_SECRET="generate-a-long-random-secret"
AUTH_SECRET="same-or-another-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
AUTH_URL="http://localhost:3000"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="ChangeMe123!"
BLOB_READ_WRITE_TOKEN="vercel-blob-token"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

## Database

Use Neon or Supabase PostgreSQL. After `DATABASE_URL` is set:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

For production deployments:

```bash
npm run prisma:deploy
npm run prisma:seed
```

## Development

```bash
npm run dev
```

Open:

- Public invitation: `http://localhost:3000/invite?to=Phyo%20Thandar%20Aung`
- Admin dashboard: `http://localhost:3000/admin`

## Verification

```bash
npm run lint
npm run build
```

## Admin CMS

The admin dashboard requires login with `ADMIN_EMAIL` and `ADMIN_PASSWORD` or the seeded admin user.

Admin can manage:

- Guests and personalized invitation links
- RSVP responses and CSV exports
- Wedding date, time, venue, maps URL, coordinates, and music settings
- Invitation copy, Myanmar text, section headings, couple info
- Hero, bride, groom, gallery, and music media
- Dress-code color swatches
- Theme presets and section visibility/order
- Desktop and mobile preview

## Guest Links

Use either format:

```text
/?to=Phyo%20Thandar%20Aung
/invite?to=Phyo%20Thandar%20Aung
```

If no guest name is provided, the invitation uses `Dear Beloved Guest`.

## Media Storage

Default seed images are copied into `public/images` for initial display, including `MainPhoto.jpeg`.

Production uploads use Vercel Blob through `BLOB_READ_WRITE_TOKEN`. Uploads are not stored only in the local `public` folder.

The default music URL is `/music/wildest-dreams.mp3`. Add the licensed audio file there for local defaults or upload/replace music from Admin > Media in production.

## Deployment To Vercel

1. Create a Vercel project.
2. Add the environment variables from `.env.example`.
3. Create a Neon or Supabase PostgreSQL database and set `DATABASE_URL`.
4. Create a Vercel Blob store and set `BLOB_READ_WRITE_TOKEN`.
5. Run `npm run prisma:deploy` against production.
6. Run `npm run prisma:seed` once for initial content and dummy guests.
7. Deploy with Vercel.

## Updating Content

- Change wedding details: Admin > Event
- Change invitation text and Myanmar copy: Admin > Content
- Add guests and copy links: Admin > Guests
- Manage RSVP responses: Admin > RSVP
- Change photos/music: Admin > Media
- Change dress-code colors: Admin > Design
- Enable, disable, or reorder sections: Admin > Settings
