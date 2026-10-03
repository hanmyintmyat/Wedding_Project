import { getWeddingData } from "@/lib/invitation";
import InvitationExperience from "@/components/invitation/InvitationExperience";

type Props = {
  searchParams: Promise<{ to?: string }>;
};

export default async function Home({ searchParams }: Props) {
  const { to } = await searchParams;
  const data = await getWeddingData();
  return <InvitationExperience data={data} guestName={to ? decodeURIComponent(to) : "Beloved Guest"} />;
}
