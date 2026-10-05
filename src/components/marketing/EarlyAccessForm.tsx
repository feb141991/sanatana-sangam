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
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [foundingNumber, setFoundingNumber] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) || email.trim().length > 254) {
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
          company_website: companyWebsite,
        }),
      });

      const responseBody: unknown = await res.json();
      const data = typeof responseBody === "object" && responseBody !== null
        ? responseBody as { error?: unknown; foundingNumber?: unknown; message?: unknown }
        : {};

      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Unable to register. Please try again.");
      }

      setFoundingNumber(typeof data.foundingNumber === "number" ? data.foundingNumber : null);
      setStatus("success");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
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
          {foundingNumber ? `Request #${foundingNumber}` : "Request Received"}
        </div>
        <h3 className="font-display text-2xl font-semibold text-[var(--text-cream)] sm:text-3xl">
          Your Request Has Been Received
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted-warm)] sm:text-base sm:leading-8">
          Thank you for your interest in Shoonaya. Your request is recorded; it does not create an account, whitelist, or invitation, and it does not guarantee access or a date.
        </p>

        <div className="mt-6 flex items-center gap-2 text-xs text-[var(--text-dim)] border-t border-[var(--card-border)] pt-4">
          <ShieldCheck className="size-4 text-[var(--brand-primary-strong)]" />
          <span>Your email is not shown publicly and is used to respond to this early-access request.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 sm:p-10 shadow-xl ${className}`}>
      <div className="flex items-center justify-between gap-4 mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-[rgba(216,138,28,0.12)] text-[var(--brand-primary-strong)] border border-[rgba(216,138,28,0.25)]">
          <span className="size-1.5 rounded-full bg-[var(--brand-primary)] animate-pulse" />
          Early Access
        </span>
      </div>

      <h3 className="font-display text-2xl font-semibold tracking-tight text-[var(--text-cream)] sm:text-3xl">
        Join the Early-Access List
      </h3>
      <p className="mt-2.5 text-sm leading-relaxed text-[var(--text-muted-warm)] sm:text-base">
        Tell us where to reach you. This records your interest in Shoonaya; it does not create or whitelist an account, issue an invitation, or guarantee access or timing.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div aria-hidden="true" className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
          <label htmlFor="company-website">Leave this field empty</label>
          <input
            id="company-website"
            type="text"
            value={companyWebsite}
            onChange={(event) => setCompanyWebsite(event.target.value)}
            autoComplete="off"
            tabIndex={-1}
          />
        </div>
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
              Platform Interest
            </label>
            <select
              id="device"
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              disabled={status === "loading"}
              className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-cream)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] transition"
            >
              <option value="android">Android</option>
              <option value="ios">iPhone or iPad</option>
              <option value="web">Web browser</option>
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
              Join the Early-Access List
              <ArrowRight className="size-4" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-[var(--text-dim)]">
          We send a one-time request confirmation. Access timing depends on release availability; no date is promised.
        </p>
      </form>
    </div>
  );
}
