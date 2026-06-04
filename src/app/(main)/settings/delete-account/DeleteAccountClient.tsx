'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, ChevronLeft, ExternalLink, PauseCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { SACRED_RELICS } from '@/lib/relics';

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const;

const FEEDBACK_OPTIONS = [
  'I don\'t use it enough',
  'Missing features I need',
  'Privacy concerns',
  'Starting fresh',
  'Technical issues',
  'Other reason',
] as const;

type FeedbackOption = (typeof FEEDBACK_OPTIONS)[number];

type DeleteAccountClientProps = {
  userName: string;
  tradition: string;
  activeSymbolId: string | null;
  streak: number;
  karmaPoints: number;
  sevaScore: number;
  relicsUnlocked: number;
  exportAvailable: boolean;
  journalCount: number;
  journalDaysSpanned: number;
};

export default function DeleteAccountClient({
  userName,
  tradition,
  activeSymbolId,
  streak,
  karmaPoints,
  sevaScore,
  relicsUnlocked,
  exportAvailable,
  journalCount,
  journalDaysSpanned,
}: DeleteAccountClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [feedback, setFeedback] = useState<FeedbackOption | ''>('');
  const [otherReason, setOtherReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pausing, setPausing] = useState(false);

  const activeRelic = useMemo(
    () => SACRED_RELICS.find((relic) => relic.id === activeSymbolId) ?? null,
    [activeSymbolId],
  );

  const stats = [
    { label: 'Streak', value: `${streak} days` },
    { label: 'Karma', value: karmaPoints.toLocaleString() },
    { label: 'Seva', value: sevaScore.toLocaleString() },
    { label: 'Relics', value: `${relicsUnlocked}` },
  ];

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
      const res = await fetch('/api/notifications/pause', { method: 'POST' });
      if (!res.ok) throw new Error('Pause is unavailable');
      toast.success('Notifications paused for a week.');
    } catch {
      toast.error('Notification pause is unavailable right now.');
    } finally {
      setPausing(false);
    }
  }

  async function confirmDeletion() {
    if (confirmText !== 'DELETE' || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: feedback,
          otherReason: feedback === 'Other reason' ? otherReason.trim() : '',
        }),
      });

      const data = await res.json().catch(() => ({ success: false }));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Deletion failed');
      }

      router.replace('/?accountDeleted=1');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Deletion failed');
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
        className="sticky top-0 z-20 px-5 pt-10 pb-4 backdrop-blur-xl"
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
                    {userName}, this account holds your practice history, progress, and earned symbols.
                  </p>
                </div>

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
                    Your {streak}-day streak will be lost forever. This action also removes your karma, seva history, and unlocked relics.
                  </p>
                </div>

                {journalCount > 0 && (
                  <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: 'rgba(212, 106, 106, 0.25)', background: 'rgba(212, 106, 106, 0.08)' }}>
                    <div className="flex gap-2.5">
                      <AlertTriangle size={18} color="#d46a6a" className="mt-0.5 shrink-0" />
                      <p className="text-sm leading-relaxed" style={{ color: '#e58b8b' }}>
                        You have {journalCount} journal entries spanning {journalDaysSpanned} days. These cannot be recovered.
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
                  One reason is required. This helps prioritize what is broken or missing.
                </p>

                <div className="mt-6 space-y-3">
                  {FEEDBACK_OPTIONS.map((option) => {
                    const selected = feedback === option;
                    return (
                      <button
                        key={option}
                        onClick={() => setFeedback(option)}
                        className="flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors"
                        style={{
                          background: selected ? 'rgba(197,160,89,0.08)' : 'rgba(255,255,255,0.03)',
                          borderColor: selected ? '#C5A059' : 'rgba(255,255,255,0.08)',
                        }}
                      >
                        <span className="text-sm font-medium">{option}</span>
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

                {feedback === 'Other reason' && (
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
                  disabled={!feedback || (feedback === 'Other reason' && !otherReason.trim())}
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
                      <p className="text-sm font-semibold">Pause notifications for a week</p>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                        Useful if the pressure is the problem, not the account.
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
                      Confirm deletion
                    </h1>
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                      This action cannot be undone. All data, progress, karma, and relics will be permanently removed.
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
                  {submitting ? 'Deleting account...' : 'Delete account permanently'}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
