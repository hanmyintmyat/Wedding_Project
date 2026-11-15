import { studioLoginPath } from "@/lib/admin-routes";
import SectionSettings from "@/components/admin/SectionSettings";
import PreviewPanel from "@/components/admin/PreviewPanel";
import { getAdminSession } from "@/lib/auth";
import { getWeddingDataLive } from "@/lib/invitation";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  if (!(await getAdminSession())) redirect(studioLoginPath);
  const data = await getWeddingDataLive();
  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Settings</p>
        <h1 className="mt-2 font-serif text-4xl">Sections & Preview</h1>
      </div>
      <SectionSettings initialSections={data.sections} />
      <PreviewPanel />
    </div>
  );
}
