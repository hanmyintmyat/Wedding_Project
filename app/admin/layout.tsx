import { getAdminSession } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) return <>{children}</>;

  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,#fffaf2,#f7efe3)] text-ink lg:flex">
      <AdminSidebar />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
