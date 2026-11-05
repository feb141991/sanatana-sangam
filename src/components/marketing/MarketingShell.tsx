"use client";

import { useEffect, type ReactNode } from "react";

import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { NotchNavbar } from "@/components/ui/notch-navbar";
import { marketingNavItems } from "@/config/marketing";

export function MarketingShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.colorScheme = "light";
    if (document.body) {
      document.body.style.background = "#FAF6EF";
    }
  }, []);

  return (
    <div
      className="marketing-site min-h-dvh bg-[#FAF6EF] text-[#3E2A1F]"
      data-theme="light"
      data-marketing-shell="true"
      style={{
        backgroundColor: "#FAF6EF",
        color: "var(--text-cream, #3E2A1F)",
      }}
    >
      <NotchNavbar
        items={marketingNavItems}
        cta={{ href: "/early-access", label: "Request Early Access" }}
      />
      {children}
      <MarketingFooter />
    </div>
  );
}
