'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import type { MalaSession } from '@/types/database';

const MANTRAS = [
  { value: 'Om Namah Shivaya', source: 'Public-domain mantra tradition' },
  { value: 'Hare Krishna Maha Mantra', source: 'Public-domain mantra tradition' },
  { value: 'Sri Ram Jai Ram Jai Jai Ram', source: 'Public-domain mantra tradition' },
  { value: 'Gayatri Mantra', source: 'Traditional chant source required for audio later' },
];

const TARGETS = [27, 54, 108];

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

export default function MalaClient({ userId, initialSessions }: { userId: string; initialSessions: MalaSession[]; }) {
  const supabase = createClient();
  const [mantra, setMantra] = useState(MANTRAS[0].value);
  const [target, setTarget] = useState(108);
  const [count, setCount] = useState(0);
  const [notes, setNotes] = useState('');
  const [shareScope, setShareScope] = useState<'private' | 'kul' | 'public'>('private');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState(initialSessions);

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
    const selectedSource = MANTRAS.find((item) => item.value === mantra)?.source ?? null;
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
    const text = `I completed ${count}/${target} japa on ${mantra} in Sanatana Sangam.`;
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
            {MANTRAS.map((item) => (
              <option key={item.value} value={item.value}>{item.value}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {TARGETS.map((value) => (
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
          <p className="text-xs text-gray-500">{sessions.length} saved</p>
        </div>
        <div className="mt-4 space-y-3">
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-500">Your saved mala sessions will appear here.</p>
          ) : (
            sessions.map((session) => (
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
