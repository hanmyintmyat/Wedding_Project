import PreviewPanel from "@/components/admin/PreviewPanel";
import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PreviewPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Preview</p>
        <h1 className="mt-2 font-serif text-4xl">Website Preview</h1>
      </div>
      <PreviewPanel />
    </div>
  );
}
