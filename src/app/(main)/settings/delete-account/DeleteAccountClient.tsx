'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, ChevronLeft, ExternalLink, PauseCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { SACRED_RELICS } from '@/lib/relics';
import type { DeletionPreview } from '@/lib/account-deletion-preview';

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const;

// The same reminder flags Native's "pause notifications instead" turns off
// (shoonaya-mobile app/settings/detail-screen.tsx), written through the same
// PATCH /api/native/profile route (getApiUser: cookie or Bearer). There is no
// /api/notifications/pause route and no timed pause -- they stay off until the
// user turns them back on in Settings.
const REMINDER_FLAGS_OFF = {
  japa_reminder_enabled: false,
  wants_festival_reminders: false,
  wants_vrat_reminders: false,
  wants_tithi_reminders: false,
  wants_shloka_reminders: false,
  wants_nitya_reminders: false,
  wants_community_notifications: false,
  wants_family_notifications: false,
} as const;

type DeleteAccountClientProps = {
  /** null when the summary could not be loaded -- show no numbers, not zeros. */
  preview: DeletionPreview | null;
  fallbackTradition: string;
  exportAvailable: boolean;
  journalDaysSpanned: number;
};

export default function DeleteAccountClient({
  preview,
  fallbackTradition,
  exportAvailable,
  journalDaysSpanned,
}: DeleteAccountClientProps) {
  const router = useRouter();
  const tradition = preview?.tradition ?? fallbackTradition;
  const activeSymbolId = preview?.activeSymbolId ?? null;
  const journalCount = preview?.journalCount ?? 0;
  const reasons = preview?.reasons ?? [];
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [feedback, setFeedback] = useState<string>('');
  const [otherReason, setOtherReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pausing, setPausing] = useState(false);

  const activeRelic = useMemo(
    () => SACRED_RELICS.find((relic) => relic.id === activeSymbolId) ?? null,
    [activeSymbolId],
  );

  const stats = preview ? [
    { label: 'Streak', value: `${preview.streak} days` },
    { label: 'Karma', value: preview.karmaPoints.toLocaleString() },
    { label: 'Seva', value: preview.sevaScore.toLocaleString() },
    { label: 'Relics', value: `${preview.relicsCount}` },
  ] : [];
  const feedbackNeedsDetails = reasons.some((r) => r.id === feedback && 'requireDetails' in r && r.requireDetails);

  function goNext(nextStep = step + 1) {
    setDirection(1);
    setStep(nextStep);
  }

  function goBack() {
    setDirection(-1);
    setStep((current) => Math.max(1, current - 1));
  }

  async function pauseNotifications() {
    if (pausing) return;
    setPausing(true);
    try {
      const res = await fetch('/api/native/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(REMINDER_FLAGS_OFF),
      });
      if (!res.ok) throw new Error('Could not turn off reminders');
      toast.success('All reminders are off. Turn them back on in Settings anytime.');
    } catch {
      toast.error('Could not turn off reminders right now. Please try again.');
    } finally {
      setPausing(false);
    }
  }

  async function confirmDeletion() {
    if (confirmText !== 'DELETE' || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/user/delete/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: feedback || undefined,
          otherReason: feedbackNeedsDetails && otherReason.trim() ? otherReason.trim() : undefined,
        }),
      });

      const data = await res.json().catch(() => ({ success: false }));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Deletion request failed');
      }

      toast.success('Deletion scheduled. You can cancel anytime in the next 30 days from your Profile.');
      router.replace('/profile');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Deletion request failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen pb-12"
      style={{ background: 'var(--divine-bg)', color: 'var(--brand-ink)' }}
    >
      <div
        className="sticky top-0 z-20 px-5 pt-safe-top pb-4 backdrop-blur-xl"
        style={{ background: 'color-mix(in srgb, var(--divine-bg) 88%, transparent)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={step === 1 ? () => router.back() : goBack}
            className="flex h-10 w-10 items-center justify-center rounded-full border"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
          >
            <ChevronLeft size={18} color="#C5A059" />
          </button>
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.28em]"
              style={{ color: 'rgba(197,160,89,0.68)' }}
            >
              Delete Account
            </p>
            <div className="mt-2 flex items-center gap-2">
              {[1, 2, 3, 4].map((dot) => (
                <div
                  key={dot}
                  className="h-2 w-2 rounded-full"
                  style={{
                    background: dot === step ? '#C5A059' : dot < step ? 'rgba(197,160,89,0.5)' : 'rgba(255,255,255,0.14)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-5 pt-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 28 : -28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -28 : 28 }}
            transition={SPRING}
          >
            {step === 1 && (
              <div
                className="rounded-[28px] border p-6"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
              >
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border" style={{ borderColor: 'rgba(197,160,89,0.25)', background: 'rgba(255,255,255,0.03)' }}>
                    {activeRelic ? (
                      <Image
                        src={activeRelic.imageUrl}
                        alt={activeRelic.name}
                        width={52}
                        height={52}
                        className="rounded-full"
                        unoptimized
                      />
                    ) : (
                      <span className="text-3xl">{tradition === 'sikh' ? '☬' : tradition === 'buddhist' ? '☸️' : tradition === 'jain' ? '🤲' : '🪔'}</span>
                    )}
                  </div>
                  <h1 className="text-3xl font-medium" style={{ fontFamily: 'var(--font-serif)' }}>
                    Before you go...
                  </h1>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                    {preview ? `${preview.userName}, this` : 'This'} account holds your practice history, progress, and earned symbols.
                  </p>
                </div>

                {!preview && (
                  <div className="mt-6 rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                      We couldn&apos;t load your practice summary right now. Your streaks, karma, relics and journal are all part of your account and would be removed after the 30-day cool-off.
                    </p>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border p-4"
                      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
                    >
                      <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'rgba(197,160,89,0.64)' }}>
                        {stat.label}
                      </p>
                      <p className="mt-2 text-lg font-semibold">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: 'rgba(197,160,89,0.14)', background: 'rgba(197,160,89,0.06)' }}>
                  <p className="text-sm leading-relaxed">
                    Deleting starts a 30-day cancellable cool-off. After that, your {preview ? `${preview.streak}-day ` : ''}streak, karma, seva history, and unlocked relics are permanently removed. You can cancel anytime before then from your Profile page.
                  </p>
                </div>

                {preview && preview.ownedKuls.length > 0 && (
                  <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: 'rgba(197,160,89,0.14)', background: 'rgba(197,160,89,0.06)' }}>
                    <p className="text-sm leading-relaxed">
                      You created <strong>{preview.ownedKuls.map((k) => k.name).join(', ')}</strong>. Other members keep their own accounts, but let your family know before you go.
                    </p>
                  </div>
                )}

                {journalCount > 0 && (
                  <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: 'rgba(212, 106, 106, 0.25)', background: 'rgba(212, 106, 106, 0.08)' }}>
                    <div className="flex gap-2.5">
                      <AlertTriangle size={18} color="#d46a6a" className="mt-0.5 shrink-0" />
                      <p className="text-sm leading-relaxed" style={{ color: '#e58b8b' }}>
                        You have {journalCount} journal entries spanning {journalDaysSpanned} days. These are permanently removed once the cool-off period ends.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3">
                  <button
                    onClick={() => router.replace('/home')}
                    className="w-full rounded-full py-3.5 text-sm font-bold"
                    style={{ background: '#C5A059', color: '#0E0E0F' }}
                  >
                    Keep my account
                  </button>
                  <button
                    onClick={() => goNext(2)}
                    className="mx-auto text-sm"
                    style={{ color: 'var(--brand-muted)' }}
                  >
                    Continue with deletion
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div
                className="rounded-[28px] border p-6"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
              >
                <h1 className="text-3xl font-medium" style={{ fontFamily: 'var(--font-serif)' }}>
                  What went wrong?
                </h1>
                <p className="mt-3 text-sm" style={{ color: 'var(--brand-muted)' }}>
                  Optional. This helps prioritize what is broken or missing.
                </p>

                <div className="mt-6 space-y-3">
                  {reasons.map((reason) => {
                    const selected = feedback === reason.id;
                    return (
                      <button
                        key={reason.id}
                        aria-pressed={selected}
                        onClick={() => setFeedback(selected ? '' : reason.id)}
                        className="flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors"
                        style={{
                          background: selected ? 'rgba(197,160,89,0.08)' : 'rgba(255,255,255,0.03)',
                          borderColor: selected ? '#C5A059' : 'rgba(255,255,255,0.08)',
                        }}
                      >
                        <span className="text-sm font-medium">{reason.label}</span>
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-full border"
                          style={{
                            borderColor: selected ? '#C5A059' : 'rgba(255,255,255,0.16)',
                            background: selected ? 'rgba(197,160,89,0.14)' : 'transparent',
                          }}
                        >
                          {selected ? <Check size={12} color="#C5A059" /> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {feedbackNeedsDetails && (
                  <input
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    maxLength={120}
                    placeholder="Tell us what pushed you here"
                    className="mt-4 w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderColor: 'rgba(255,255,255,0.08)',
                      color: 'var(--brand-ink)',
                    }}
                  />
                )}

                <button
                  onClick={() => goNext(3)}
                  className="mt-6 w-full rounded-full py-3.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: '#C5A059', color: '#0E0E0F' }}
                >
                  Continue
                </button>
              </div>
            )}

            {step === 3 && (
              <div
                className="rounded-[28px] border p-6"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
              >
                <h1 className="text-3xl font-medium" style={{ fontFamily: 'var(--font-serif)' }}>
                  One last thing...
                </h1>
                <p className="mt-3 text-sm" style={{ color: 'var(--brand-muted)' }}>
                  There are lower-risk options if the issue is temporary.
                </p>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={pauseNotifications}
                    className="flex w-full items-start gap-3 rounded-2xl border p-4 text-left"
                    style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
                  >
                    <PauseCircle size={18} color="#C5A059" className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{pausing ? 'Turning off reminders…' : 'Turn off all reminders instead'}</p>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                        Useful if the pressure is the problem, not the account. Turn them back on in Settings anytime.
                      </p>
                    </div>
                  </button>

                  <div
                    className="rounded-2xl border p-4"
                    style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
                  >
                    <p className="text-sm font-semibold">Take a break — we&apos;ll save your progress</p>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                      You can stop using the app and return later. Your streak, karma, and relics remain intact until you delete them.
                    </p>
                  </div>

                  {exportAvailable ? (
                    <Link
                      href="/api/user/export"
                      className="flex items-start gap-3 rounded-2xl border p-4"
                      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
                    >
                      <ExternalLink size={18} color="#C5A059" className="mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">Download your data first</p>
                        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                          Export your account data before removing it permanently.
                        </p>
                      </div>
                    </Link>
                  ) : null}
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <button
                    onClick={() => router.replace('/home')}
                    className="w-full rounded-full py-3.5 text-sm font-bold"
                    style={{ background: '#C5A059', color: '#0E0E0F' }}
                  >
                    I&apos;ll stay
                  </button>
                  <button
                    onClick={() => goNext(4)}
                    className="text-sm font-medium"
                    style={{ color: '#d46a6a' }}
                  >
                    I still want to delete
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div
                className="rounded-[28px] border p-6"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} color="#d46a6a" className="mt-1 shrink-0" />
                  <div>
                    <h1 className="text-3xl font-medium" style={{ fontFamily: 'var(--font-serif)' }}>
                      Schedule deletion
                    </h1>
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                      Your account enters a 30-day cancellable cool-off. After 30 days, it, along with all your data, is permanently removed. You can cancel anytime before then from your Profile page.
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="text-[11px] uppercase tracking-[0.24em]" style={{ color: 'rgba(197,160,89,0.64)' }}>
                    Type DELETE to confirm
                  </label>
                  <input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderColor: 'rgba(255,255,255,0.08)',
                      color: 'var(--brand-ink)',
                    }}
                  />
                </div>

                <button
                  onClick={confirmDeletion}
                  disabled={confirmText !== 'DELETE' || submitting}
                  className="mt-6 w-full rounded-full py-3.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: '#b04343', color: 'white' }}
                >
                  {submitting ? 'Scheduling deletion...' : 'Schedule account deletion'}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
