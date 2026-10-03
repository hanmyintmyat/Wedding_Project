import { RSVPStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { rsvpSchema } from "@/lib/validations";
import { slugifyName } from "@/lib/invitation-utils";

export async function POST(request: Request) {
  try {
    const data = rsvpSchema.parse(await request.json());
    const fullName = data.guestName.trim();
    const inviteSlug = slugifyName(fullName);
    const guestCount = data.attendanceStatus === "DECLINED" ? 0 : data.guestCount;

    const guest = await prisma.guest.upsert({
      where: { inviteSlug },
      update: {
        fullName,
        displayName: fullName,
        personalizedGreeting: `Dear Beloved ${fullName}`,
        status: data.attendanceStatus as RSVPStatus
      },
      create: {
        fullName,
        displayName: fullName,
        inviteSlug,
        personalizedGreeting: `Dear Beloved ${fullName}`,
        status: data.attendanceStatus as RSVPStatus
      }
    });

    const rsvp = await prisma.rSVP.upsert({
      where: { guestId: guest.id },
      update: {
        attendanceStatus: data.attendanceStatus as RSVPStatus,
        guestCount,
        message: data.message || null
      },
      create: {
        guestId: guest.id,
        attendanceStatus: data.attendanceStatus as RSVPStatus,
        guestCount,
        message: data.message || null
      }
    });

    return NextResponse.json({ ok: true, rsvp });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message || "Invalid RSVP." }, { status: 400 });
    }
    console.error("[rsvp] Unable to submit RSVP", error);
    return NextResponse.json({ message: "Unable to submit RSVP." }, { status: 500 });
  }
}
