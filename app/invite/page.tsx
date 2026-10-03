import InvitationExperience from "@/components/invitation/InvitationExperience";
import { getWeddingData, getGuestGreeting } from "@/lib/invitation";

type Props = {
  searchParams: Promise<{ to?: string }>;
};

export default async function InvitePage({ searchParams }: Props) {
  const { to } = await searchParams;
  const guestName = typeof to === "string" ? to.trim().slice(0, 120) : "Beloved Guest";
  const [data, personalizedGreeting] = await Promise.all([getWeddingData(), to ? getGuestGreeting(guestName) : Promise.resolve(null)]);
  return <InvitationExperience data={data} guestName={guestName || "Beloved Guest"} personalizedGreeting={personalizedGreeting} />;
}
