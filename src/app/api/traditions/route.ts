import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  TRADITIONS,
  SAMPRADAYAS_BY_TRADITION,
  getSampradayaLabel
} from "@/lib/traditions";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();

  try {
    // 1. Try fetching live catalogue from database
    const { data: dbTraditions, error: tradError } = await supabase
      .from("traditions_catalog")
      .select("*, tradition_subcategories(*)")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (!tradError && dbTraditions && dbTraditions.length > 0) {
      const formatted = dbTraditions.map((t: any) => ({
        key: t.key,
        label_en: t.label_en,
        label_hi: t.label_hi,
        emoji: t.emoji,
        sub_label_en: t.sub_label_en,
        sub_label_hi: t.sub_label_hi,
        subcategories_label_en: t.subcategories_label_en,
        subcategories_label_hi: t.subcategories_label_hi,
        accent_color: t.accent_color,
        subcategories: (t.tradition_subcategories || [])
          .filter((s: any) => s.is_active)
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((s: any) => ({
            key: s.key,
            label_en: s.label_en,
            label_hi: s.label_hi,
            description_en: s.description_en,
            description_hi: s.description_hi,
          })),
      }));

      return NextResponse.json(
        { traditions: formatted, source: "database" },
        {
          headers: {
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        }
      );
    }
  } catch (err) {
    console.warn("[api/traditions] Falling back to static catalogue:", err);
  }

  // 2. Graceful fallback to canonical TypeScript snapshot
  const fallback = TRADITIONS.filter(t => t.value !== "other").map(t => {
    const subcats = SAMPRADAYAS_BY_TRADITION[t.value] || [];
    return {
      key: t.value,
      label_en: t.label,
      label_hi: t.label,
      emoji: t.emoji,
      sub_label_en: t.desc,
      sub_label_hi: t.desc,
      subcategories_label_en: getSampradayaLabel(t.value),
      subcategories_label_hi: getSampradayaLabel(t.value),
      accent_color:
        t.value === "hindu"
          ? "#FF6B35"
          : t.value === "jain"
          ? "#2D9E4A"
          : t.value === "sikh"
          ? "#1B7FD4"
          : t.value === "buddhist"
          ? "#7C5CBF"
          : "#8B9E6E",
      subcategories: subcats.map(s => ({
        key: s.value,
        label_en: s.label,
        label_hi: s.label,
        description_en: s.label,
        description_hi: s.label,
      })),
    };
  });

  return NextResponse.json(
    { traditions: fallback, source: "snapshot" },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
