import ContentEditor from "@/components/admin/ContentEditor";
import { getAdminSession } from "@/lib/auth";
import { getWeddingDataLive } from "@/lib/invitation";
import { redirect } from "next/navigation";

export default async function ContentPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  const data = await getWeddingDataLive();
  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Content</p>
        <h1 className="mt-2 font-serif text-4xl">Invitation Copy</h1>
      </div>
      <ContentEditor content={data.content} />
    </div>
  );
}
