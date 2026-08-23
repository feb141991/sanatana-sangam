import type { Metadata } from "next";
import Link from "next/link";
import { VRAT_DATABASE } from "@/lib/vrat-data";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Vrat & Fasting Guide: Meaning, Fasting Rules & Mantras | Shoonaya",
  description: "Explore sacred dharmic fasting days, vrat rules, auspicious parana timings, significance, and mantras across Hindu traditions.",
  openGraph: {
    title: "Vrat & Fasting Guide | Shoonaya",
    description: "Explore sacred dharmic fasting days, vrat rules, and mantras.",
    url: "https://www.shoonaya.com/vrat",
    type: "website",
  },
  alternates: {
    canonical: "https://www.shoonaya.com/vrat",
  },
};

export default function VratIndexPage() {
  const vrats = Object.values(VRAT_DATABASE);

  return (
    <div className="min-h-screen bg-[#0d0905] text-[#f7f2ea] px-4 py-8 max-w-4xl mx-auto">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://www.shoonaya.com" },
          { name: "Vrat & Fasting", url: "https://www.shoonaya.com/vrat" },
        ]}
      />

      <header className="mb-8 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#c5a059]">
          Vrat & Sacred Fasting
        </h1>
        <p className="text-sm text-[#f7f2ea]/70 mt-2">
          Authentic guidance on dharmic observances, fasting rules, spiritual significance, and mantras.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {vrats.map((vrat) => (
          <Link
            key={vrat.id}
            href={`/vrat/${vrat.id}`}
            className="group block p-5 rounded-2xl bg-[#1c140d]/80 border border-[#c5a059]/20 hover:border-[#c5a059]/50 transition duration-200 shadow-sm"
          >
            <div className="flex items-start gap-3.5">
              <span className="text-3xl sm:text-4xl">{vrat.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base sm:text-lg font-serif font-semibold text-[#f7f2ea] group-hover:text-[#c5a059] transition">
                    {vrat.name}
                  </h2>
                  {vrat.nameLocal && (
                    <span className="text-xs text-[#c5a059]/80 font-serif">
                      {vrat.nameLocal}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#f7f2ea]/60 mt-1 line-clamp-2">
                  {vrat.tagline}
                </p>
                {vrat.fastingType && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase bg-[#c5a059]/15 text-[#c5a059]">
                      {vrat.fastingType}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
