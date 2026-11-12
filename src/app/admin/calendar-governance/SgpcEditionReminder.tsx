'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Clock3, ExternalLink } from 'lucide-react';

type Reminder = { state: 'ok' | 'due_soon' | 'overdue'; message: string; latestEdition: number | null; latestEditionEnds: string | null; sourceUrl: string; guidePath: string };

export default function SgpcEditionReminder() {
  const [reminder, setReminder] = useState<Reminder | null>(null);
  useEffect(() => { fetch('/api/admin/calendar-governance/sgpc-reminder', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(setReminder).catch(() => setReminder(null)); }, []);
  if (!reminder) return null;
  const tone = reminder.state === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : reminder.state === 'due_soon' ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-rose-200 bg-rose-50 text-rose-950';
  const Icon = reminder.state === 'ok' ? CheckCircle2 : reminder.state === 'due_soon' ? Clock3 : AlertTriangle;
  return <section className={`mb-6 rounded-2xl border p-4 ${tone}`} aria-live="polite">
    <div className="flex items-start gap-3"><Icon size={20} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1"><p className="font-semibold">SGPC Nanakshahi edition: {reminder.state.replace('_', ' ')}</p>
        <p className="mt-1 text-sm">{reminder.message}</p>
        {reminder.latestEdition && <p className="mt-1 text-xs opacity-75">Samvat {reminder.latestEdition} loaded through {reminder.latestEditionEnds}.</p>}
        {reminder.state !== 'ok' && <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold"><a href={reminder.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">SGPC calendar <ExternalLink size={14} /></a><Link href={reminder.guidePath} className="underline">Open ingestion guide</Link></div>}
      </div>
    </div>
  </section>;
}
