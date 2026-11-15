import InvitationExperience from "@/components/invitation/InvitationExperience";
import { getWeddingData, getGuestInvitation } from "@/lib/invitation";

type Props = {
  searchParams: Promise<{ to?: string }>;
};

export default async function InvitePage({ searchParams }: Props) {
  const { to } = await searchParams;
  const guestName = typeof to === "string" ? to.trim().slice(0, 120) : "Beloved Guest";
  const [data, guest] = await Promise.all([getWeddingData(), guestName && to ? getGuestInvitation(guestName) : Promise.resolve(null)]);
  return <InvitationExperience data={data} guestName={guestName || "Beloved Guest"} personalizedGreeting={guest?.personalizedGreeting} initialRSVP={guest?.rsvp} />;
}
