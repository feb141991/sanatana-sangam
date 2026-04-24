'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { createClient } from '@/lib/supabase';
import { BHAKTI_MANTRAS, buildMalaShareText, MALA_TARGETS } from '@/lib/bhakti-practice';
import { playBeadTapFeedback } from '@/lib/practice-feedback';
import ChantAudioPlayer from '@/components/bhakti/ChantAudioPlayer';
import type { MalaSession } from '@/types/database';

function sameLocalDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function buildDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function calculateStreak(sessions: MalaSession[]) {
  if (sessions.length === 0) return 0;
  const uniqueDays = Array.from(new Set(sessions.map((session) => buildDayKey(new Date(session.completed_at)))));
  const sortedDays = uniqueDays
    .map((value) => {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month, day);
    })
    .sort((a, b) => b.getTime() - a.getTime());

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const startsToday = sameLocalDay(sortedDays[0], today);
  const startsYesterday = sameLocalDay(sortedDays[0], yesterday);

  if (!startsToday && !startsYesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sortedDays.length; i += 1) {
    const expected = new Date(sortedDays[i - 1]);
    expected.setDate(expected.getDate() - 1);
    if (sameLocalDay(sortedDays[i], expected)) streak += 1;
    else break;
  }

  return streak;
}

function formatShareScope(scope: MalaSession['share_scope']) {
  if (scope === 'kul') return 'Kul later';
  if (scope === 'public') return 'Profile later';
  return 'Private';
}

