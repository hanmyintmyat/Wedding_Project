import MediaManager from "@/components/admin/MediaManager";
import { getAdminSession } from "@/lib/auth";
import { getWeddingData } from "@/lib/invitation";
import { redirect } from "next/navigation";

export default async function MediaPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  const data = await getWeddingData();
  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Media</p>
        <h1 className="mt-2 font-serif text-4xl">Photos & Music</h1>
      </div>
      <MediaManager initialAssets={data.media} />
    </div>
  );
}
