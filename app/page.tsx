import { getWeddingData, getGuestGreeting } from "@/lib/invitation";
import InvitationExperience from "@/components/invitation/InvitationExperience";

type Props = {
  searchParams: Promise<{ to?: string }>;
};

export default async function Home({ searchParams }: Props) {
  const { to } = await searchParams;
  const guestName = typeof to === "string" ? to.trim().slice(0, 120) : "Beloved Guest";
  const [data, personalizedGreeting] = await Promise.all([getWeddingData(), to ? getGuestGreeting(guestName) : Promise.resolve(null)]);
  return <InvitationExperience data={data} guestName={guestName || "Beloved Guest"} personalizedGreeting={personalizedGreeting} />;
}
