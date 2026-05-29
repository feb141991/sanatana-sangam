/**
 * /invite/[userId] — Personalised referral landing page.
 *
 * Public route (no auth required). Shows who invited you, their tradition,
 * and a compelling CTA to join. Resolves the core conversion gap where
 * InviteCard previously shared /?ref=userId which dumped cold visitors at the
 * login wall and silently lost the ref param.
 *
 * Pipeline:
 *   InviteCard share → /invite/:userId → /join?ref=:code → /signup?ref=:code
 *   → profile.referred_by_code stored on account creation
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createAdminClient } from '@/lib/supabase-admin';

// Same deterministic code as HomeDashboard → InviteModal (6 hex chars, uppercase)
function generateInviteCode(userId: string): string {
  return userId.replace(/-/g, '').slice(-6).toUpperCase();
}

interface TraditionCopy {
  symbol: string;
  label: string;
  headline: string;
  subline: string;
  bullets: string[];
  accentHex: string;
}

const TRADITION_COPY: Record<string, TraditionCopy> = {
  hindu: {
    symbol: '🕉️',
    label: 'Sanatan Dharma',
    headline: 'Begin your sadhana today',
    subline: 'Daily japa, Panchang, Gita study — one sacred home for seekers.',
    bullets: ['Daily mala counter with streak tracking', 'Tradition-aware festival calendar', 'Guided Pathshala courses on Gita & Upanishads'],
    accentHex: '#C5A059',
  },
  sikh: {
    symbol: '☬',
    label: 'Sikhi',
    headline: 'Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh',
    subline: 'Nitnem, Gurbani study and connecting with the global Sangat.',
    bullets: ['Daily Nitnem reminders and log', 'Gurbani study paths', 'Connect with Gurdwaras near you'],
    accentHex: '#4f9ef8',
  },
  buddhist: {
    symbol: '☸️',
    label: 'Bauddha Dharma',
    headline: 'Mindful practice, every day',
    subline: 'Dhammapada study, meditation tracking and daily dharma.',
    bullets: ['Daily Dhammapada verse', 'Meditation session log', 'Guided study paths'],
    accentHex: '#8fa054',
  },
  jain: {
    symbol: '🤲',
    label: 'Jain Dharma',
    headline: 'Jai Jinendra',
    subline: 'Daily japa, Agama study and the path of ahimsa.',
    bullets: ['Navkar Mantra counter', 'Agama study library', 'Paryushana festival calendar'],
    accentHex: '#c09a5e',
  },
  other: {
    symbol: '✨',
    label: 'Dharmic practice',
    headline: 'Ancient wisdom for modern seekers',
    subline: 'Hindu, Sikh, Buddhist and Jain traditions — all in one place.',
    bullets: ['Daily sacred text and japa', 'Festival calendar and Panchang', 'Pathshala courses and community'],
    accentHex: '#C5A059',
  },
};

interface PageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;
  const supabase = createAdminClient();
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('full_name, username, tradition')
    .eq('id', userId)
    .maybeSingle();
  const profile = profileRaw as { full_name: string | null; username: string | null; tradition: string | null } | null;

  const name = profile?.full_name ?? profile?.username ?? 'A seeker';
  const tradition = (profile?.tradition as string) ?? 'other';
  const copy = TRADITION_COPY[tradition] ?? TRADITION_COPY.other;

  const title = `${name} invited you to Shoonaya`;
  const description = copy.subline;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://shoonaya.app/invite/${userId}`,
      siteName: 'Shoonaya',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function InvitePage({ params }: PageProps) {
  const { userId } = await params;

  // Validate UUID shape before hitting the DB
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(userId)) notFound();

  const supabase = createAdminClient();
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('full_name, username, avatar_url, tradition')
    .eq('id', userId)
    .maybeSingle();
  const profile = profileRaw as {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    tradition: string | null;
  } | null;

  if (!profile) notFound();

  const name = profile.full_name ?? profile.username ?? 'A seeker';
  const firstName = name.split(' ')[0];
  const tradition = profile.tradition ?? 'other';
  const copy = TRADITION_COPY[tradition] ?? TRADITION_COPY.other;
  const inviteCode = generateInviteCode(userId);
  const joinHref = `/join?ref=${encodeURIComponent(inviteCode)}`;
  const accent = copy.accentHex;

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'radial-gradient(ellipse at top, #1a1107 0%, #0c0a06 60%)' }}
    >
      <div
        className="w-full max-w-md rounded-[2rem] p-8"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${accent}30`,
          boxShadow: `0 0 60px ${accent}18`,
        }}
      >
        {/* Tradition symbol */}
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-3xl mb-4"
            style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}
          >
            {copy.symbol}
          </div>
          <p className="text-[10px] uppercase tracking-[0.22em] mb-1" style={{ color: `${accent}99` }}>
            {copy.label}
          </p>
        </div>

        {/* Inviter identity */}
        <div className="flex items-center gap-3 mb-6 p-3 rounded-xl" style={{ background: `${accent}0a`, border: `1px solid ${accent}18` }}>
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={name}
              width={40}
              height={40}
              className="rounded-full w-10 h-10 object-cover shrink-0"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: `${accent}25`, color: accent }}
            >
              {firstName[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Your personal invitation from
            </p>
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {name}
            </p>
          </div>
        </div>

        {/* Headline */}
        <h1
          className="text-2xl font-bold text-center mb-2 leading-snug"
          style={{ color: 'rgba(255,255,255,0.92)' }}
        >
          {copy.headline}
        </h1>
        <p className="text-sm text-center mb-6 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {firstName} uses Shoonaya for their daily practice. {copy.subline}
        </p>

        {/* Feature bullets */}
        <ul className="space-y-2 mb-8">
          {copy.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <span className="mt-0.5 text-xs shrink-0" style={{ color: accent }}>✓</span>
              {bullet}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          href={joinHref}
          className="block w-full text-center rounded-2xl px-5 py-3.5 text-sm font-bold transition-all active:scale-95"
          style={{
            background: accent,
            color: '#0E0E0F',
            boxShadow: `0 0 20px ${accent}44`,
          }}
        >
          Accept {firstName}&apos;s invitation →
        </Link>

        <p className="text-center text-[10px] mt-4" style={{ color: 'rgba(255,255,255,0.28)' }}>
          Free to join · No credit card required
        </p>

        {/* Already have account */}
        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="text-xs"
            style={{ color: `${accent}77` }}
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
