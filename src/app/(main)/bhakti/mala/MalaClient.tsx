'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { createClient } from '@/lib/supabase';
import { BHAKTI_MANTRAS, buildMalaShareText, MALA_TARGETS } from '@/lib/bhakti-practice';
import { playBeadTapFeedback } from '@/lib/practice-feedback';
import ChantAudioPlayer from '@/components/bhakti/ChantAudioPlayer';
import ProgressRing from '@/components/ui/ProgressRing';
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
  const beadProgress = count % target;

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

  const counterPanel = (
    <div className="space-y-5 rounded-[16px] border bg-white px-5 py-5 text-center" style={{ borderColor: 'rgba(0,0,0,0.15)' }}>
      <p className="text-[12px] text-[color:var(--text-tertiary)]">Current mantra</p>
      <p className="text-[22px] font-medium text-[color:var(--saffron-800)]">{mantra}</p>
      <div className="flex justify-center">
        <ProgressRing
          value={beadProgress}
          max={target}
          size={220}
          stroke={10}
          center={
            <>
              <span className="text-[12px] text-[color:var(--text-tertiary)]">count</span>
              <span className="text-[26px] font-medium text-[color:var(--saffron-800)]">{count}</span>
            </>
          }
          label={`${target} target`}
        />
      </div>
      <div className="grid grid-cols-9 gap-2 justify-items-center">
        {Array.from({ length: 27 }).map((_, index) => {
          const active = index < Math.min(27, Math.round((beadProgress / target) * 27));
          return (
            <button
              key={`bead-${index}`}
              type="button"
              onClick={tapBead}
              className={clsx(
                'h-9 w-9 rounded-full border transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97]',
                active ? 'bg-[color:var(--saffron-50)]' : 'bg-white'
              )}
              style={{ borderColor: active ? 'var(--saffron-100)' : 'rgba(0,0,0,0.15)' }}
              aria-label={`Increment bead ${index + 1}`}
            />
          );
        })}
      </div>
      <p className="text-[14px] text-[color:var(--text-secondary)]">{activeMantraSource}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-[16px] border bg-white px-4 py-4 text-left" style={{ borderColor: 'rgba(0,0,0,0.15)' }}>
          <p className="text-[11px] text-[color:var(--text-tertiary)]">Rounds today</p>
          <p className="mt-2 text-[24px] font-medium text-[color:var(--saffron-800)]">{Math.floor(count / 108)}</p>
        </div>
        <div className="rounded-[16px] border bg-white px-4 py-4 text-left" style={{ borderColor: 'rgba(0,0,0,0.15)' }}>
          <p className="text-[11px] text-[color:var(--text-tertiary)]">Total in session</p>
          <p className="mt-2 text-[24px] font-medium text-[color:var(--saffron-800)]">{count}</p>
        </div>
      </div>
      <div className="flex justify-center gap-3">
        <button
          onClick={() => setCount((current) => Math.max(0, current - 1))}
          className="rounded-[24px] border bg-white px-4 py-2 text-[14px] font-medium text-[color:var(--saffron-800)] active:scale-[0.97]"
          style={{ borderColor: 'rgba(0,0,0,0.15)' }}
        >
          Undo
        </button>
        <button
          onClick={() => {
            setCount(0);
            setStartedAt(null);
          }}
          className="rounded-[24px] border bg-white px-4 py-2 text-[14px] font-medium text-[color:var(--saffron-800)] active:scale-[0.97]"
          style={{ borderColor: 'rgba(0,0,0,0.15)' }}
        >
          Reset
        </button>
      </div>
    </div>
  );

  return (
    <div className="fade-in space-y-5">
      <section className="surface-panel px-5 py-6 md:px-7">
        <div className="space-y-4">
          <div>
            <p className="text-[12px] text-[color:var(--text-tertiary)]">Mala</p>
            <h1 className="mt-1 text-[22px] font-medium text-[color:var(--brand-ink)]">Japa with less distraction</h1>
            <p className="mt-2 max-w-2xl text-[14px] text-[color:var(--text-secondary)]">
              Start with the count. Everything else stays secondary.
            </p>
          </div>

          {counterPanel}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFocusMode(true)}
              className="rounded-[24px] px-5 py-3 text-[14px] font-medium text-white active:scale-[0.97]"
              style={{ background: 'var(--saffron-800)' }}
            >
              Begin focused mala
            </button>
            <button
              onClick={() => {
                setMantra(suggestedMantra);
                setTarget(lastSession?.target_count ?? 108);
                setNotes(lastSession?.notes ?? '');
              }}
              className="rounded-[24px] border bg-white px-5 py-3 text-[14px] font-medium text-[color:var(--saffron-800)] active:scale-[0.97]"
              style={{ borderColor: 'rgba(0,0,0,0.15)' }}
            >
              Continue with {suggestedMantra}
            </button>
          </div>
        </div>
      </section>

      <section className="surface-panel px-5 py-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mantra</label>
          <select
            value={mantra}
            onChange={(event) => setMantra(event.target.value)}
            className="w-full rounded-[8px] border bg-white px-4 py-3 text-[14px] outline-none"
            style={{ borderColor: 'rgba(0,0,0,0.15)' }}
          >
            {BHAKTI_MANTRAS.map((item) => (
              <option key={item.value} value={item.value}>{item.value}</option>
            ))}
          </select>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-xs text-gray-500">{activeMantraSource}</p>
            <span className="rounded-[24px] bg-[color:var(--saffron-50)] px-3 py-1 text-[12px] font-medium text-[color:var(--saffron-800)]">
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
              className={`rounded-[24px] px-4 py-2 text-[14px] font-medium transition ${target === value ? 'text-white' : 'bg-white text-gray-700 border'}`}
              style={target === value ? { background: 'var(--saffron-800)' } : { borderColor: 'rgba(0,0,0,0.15)' }}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="surface-card px-4 py-4">
            <p className="text-[11px] text-[color:var(--text-tertiary)]">This week</p>
            <p className="mt-2 text-[24px] font-medium text-[color:var(--saffron-800)]">{totalThisWeek}</p>
          </div>
          <div className="surface-card px-4 py-4">
            <p className="text-[11px] text-[color:var(--text-tertiary)]">Streak</p>
            <p className="mt-2 text-[24px] font-medium text-[color:var(--saffron-800)]">{streak}</p>
          </div>
          <div className="surface-card px-4 py-4">
            <p className="text-[11px] text-[color:var(--text-tertiary)]">Saved sessions</p>
            <p className="mt-2 text-[24px] font-medium text-[color:var(--saffron-800)]">{totalSessions}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Sankalpa or notes..."
            className="w-full rounded-[8px] border bg-white px-4 py-3 text-[14px] outline-none"
            style={{ borderColor: 'rgba(0,0,0,0.15)' }}
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Share</label>
            <select
              value={shareScope}
              onChange={(event) => setShareScope(event.target.value as 'private' | 'kul' | 'public')}
              className="w-full rounded-[8px] border bg-white px-4 py-3 text-[14px] outline-none"
              style={{ borderColor: 'rgba(0,0,0,0.15)' }}
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
            className="rounded-[24px] px-5 py-3 text-[14px] font-medium text-white disabled:opacity-60 active:scale-[0.97]"
            style={{ background: 'var(--saffron-800)' }}
          >
            {saving ? 'Saving…' : 'Save session'}
          </button>
          <button
            onClick={shareSummary}
            disabled={count === 0}
            className="rounded-[24px] border bg-white px-5 py-3 text-[14px] font-medium text-[color:var(--saffron-800)] disabled:opacity-60 active:scale-[0.97]"
            style={{ borderColor: 'rgba(0,0,0,0.15)' }}
          >
            Share progress
          </button>
        </div>
      </section>

      <section className="surface-panel px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[22px] font-medium text-gray-900">Recent sessions</h2>
          <p className="text-[12px] text-[color:var(--text-secondary)]">{filteredSessions.length} shown</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <div className="surface-card px-4 py-4">
            <p className="text-[11px] text-[color:var(--text-tertiary)]">Share card preview</p>
            <p className="mt-2 text-[14px] leading-relaxed text-gray-600">
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
            className="rounded-[8px] border bg-white px-4 py-3 text-[14px] outline-none"
            style={{ borderColor: 'rgba(0,0,0,0.15)' }}
          >
            <option value="all">All mantras</option>
            {BHAKTI_MANTRAS.map((item) => (
              <option key={item.value} value={item.value}>{item.value}</option>
            ))}
          </select>
          <div className="flex rounded-[8px] border bg-white p-1" style={{ borderColor: 'rgba(0,0,0,0.15)' }}>
            {(['7d', '30d', 'all'] as const).map((value) => (
              <button
                key={value}
                onClick={() => setHistoryRange(value)}
                className={clsx(
                  'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition',
                  historyRange === value ? 'text-white' : 'text-gray-600'
                )}
                style={historyRange === value ? { background: 'var(--saffron-800)' } : undefined}
              >
                {value === '7d' ? '7 days' : value === '30d' ? '30 days' : 'All'}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="surface-card px-4 py-4">
            <p className="text-[11px] text-[color:var(--text-tertiary)]">Filtered count</p>
            <p className="mt-2 text-[24px] font-medium text-[color:var(--saffron-800)]">{filteredCountTotal}</p>
          </div>
          <div className="surface-card px-4 py-4">
            <p className="text-[11px] text-[color:var(--text-tertiary)]">Sessions</p>
            <p className="mt-2 text-[24px] font-medium text-[color:var(--saffron-800)]">{filteredSessions.length}</p>
          </div>
            <div className="surface-card px-4 py-4">
              <p className="text-[11px] text-[color:var(--text-tertiary)]">Practice abundance</p>
              <p className="mt-2 text-[14px] text-gray-600">
                {totalSessions > 0
                  ? `${Math.round(totalMalas * 10) / 10} malas saved overall.`
                  : 'Your first saved mala becomes the start of your return rhythm.'}
              </p>
            </div>
          </div>
        <div className="mt-4 space-y-3">
          {filteredSessions.length === 0 ? (
            <p className="text-sm text-gray-500">Your saved mala sessions will appear here.</p>
          ) : (
            filteredSessions.map((session) => (
              <div key={session.id} className="surface-card px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{session.mantra}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(session.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {session.duration_seconds > 0 ? ` · ${Math.max(1, Math.round(session.duration_seconds / 60))} min` : ''}
                    </p>
                  </div>
                  <p className="text-[24px] font-medium text-[color:var(--saffron-800)]">{session.count}</p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-[24px] bg-[color:var(--saffron-50)] px-3 py-1 text-[12px] font-medium text-[color:var(--saffron-800)]">
                    {session.target_count ? `${session.count}/${session.target_count}` : `${session.count}`}
                  </span>
                  <span className="rounded-[24px] border bg-white px-3 py-1 text-[12px] font-medium text-gray-600" style={{ borderColor: 'rgba(0,0,0,0.15)' }}>
                    {formatShareScope(session.share_scope)}
                  </span>
                </div>
                {session.notes ? <p className="mt-2 text-sm text-gray-600">{session.notes}</p> : null}
              </div>
            ))
          )}
        </div>
      </section>

      {focusMode ? (
        <div className="fixed inset-0 z-[80] px-4 py-6" style={{ background: getFocusEnvironmentStyle(focusEnvironment) }}>
          <div className="mx-auto flex h-full w-full max-w-lg flex-col justify-between rounded-[16px] border bg-white px-6 py-6" style={{ borderColor: 'rgba(0,0,0,0.15)' }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] text-[color:var(--text-tertiary)]">Focused mala</p>
                <p className="mt-1 text-[15px] text-gray-600">{mantra}</p>
              </div>
              <button
                type="button"
                onClick={() => setFocusMode(false)}
                className="rounded-[24px] border bg-white px-4 py-2 text-[14px] font-medium text-[color:var(--saffron-800)]"
                style={{ borderColor: 'rgba(0,0,0,0.15)' }}
              >
                Close
              </button>
            </div>
            <div className="space-y-6">
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
                    className={`rounded-[24px] px-3 py-1.5 text-[12px] font-medium ${focusEnvironment === item.id ? 'text-white' : 'bg-white text-gray-700 border'}`}
                    style={focusEnvironment === item.id ? { background: 'var(--saffron-800)' } : { borderColor: 'rgba(0,0,0,0.15)' }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {counterPanel}
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
                  className="rounded-[24px] px-5 py-4 text-[14px] font-medium text-white disabled:opacity-60"
                  style={{ background: 'var(--saffron-800)' }}
                >
                  {saving ? 'Saving…' : 'Save session'}
                </button>
                <button
                  onClick={shareSummary}
                  disabled={count === 0}
                  className="rounded-[24px] border bg-white px-5 py-4 text-[14px] font-medium text-[color:var(--saffron-800)] disabled:opacity-60"
                  style={{ borderColor: 'rgba(0,0,0,0.15)' }}
                >
                  Share progress
                </button>
              </div>
            </div>
            <p className="text-center text-[14px] text-gray-500">Just mantra, count, and return.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getFocusEnvironmentStyle(environment: 'mountains' | 'temple' | 'forest') {
  if (environment === 'mountains') {
    return '#F9F7F4';
  }
  if (environment === 'forest') {
    return '#F9F7F4';
  }
  return '#F9F7F4';
}