export default function MalaClient({ userId, initialSessions }: { userId: string; initialSessions: MalaSession[]; }) {
  const supabase = createClient();
  const [mantra, setMantra] = useState<string>(BHAKTI_MANTRAS[0].value);
  const [target, setTarget] = useState(108);
  const [count, setCount] = useState(0);
  const [notes, setNotes] = useState('');
  const [shareScope, setShareScope] = useState<'private' | 'kul' | 'public'>('private');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState(initialSessions);
  const [historyMantra, setHistoryMantra] = useState<'all' | string>('all');
  const [historyRange, setHistoryRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [focusMode, setFocusMode] = useState(false);
  const [focusEnvironment, setFocusEnvironment] = useState<'mountains' | 'temple' | 'forest'>('mountains');

  const progress = Math.min(100, Math.round((count / target) * 100));
  const streak = useMemo(() => calculateStreak(sessions), [sessions]);
  const totalThisWeek = useMemo(
    () => sessions
      .filter((session) => Date.now() - new Date(session.completed_at).getTime() < 7 * 24 * 60 * 60 * 1000)
      .reduce((sum, session) => sum + session.count, 0),
    [sessions]
  );
  const totalSessions = sessions.length;
  const lastSession = sessions[0] ?? null;
  const totalMalas = useMemo(
    () => sessions.reduce((sum, session) => sum + (session.target_count ? session.count / session.target_count : 0), 0),
    [sessions]
  );
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const byMantra = historyMantra === 'all' || session.mantra === historyMantra;
      if (!byMantra) return false;
      if (historyRange === 'all') return true;
      const windowMs = historyRange === '7d' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
      return Date.now() - new Date(session.completed_at).getTime() < windowMs;
    });
  }, [historyMantra, historyRange, sessions]);
  const filteredCountTotal = useMemo(
    () => filteredSessions.reduce((sum, session) => sum + session.count, 0),
    [filteredSessions]
  );
  const suggestedMantra = lastSession?.mantra ?? BHAKTI_MANTRAS[0].value;
  const activeMantra = BHAKTI_MANTRAS.find((item) => item.value === mantra) ?? BHAKTI_MANTRAS[0];
  const activeMantraSource = activeMantra.source;
  const chantTrackIds = activeMantra.audioTrackId ? [activeMantra.audioTrackId] : ['gayatri-mantra-as-it-is', 'guru-stotram', 'kirtana-in-hindi'];

  function tapBead() {
    if (!startedAt) setStartedAt(Date.now());
    setCount((current) => current + 1);
    playBeadTapFeedback();
  }

  async function saveSession() {
    if (count === 0) {
      toast.error('Start your mala first');
      return;
    }

    setSaving(true);
    const durationSeconds = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;
    const { data, error } = await supabase
      .from('mala_sessions')
      .insert({
        user_id: userId,
        mantra,
        chant_source: activeMantraSource,
        count,
        target_count: target,
        duration_seconds: durationSeconds,
        notes: notes.trim() || null,
        share_scope: shareScope,
      })
      .select('*')
      .single();

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setSessions((current) => [data as MalaSession, ...current]);
    setCount(0);
    setNotes('');
    setStartedAt(null);
    setFocusMode(false);
    toast.success('Mala saved');
  }

  async function shareSummary() {
    const text = buildMalaShareText({ mantra, count, target, streak });
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Summary copied');
    }
  }

  // Ring dimensions
  const RING_R    = 92;
  const RING_CIRC = 2 * Math.PI * RING_R;

  const counterPanel = (
    <div className="rounded-[1.8rem] bg-[var(--brand-primary-soft)]/55 px-5 py-5 text-center space-y-3">
      <p className="type-micro">{mantra}</p>

      {/* ── SVG Ring + Tap Bead Button ── */}
      <div className="relative mx-auto flex items-center justify-center" style={{ width: 212, height: 212 }}>
        {/* Ring behind the button */}
        <svg
          width="212" height="212" viewBox="0 0 212 212"
          className="absolute inset-0 pointer-events-none -rotate-90"
        >
          <defs>
            <linearGradient id="japa-ring-grad" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#f0c86d" />
              <stop offset="50%"  stopColor="#C8924A" />
              <stop offset="100%" stopColor="#D4784A" />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle cx="106" cy="106" r={RING_R}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={10} />
          {/* Progress arc */}
          <motion.circle
            cx="106" cy="106" r={RING_R}
            fill="none"
            stroke={progress >= 100 ? '#7ec87e' : 'url(#japa-ring-grad)'}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={RING_CIRC}
            initial={{ strokeDashoffset: RING_CIRC }}
            animate={{ strokeDashoffset: RING_CIRC * (1 - Math.min(progress, 100) / 100) }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </svg>

        {/* Tap Bead button — fills the inner ring */}
        <motion.button
          onClick={tapBead}
          whileTap={{ scale: 0.94 }}
          className="relative z-10 rounded-full flex flex-col items-center justify-center"
          style={{
            width: 170, height: 170,
            background: 'radial-gradient(circle at 35% 28%, rgba(240,200,109,0.18), rgba(10,6,2,0.90))',
            border: '1px solid rgba(200,146,74,0.22)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,240,180,0.07)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '3rem',
              fontWeight: 700,
              color: 'var(--text-cream)',
              lineHeight: 1,
            }}
          >
            {count}
          </span>
          <span style={{ fontSize: '0.68rem', color: 'rgba(200,146,74,0.65)', marginTop: 5, letterSpacing: '0.05em' }}>
            {progress >= 100 ? '✓ Complete' : 'tap bead'}
          </span>
        </motion.button>
      </div>

      <p className="type-body">Target {target} · {activeMantraSource}</p>

      <div className="flex justify-center gap-3">
        <button
          onClick={() => setCount((current) => Math.max(0, current - 1))}
          className="glass-button-secondary rounded-full px-4 py-2 type-chip"
          style={{ color: 'var(--brand-primary-strong)' }}
        >
          Undo
        </button>
        <button
          onClick={() => {
            setCount(0);
            setStartedAt(null);
          }}
          className="glass-button-secondary rounded-full px-4 py-2 type-chip"
          style={{ color: 'var(--brand-primary-strong)' }}
        >
          Reset
        </button>
      </div>
    </div>
  );

  return (
    <div className="fade-in space-y-5">
      <section className="glass-panel rounded-[2rem] px-5 py-6 md:px-7">
        <div className="space-y-4">
          <div className="clay-pill inline-flex type-chip text-[color:var(--text-dim)]">Mala mode</div>
          <div>
            <h1 className="type-screen-title">Japa with less distraction</h1>
            <p className="type-body mt-2 max-w-2xl">
              Start with the counter. Everything else stays below when you need it.
            </p>
          </div>

          {counterPanel}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFocusMode(true)}
              className="glass-button-primary rounded-full px-5 py-3 type-chip text-[#1c1c1a]"
            >
              Begin focused mala
            </button>
            <button
              onClick={() => {
                setMantra(suggestedMantra);
                setTarget(lastSession?.target_count ?? 108);
                setNotes(lastSession?.notes ?? '');
              }}
              className="glass-button-secondary rounded-full px-5 py-3 type-chip"
              style={{ color: 'var(--brand-primary-strong)' }}
            >
              Continue with {suggestedMantra}
            </button>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] px-5 py-6 space-y-5">
        <div>
          <label className="type-section-label mb-2 block">Mantra</label>
          <select
            value={mantra}
            onChange={(event) => setMantra(event.target.value)}
            className="type-body w-full rounded-xl border border-[rgba(200,146,74,0.18)] bg-[color:var(--brand-accent)] px-4 py-3 outline-none"
          >
            {BHAKTI_MANTRAS.map((item) => (
              <option key={item.value} value={item.value}>{item.value}</option>
            ))}
          </select>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="type-micro">{activeMantraSource}</p>
            <span className="rounded-full border border-[color:var(--brand-primary-soft)] px-3 py-1 type-chip text-[color:var(--brand-primary-strong)]">
              Chant ready
            </span>
          </div>
        </div>

        <ChantAudioPlayer
          title="Chant accompaniment"
          trackIds={chantTrackIds}
          initialTrackId={activeMantra.audioTrackId ?? undefined}
          compact
        />

        <div className="flex flex-wrap gap-2">
          {MALA_TARGETS.map((value) => (
            <button
              key={value}
              onClick={() => setTarget(value)}
              className={`rounded-full px-4 py-2 type-chip transition ${target === value ? 'text-[#1c1c1a]' : 'bg-[color:var(--brand-accent)] text-[color:var(--text-dim)] border border-[rgba(200,146,74,0.18)]'}`}
              style={target === value ? { background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' } : undefined}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="clay-card rounded-[1.5rem] px-4 py-4">
            <p className="type-card-label">This week</p>
            <p className="type-metric mt-2">{totalThisWeek}</p>
          </div>
          <div className="clay-card rounded-[1.5rem] px-4 py-4">
            <p className="type-card-label">Streak</p>
            <p className="type-metric mt-2">{streak}</p>
          </div>
          <div className="clay-card rounded-[1.5rem] px-4 py-4">
            <p className="type-card-label">Saved sessions</p>
            <p className="type-metric mt-2">{totalSessions}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Sankalpa or notes..."
            className="type-body w-full rounded-xl border border-[rgba(200,146,74,0.18)] bg-[color:var(--brand-accent)] px-4 py-3 outline-none"
          />
          <div className="space-y-2">
            <label className="type-section-label block">Share</label>
            <select
              value={shareScope}
              onChange={(event) => setShareScope(event.target.value as 'private' | 'kul' | 'public')}
              className="type-body w-full rounded-xl border border-[rgba(200,146,74,0.18)] bg-[color:var(--brand-accent)] px-4 py-3 outline-none"
            >
              <option value="private">Private</option>
              <option value="kul">Kul later</option>
              <option value="public">Profile later</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={saveSession}
            disabled={saving}
            className="glass-button-primary rounded-full px-5 py-3 type-chip text-[#1c1c1a] disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save session'}
          </button>
          <button
            onClick={shareSummary}
            disabled={count === 0}
            className="glass-button-secondary rounded-full px-5 py-3 type-chip disabled:opacity-60"
            style={{ color: 'var(--brand-primary-strong)' }}
          >
            Share progress
          </button>
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="type-card-heading">Recent sessions</h2>
          <p className="type-micro">{filteredSessions.length} shown</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <div className="rounded-[1.4rem] border border-[rgba(200,146,74,0.18)] bg-[color:var(--brand-accent)] px-4 py-4">
            <p className="type-card-heading">Share card preview</p>
            <p className="type-body mt-2">
              {buildMalaShareText({
                mantra,
                count: count || lastSession?.count || 0,
                target,
                streak,
              })}
            </p>
          </div>
          <select
            value={historyMantra}
            onChange={(event) => setHistoryMantra(event.target.value)}
            className="type-body rounded-xl border border-[rgba(200,146,74,0.18)] bg-[color:var(--brand-accent)] px-4 py-3 outline-none"
          >
            <option value="all">All mantras</option>
            {BHAKTI_MANTRAS.map((item) => (
              <option key={item.value} value={item.value}>{item.value}</option>
            ))}
          </select>
          <div className="flex rounded-xl border border-[rgba(200,146,74,0.16)] p-1" style={{ background: 'rgba(20,16,10,0.8)' }}>
            {(['7d', '30d', 'all'] as const).map((value) => (
              <button
                key={value}
                onClick={() => setHistoryRange(value)}
                className={clsx(
                  'type-chip flex-1 rounded-lg px-3 py-2 transition',
                  historyRange === value ? 'text-[#1c1c1a]' : 'text-[color:var(--text-dim)]'
                )}
                style={historyRange === value ? { background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' } : undefined}
              >
                {value === '7d' ? '7 days' : value === '30d' ? '30 days' : 'All'}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-[1.4rem] border border-[rgba(200,146,74,0.18)] bg-[color:var(--brand-accent)] px-4 py-4">
            <p className="type-card-label">Filtered count</p>
            <p className="type-metric mt-2">{filteredCountTotal}</p>
          </div>
          <div className="rounded-[1.4rem] border border-[rgba(200,146,74,0.18)] bg-[color:var(--brand-accent)] px-4 py-4">
            <p className="type-card-label">Sessions</p>
            <p className="type-metric mt-2">{filteredSessions.length}</p>
          </div>
            <div className="rounded-[1.4rem] border border-[rgba(200,146,74,0.18)] bg-[color:var(--brand-accent)] px-4 py-4">
              <p className="type-card-label">Practice abundance</p>
              <p className="type-body mt-2">
                {totalSessions > 0
                  ? `${Math.round(totalMalas * 10) / 10} malas saved overall.`
                  : 'Your first saved mala becomes the start of your return rhythm.'}
              </p>
            </div>
          </div>
        <div className="mt-4 space-y-3">
          {filteredSessions.length === 0 ? (
            <p className="type-body">Your saved mala sessions will appear here.</p>
          ) : (
            filteredSessions.map((session) => (
              <div key={session.id} className="rounded-[1.4rem] border border-[rgba(200,146,74,0.18)] bg-[color:var(--brand-accent)] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="type-card-heading">{session.mantra}</p>
                    <p className="type-micro mt-1">
                      {new Date(session.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {session.duration_seconds > 0 ? ` · ${Math.max(1, Math.round(session.duration_seconds / 60))} min` : ''}
                    </p>
                  </div>
                  <p className="type-metric">{session.count}</p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--chip-fill)] px-3 py-1 type-chip text-[color:var(--chip-text)]">
                    {session.target_count ? `${session.count}/${session.target_count}` : `${session.count}`}
                  </span>
                  <span className="rounded-full border border-[rgba(200,146,74,0.18)] bg-[color:var(--surface-soft)] px-3 py-1 type-chip text-[color:var(--text-dim)]">
                    {formatShareScope(session.share_scope)}
                  </span>
                </div>
                {session.notes ? <p className="type-body mt-2">{session.notes}</p> : null}
              </div>
            ))
          )}
        </div>
      </section>

      {focusMode ? (
        <div className="fixed inset-0 z-[80] overflow-hidden px-3 py-3 md:px-5 md:py-5" style={{ background: getFocusEnvironmentStyle(focusEnvironment) }}>
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {focusEnvironment === 'mountains' && Array.from({ length: 14 }).map((_, i) => (
              <motion.span
                key={`snow-${i}`}
                className="absolute h-2 w-2 rounded-full bg-white/80"
                initial={{ y: '-8vh', x: 0, opacity: 0 }}
                animate={{ y: '108vh', x: i % 2 === 0 ? 22 : -16, opacity: [0, 0.9, 0] }}
                transition={{ duration: 7 + (i % 4), repeat: Infinity, ease: 'linear', delay: i * 0.18 }}
                style={{ left: `${8 + i * 6}%`, top: `${-4 + (i % 5) * 12}%`, opacity: 0.5 + (i % 3) * 0.15 }}
              />
            ))}
            <motion.div
              className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
              animate={{ scale: [1, 1.1, 1], opacity: [0.18, 0.3, 0.18] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{ background: 'radial-gradient(circle, rgba(240,200,109,0.16), rgba(240,200,109,0) 68%)' }}
            />
          </div>
          <div className="mx-auto grid h-full w-full max-w-3xl grid-rows-[auto_1fr_auto] rounded-[2.2rem] border border-[rgba(200,146,74,0.18)] bg-[rgba(28,28,26,0.56)] px-5 py-5 shadow-sacred backdrop-blur-xl md:px-8 md:py-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="type-card-label">Focused mala</p>
                <p className="type-body mt-1">{mantra}</p>
              </div>
              <button
                type="button"
                onClick={() => setFocusMode(false)}
                className="glass-button-secondary rounded-full px-4 py-2 type-chip"
                style={{ color: 'var(--brand-primary-strong)' }}
              >
                Close
              </button>
            </div>
            <div className="flex min-h-0 flex-col items-center justify-center gap-6">
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { id: 'mountains', label: 'Snow peaks' },
                  { id: 'temple', label: 'Temple dawn' },
                  { id: 'forest', label: 'Forest quiet' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFocusEnvironment(item.id as 'mountains' | 'temple' | 'forest')}
                    className={`rounded-full px-3 py-1.5 type-chip ${focusEnvironment === item.id ? 'text-[#1c1c1a]' : 'bg-[rgba(28,28,26,0.45)] text-[color:var(--text-dim)]'}`}
                    style={focusEnvironment === item.id ? { background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' } : undefined}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-full max-w-md"
              >
                {counterPanel}
              </motion.div>
              <ChantAudioPlayer
                title="Focus chant"
                trackIds={chantTrackIds}
                initialTrackId={activeMantra.audioTrackId ?? undefined}
                compact
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={saveSession}
                  disabled={saving}
                  className="glass-button-primary rounded-full px-5 py-4 type-chip text-[#1c1c1a] disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save session'}
                </button>
                <button
                  onClick={shareSummary}
                  disabled={count === 0}
                  className="glass-button-secondary rounded-full px-5 py-4 type-chip disabled:opacity-60"
                  style={{ color: 'var(--brand-primary-strong)' }}
                >
                  Share progress
                </button>
              </div>
            </div>
            <p className="type-body text-center">Just mantra, count, and return.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getFocusEnvironmentStyle(environment: 'mountains' | 'temple' | 'forest') {
  if (environment === 'mountains') {
    return 'linear-gradient(180deg, #14191f 0%, #202a36 32%, #2d3741 100%)';
  }
  if (environment === 'forest') {
    return 'linear-gradient(180deg, #121c16 0%, #1d2c22 38%, #29392e 100%)';
  }
  return 'linear-gradient(180deg, #1f1511 0%, #34231d 40%, #4a3026 100%)';
}
