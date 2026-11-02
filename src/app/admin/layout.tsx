import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Shoonaya Admin Console",
  robots: { index: false, follow: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-portal min-h-screen" data-admin-portal="true" data-theme="light">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
