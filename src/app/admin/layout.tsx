import type { Metadata } from "next";
import AdminNavHeader from "./AdminNavHeader";

export const metadata: Metadata = {
  title: "Shoonaya Admin",
  robots: { index: false, follow: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--divine-bg,#FAF6EF)]">
      <AdminNavHeader />
      <main>{children}</main>
    </div>
  );
}
