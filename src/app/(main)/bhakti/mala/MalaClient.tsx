'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { createClient } from '@/lib/supabase';
import { BHAKTI_MANTRAS, buildMalaShareText, MALA_TARGETS } from '@/lib/bhakti-practice';
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
    if (sameLocalDay(sortedDays[i], expected)) {
      streak += 1;
    } else {
      break;
    }
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

  function tapBead() {
    if (!startedAt) setStartedAt(Date.now());
    setCount((current) => current + 1);
    navigator.vibrate?.(8);
  }

  async function saveSession() {
    if (count === 0) {
      toast.error('Start your mala first');
      return;
    }

    setSaving(true);
    const durationSeconds = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;
    const selectedSource = BHAKTI_MANTRAS.find((item) => item.value === mantra)?.source ?? null;
    const { data, error } = await supabase
      .from('mala_sessions')
      .insert({
        user_id: userId,
        mantra,
        chant_source: selectedSource,
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

  return (
    <div className="fade-in space-y-5">
      <section className="glass-panel rounded-[2rem] px-5 py-6 md:px-7">
        <div className="space-y-3">
          <div className="clay-pill inline-flex text-xs text-gray-700">Mala mode</div>
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">Japa with space to breathe</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Large controls, session history, and simple sharing for daily practice.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="clay-card rounded-[1.5rem] px-4 py-4">
              <p className="text-sm font-semibold text-gray-900">Today</p>
              <p className="mt-2 font-display text-3xl font-bold text-[color:var(--brand-primary-strong)]">{count}</p>
            </div>
            <div className="clay-card rounded-[1.5rem] px-4 py-4">
              <p className="text-sm font-semibold text-gray-900">Target</p>
              <p className="mt-2 font-display text-3xl font-bold text-[color:var(--brand-primary-strong)]">{target}</p>
            </div>
            <div className="clay-card rounded-[1.5rem] px-4 py-4">
              <p className="text-sm font-semibold text-gray-900">This week</p>
              <p className="mt-2 font-display text-3xl font-bold text-[color:var(--brand-primary-strong)]">{totalThisWeek}</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-[rgba(200,127,146,0.18)] bg-white/80 px-4 py-4">
              <p className="text-sm font-semibold text-gray-900">Streak</p>
              <p className="mt-2 font-display text-3xl font-bold text-[color:var(--brand-primary-strong)]">{streak}</p>
            </div>
            <div className="rounded-[1.5rem] border border-[rgba(200,127,146,0.18)] bg-white/80 px-4 py-4">
              <p className="text-sm font-semibold text-gray-900">Saved sessions</p>
              <p className="mt-2 font-display text-3xl font-bold text-[color:var(--brand-primary-strong)]">{totalSessions}</p>
            </div>
            <div className="rounded-[1.5rem] border border-[rgba(200,127,146,0.18)] bg-white/80 px-4 py-4">
              <p className="text-sm font-semibold text-gray-900">Last session</p>
              <p className="mt-2 text-sm font-medium text-gray-700">
                {lastSession
                  ? new Date(lastSession.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                  : 'Not yet'}
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="rounded-[1.5rem] border border-[rgba(200,127,146,0.18)] bg-white/75 px-4 py-4">
              <p className="text-sm font-semibold text-gray-900">Practice abundance</p>
              <p className="mt-2 text-sm text-gray-600">
                {totalSessions > 0
                  ? `${Math.round(totalMalas * 10) / 10} malas saved across ${totalSessions} sessions.`
                  : 'Your first saved mala becomes the start of your return rhythm.'}
              </p>
            </div>
            <button
              onClick={() => {
                setMantra(suggestedMantra);
                setTarget(lastSession?.target_count ?? 108);
                setNotes(lastSession?.notes ?? '');
              }}
              className="glass-button-secondary rounded-[1.5rem] px-5 py-4 text-sm font-semibold"
              style={{ color: 'var(--brand-primary-strong)' }}
            >
              Continue with {suggestedMantra}
            </button>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] px-5 py-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mantra</label>
          <select
            value={mantra}
            onChange={(event) => setMantra(event.target.value)}
            className="w-full rounded-xl border border-[rgba(200,127,146,0.18)] bg-white px-4 py-3 text-sm outline-none"
          >
            {BHAKTI_MANTRAS.map((item) => (
              <option key={item.value} value={item.value}>{item.value}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {MALA_TARGETS.map((value) => (
            <button
              key={value}
              onClick={() => setTarget(value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${target === value ? 'text-white' : 'bg-white text-gray-700 border border-[rgba(200,127,146,0.18)]'}`}
              style={target === value ? { background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' } : undefined}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="space-y-4 rounded-[1.8rem] bg-[var(--brand-primary-soft)]/55 px-5 py-5 text-center">
          <p className="font-display text-6xl font-bold text-[color:var(--brand-primary-strong)]">{count}</p>
          <div className="h-2 overflow-hidden rounded-full bg-white/80">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--brand-primary-strong), var(--brand-primary))' }}
            />
          </div>
          <button
            onClick={tapBead}
            className="mx-auto flex h-48 w-48 items-center justify-center rounded-full text-xl font-semibold text-white shadow-sacred"
            style={{ background: 'radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--brand-primary) 84%, white), var(--brand-primary-strong))' }}
          >
            Tap bead
          </button>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setCount((current) => Math.max(0, current - 1))}
              className="glass-button-secondary rounded-full px-4 py-2 text-sm font-semibold"
              style={{ color: 'var(--brand-primary-strong)' }}
            >
              Undo
            </button>
            <button
              onClick={() => {
                setCount(0);
                setStartedAt(null);
              }}
              className="glass-button-secondary rounded-full px-4 py-2 text-sm font-semibold"
              style={{ color: 'var(--brand-primary-strong)' }}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Sankalpa or notes..."
            className="w-full rounded-xl border border-[rgba(200,127,146,0.18)] bg-white px-4 py-3 text-sm outline-none"
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Share</label>
            <select
              value={shareScope}
              onChange={(event) => setShareScope(event.target.value as 'private' | 'kul' | 'public')}
              className="w-full rounded-xl border border-[rgba(200,127,146,0.18)] bg-white px-4 py-3 text-sm outline-none"
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
            className="glass-button-primary rounded-full px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save session'}
          </button>
          <button
            onClick={shareSummary}
            disabled={count === 0}
            className="glass-button-secondary rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
            style={{ color: 'var(--brand-primary-strong)' }}
          >
            Share progress
          </button>
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-gray-900">Recent sessions</h2>
          <p className="text-xs text-gray-500">{filteredSessions.length} shown</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <div className="rounded-[1.4rem] border border-[rgba(200,127,146,0.18)] bg-white/80 px-4 py-4">
            <p className="text-sm font-semibold text-gray-900">Share card preview</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
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
            className="rounded-xl border border-[rgba(200,127,146,0.18)] bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="all">All mantras</option>
            {BHAKTI_MANTRAS.map((item) => (
              <option key={item.value} value={item.value}>{item.value}</option>
            ))}
          </select>
          <div className="flex rounded-xl border border-[rgba(200,127,146,0.18)] bg-white p-1">
            {(['7d', '30d', 'all'] as const).map((value) => (
              <button
                key={value}
                onClick={() => setHistoryRange(value)}
                className={clsx(
                  'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition',
                  historyRange === value ? 'text-white' : 'text-gray-600'
                )}
                style={historyRange === value ? { background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' } : undefined}
              >
                {value === '7d' ? '7 days' : value === '30d' ? '30 days' : 'All'}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-[1.4rem] border border-[rgba(200,127,146,0.18)] bg-white/75 px-4 py-4">
            <p className="text-sm font-semibold text-gray-900">Filtered count</p>
            <p className="mt-2 font-display text-3xl font-bold text-[color:var(--brand-primary-strong)]">{filteredCountTotal}</p>
          </div>
          <div className="rounded-[1.4rem] border border-[rgba(200,127,146,0.18)] bg-white/75 px-4 py-4">
            <p className="text-sm font-semibold text-gray-900">Sessions</p>
            <p className="mt-2 font-display text-3xl font-bold text-[color:var(--brand-primary-strong)]">{filteredSessions.length}</p>
          </div>
          <div className="rounded-[1.4rem] border border-[rgba(200,127,146,0.18)] bg-white/75 px-4 py-4">
            <p className="text-sm font-semibold text-gray-900">Return note</p>
            <p className="mt-2 text-sm text-gray-600">
              {historyRange === '7d' ? 'Use this view to keep a weekly rhythm.' : historyRange === '30d' ? 'This window shows your broader devotional consistency.' : 'A fuller archive of your saved practice.'}
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {filteredSessions.length === 0 ? (
            <p className="text-sm text-gray-500">Your saved mala sessions will appear here.</p>
          ) : (
            filteredSessions.map((session) => (
              <div key={session.id} className="rounded-[1.4rem] border border-[rgba(200,127,146,0.18)] bg-white/80 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{session.mantra}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(session.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {session.duration_seconds > 0 ? ` · ${Math.max(1, Math.round(session.duration_seconds / 60))} min` : ''}
                    </p>
                  </div>
                  <p className="font-display text-2xl font-bold text-[color:var(--brand-primary-strong)]">
                    {session.count}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--brand-primary-soft)] px-3 py-1 text-[11px] font-semibold text-[color:var(--brand-primary-strong)]">
                    {session.target_count ? `${session.count}/${session.target_count}` : `${session.count}`}
                  </span>
                  <span className="rounded-full border border-[rgba(200,127,146,0.18)] bg-white px-3 py-1 text-[11px] font-semibold text-gray-600">
                    {formatShareScope(session.share_scope)}
                  </span>
                </div>
                {session.notes ? <p className="mt-2 text-sm text-gray-600">{session.notes}</p> : null}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-gray-900">Practice rhythm</h2>
          <p className="text-xs text-gray-500">A simple return loop</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-[1.4rem] border border-[rgba(200,127,146,0.18)] bg-white/80 px-4 py-4">
            <p className="text-sm font-semibold text-gray-900">Begin</p>
            <p className="mt-2 text-sm text-gray-600">Choose one mantra and one target.</p>
          </div>
          <div className="rounded-[1.4rem] border border-[rgba(200,127,146,0.18)] bg-white/80 px-4 py-4">
            <p className="text-sm font-semibold text-gray-900">Save</p>
            <p className="mt-2 text-sm text-gray-600">Keep the count, note, and duration.</p>
          </div>
          <div className="rounded-[1.4rem] border border-[rgba(200,127,146,0.18)] bg-white/80 px-4 py-4">
            <p className="text-sm font-semibold text-gray-900">Return</p>
            <p className="mt-2 text-sm text-gray-600">Build a gentle streak over the week.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
