import type { Metadata } from "next";
import BrandMark from "@/components/BrandMark";

export const metadata: Metadata = {
  title: "Open KUL Invitation | Shoonaya",
  description: "Open a private Shoonaya family-circle invitation in the app.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function KulJoinGateway({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = typeof params?.token === "string" && /^[0-9a-f]{32,64}$/.test(params.token)
    ? params.token
    : null;
  const appHref = token ? `shoonaya://kul/join?token=${encodeURIComponent(token)}` : null;

  return (
    <main className="min-h-screen px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-md glass-panel-strong rounded-[2rem] p-8 text-center">
        <BrandMark size="lg" className="mx-auto mb-4" />
        <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--brand-muted)] mb-3">Private family invitation</p>
        <h1 className="font-display text-3xl font-bold text-[color:var(--text-cream)] mb-3">
          Join your KUL on Shoonaya
        </h1>
        <p className="text-sm text-[color:var(--brand-muted)] leading-relaxed mb-6">
          Open Shoonaya to preview the family circle. You will choose whether to join after signing in.
        </p>
        {appHref ? (
          <a className="glass-button-primary block w-full rounded-2xl px-5 py-3 text-sm font-semibold text-white" href={appHref}>
            Open Shoonaya
          </a>
        ) : (
          <p className="rounded-2xl border px-4 py-3 text-sm text-[color:var(--brand-muted)]">
            This invitation link is incomplete. Ask the family guardian to share it again.
          </p>
        )}
        <p className="mt-4 text-xs text-[color:var(--brand-muted)]">
          If the app is not installed yet, keep this page and try again after installing Shoonaya.
        </p>
      </div>
    </main>
  );
}
