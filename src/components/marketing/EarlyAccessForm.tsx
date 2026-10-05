"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Sparkles, ShieldCheck } from "lucide-react";

interface EarlyAccessFormProps {
  source?: string;
  defaultSource?: string;
  className?: string;
}

export function EarlyAccessForm({
  source,
  defaultSource = "early-access-page",
  className = "",
}: EarlyAccessFormProps) {
  const activeSource = source || defaultSource;
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [tradition, setTradition] = useState<string>("hindu");
  const [device, setDevice] = useState<string>("android");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [foundingNumber, setFoundingNumber] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          tradition: tradition !== "universal" ? tradition : undefined,
          source: `${activeSource}-${device}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Unable to register. Please try again.");
      }

      setFoundingNumber(data.foundingNumber || null);
      setStatus("success");
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className={`rounded-3xl border border-[var(--brand-primary)]/40 bg-[var(--surface-soft)] p-8 sm:p-10 shadow-xl ${className}`}>
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)] mb-6">
          <CheckCircle2 className="size-7" />
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--brand-primary-strong)] mb-4">
          <Sparkles className="size-3.5" />
          {foundingNumber ? `Founding Seeker #${foundingNumber}` : "Access Queued"}
        </div>
        <h3 className="font-display text-2xl font-semibold text-[var(--text-cream)] sm:text-3xl">
          Early Access Request Received
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted-warm)] sm:text-base sm:leading-8">
          Thank you for joining our private testing circle. Our engineering team reviews applicant cohorts and provisions accounts in the background. As soon as your device batch is ready, we will deliver your direct installation link and setup instructions straight to <span className="font-semibold text-[var(--text-cream)]">{email}</span>.
        </p>

        <div className="mt-6 flex items-center gap-2 text-xs text-[var(--text-dim)] border-t border-[var(--card-border)] pt-4">
          <ShieldCheck className="size-4 text-[var(--brand-primary-strong)]" />
          <span>No spam, no public listing. Your email remains strictly confidential.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 sm:p-10 shadow-xl ${className}`}>
      <div className="flex items-center justify-between gap-4 mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-[rgba(216,138,28,0.12)] text-[var(--brand-primary-strong)] border border-[rgba(216,138,28,0.25)]">
          <span className="size-1.5 rounded-full bg-[var(--brand-primary)] animate-pulse" />
          Private Testing Cohort
        </span>
        <span className="text-xs text-[var(--text-dim)]">Step 1 of 2</span>
      </div>

      <h3 className="font-display text-2xl font-semibold tracking-tight text-[var(--text-cream)] sm:text-3xl">
        Register for Private Early Access
      </h3>
      <p className="mt-2.5 text-sm leading-relaxed text-[var(--text-muted-warm)] sm:text-base">
        We are actively testing Shoonaya with select seekers before general release. Register below to have your account whitelisted and receive your private app link.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-cream)] mb-2">
            Email Address <span className="text-[var(--brand-primary-strong)]">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            disabled={status === "loading"}
            className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-cream)] placeholder:text-[var(--text-dim)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] transition"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-cream)] mb-2">
              Your Name <span className="text-[var(--text-dim)] font-normal">(Optional)</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Arjun Sharma"
              disabled={status === "loading"}
              className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-cream)] placeholder:text-[var(--text-dim)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] transition"
            />
          </div>

          <div>
            <label htmlFor="device" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-cream)] mb-2">
              Primary Device
            </label>
            <select
              id="device"
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              disabled={status === "loading"}
              className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-cream)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] transition"
            >
              <option value="android">Android (APK / Play Internal)</option>
              <option value="ios">iOS (Apple TestFlight)</option>
              <option value="web">Web Browser (PWA Sanctuary)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-cream)] mb-2">
            Tradition Preference
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { id: "hindu", label: "ॐ Sanatan" },
              { id: "sikh", label: "ੴ Sikh" },
              { id: "jain", label: "卐 Jain" },
              { id: "buddhist", label: "☸ Buddhist" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTradition(t.id)}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  tradition === t.id
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]"
                    : "border-[var(--card-border)] bg-[var(--surface-soft)] text-[var(--text-muted-warm)] hover:border-[var(--brand-primary)]/40"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-6 text-sm font-semibold text-[var(--surface-base)] shadow-sm hover:opacity-90 transition active:scale-98 disabled:opacity-50"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Registering your invitation...
            </>
          ) : (
            <>
              Request Private Early Access
              <ArrowRight className="size-4" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-[var(--text-dim)]">
          Early access is provisioned in batches. You will receive an email as soon as your access slot opens.
        </p>
      </form>
    </div>
  );
}
