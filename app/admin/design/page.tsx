import DressCodeManager from "@/components/admin/DressCodeManager";
import ThemeSettings from "@/components/admin/ThemeSettings";
import PreviewPanel from "@/components/admin/PreviewPanel";
import { getAdminSession } from "@/lib/auth";
import { getWeddingDataLive } from "@/lib/invitation";
import { themeSchema } from "@/lib/validations";
import { redirect } from "next/navigation";

export default async function DesignPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  const data = await getWeddingDataLive();
  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Design</p>
        <h1 className="mt-2 font-serif text-4xl">Theme & Dress Code</h1>
      </div>
      <ThemeSettings theme={themeSchema.parse(data.theme)} />
      <DressCodeManager initialColors={data.colors} />
      <PreviewPanel />
    </div>
  );
}
