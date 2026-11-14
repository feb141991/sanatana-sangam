"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebarRail } from "./AdminSidebarRail";
import { AdminTopBar } from "./AdminTopBar";
import { AdminMobileDrawer } from "./AdminMobileDrawer";
import { AdminCommandPalette } from "./AdminCommandPalette";
import { resolveAdminSurface } from "@/lib/admin-surface";

interface Props {
  children: React.ReactNode;
}

export default function AdminShell({ children }: Props) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global keyboard shortcut for Command Palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close mobile drawer on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const surface = resolveAdminSurface(pathname);

  // Exclude login screen from administrative shell
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div
      className="admin-portal admin-scene admin-dark min-h-screen font-outfit flex"
      data-admin-portal="true"
      data-admin-shell="true"
      data-theme="light"
    >
      {/* 1. Persistent Desktop Left Sidebar Rail */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30">
        <AdminSidebarRail className="h-full" />
      </div>

      {/* 2. Main Content Column with Top Bar */}
      <div className="flex-1 min-w-0 lg:pl-64 flex flex-col min-h-screen">
        <AdminTopBar
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />
        {/* The overview is drawn in glass directly on the scene. Every older page is restyled dark by the
            `.admin-pages` scope (admin-pages.css); a route can be kept on the light sheet in lib/admin-surface.ts. */}
        <main className="flex-1 w-full">
          {surface === "overview" ? children : surface === "sheet" ? <div className="admin-sheet">{children}</div> : <div className="admin-pages">{children}</div>}
        </main>
      </div>

      {/* 3. Mobile Navigation Drawer */}
      <AdminMobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* 4. Global Administrative Command Palette */}
      <AdminCommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
