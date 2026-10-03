import { Prisma } from '@/generated/prisma/client';
import { ZodError } from 'zod';
import { getPrismaClient } from '@/lib/db';
import { rsvpSchema } from '@/lib/validations';
import { slugifyName } from '@/lib/invitation-utils';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const data = rsvpSchema.parse(await request.json());
    const fullName = data.guestName.trim();
    const inviteSlug = slugifyName(fullName);
    const status = data.attendanceStatus;
    const guestCount = status === 'DECLINED' ? 0 : data.guestCount;
    // Retry a conflicting concurrent upsert once. Both writes commit together.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await getPrismaClient().$transaction(async tx => {
          const existing = await tx.guest.findFirst({ where: { OR: [{ inviteSlug }, { fullName: { equals: fullName, mode: 'insensitive' } }] } });
          const guest = existing
            ? await tx.guest.update({ where: { id: existing.id }, data: { status } })
            : await tx.guest.upsert({ where: { inviteSlug }, update: { status }, create: { fullName, inviteSlug, status, personalizedGreeting: `Dear Beloved ${fullName}` } });
          await tx.rSVP.upsert({
            where: { guestId: guest.id },
            update: { attendanceStatus: status, guestCount, message: data.message || null },
            create: { guestId: guest.id, attendanceStatus: status, guestCount, message: data.message || null }
          });
        });
        return Response.json({ ok: true, success: true, message: "RSVP received" });
      } catch (error) {
        if (attempt === 0 && error instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2034'].includes(error.code)) continue;
        throw error;
      }
    }
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) return Response.json({ success: false, message: 'Please check your RSVP details.' }, { status: 400 });
    console.error('[rsvp] Save unavailable', error instanceof Prisma.PrismaClientKnownRequestError ? error.code : error instanceof Error ? error.name : 'unknown');
    return Response.json({ success: false, message: "We couldn't save your RSVP right now. Please try again." }, { status: 503 });
  }
}
