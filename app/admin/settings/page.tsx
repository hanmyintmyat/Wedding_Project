import SectionSettings from "@/components/admin/SectionSettings";
import PreviewPanel from "@/components/admin/PreviewPanel";
import { getAdminSession } from "@/lib/auth";
import { getWeddingData } from "@/lib/invitation";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  const data = await getWeddingData();
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
