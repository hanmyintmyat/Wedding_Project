import InvitationExperience from "@/components/invitation/InvitationExperience";
import { getWeddingData } from "@/lib/invitation";

type Props = {
  searchParams: Promise<{ to?: string }>;
};

export default async function InvitePage({ searchParams }: Props) {
  const { to } = await searchParams;
  const data = await getWeddingData();
  return <InvitationExperience data={data} guestName={to ? decodeURIComponent(to) : "Beloved Guest"} />;
}
