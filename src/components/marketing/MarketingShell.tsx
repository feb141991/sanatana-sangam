import type { ReactNode } from "react";

import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { NotchNavbar } from "@/components/ui/notch-navbar";
import { marketingNavItems } from "@/config/marketing";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="marketing-site min-h-dvh bg-[var(--surface-base)] text-[var(--text-cream)]">
      <NotchNavbar
        items={marketingNavItems}
        cta={{ href: "/beta/android", label: "Join Android Beta" }}
      />
      {children}
      <MarketingFooter />
    </div>
  );
}
