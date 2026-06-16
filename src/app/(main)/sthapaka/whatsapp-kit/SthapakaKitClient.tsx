'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Share2, HelpCircle, Users, Award, ShieldAlert, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { FESTIVAL_BLESSINGS, type FestivalBlessing } from '@/lib/festival-blessings';

interface SthapakaKitClientProps {
  profile: any;
  isSthapaka: boolean;
  referralCount: number;
}

const COMMUNITY_GUIDELINES = [
  {
    title: '🌅 The Brahma Muhurta Greeting',
    desc: 'Send a morning verse or daily sadhana quote around sunrise to anchor your community before their busy day begins.',
  },
  {
    title: '🔒 Guard the Sacred Space',
    desc: 'Keep discussions strictly focused on scripture, practice, and mutual upliftment. Zero tolerance for politics, gossip, or forward spam.',
  },
  {
    title: '🤝 Build Weekly Sadhana Circles',
    desc: 'Run a weekly Japa count or scripture reading group inside your WhatsApp community. Use Shoonaya to track achievements.',
  },
  {
    title: '📍 Coordinate Local Satsangs',
    desc: 'Use the Tirtha Map to locate nearby mandirs or historical sites and organize simple in-person meetups for your community.',
  }
];

export default function SthapakaKitClient({
  profile,
  isSthapaka,
  referralCount,
}: SthapakaKitClientProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedScheduleIndex, setCopiedScheduleIndex] = useState<number | null>(null);

  const foundingNumber = profile?.founding_number ?? 0;
  const referralLink = `https://shoonaya.com/join?ref=${foundingNumber}`;

  // 7-day WhatsApp schedule copy content
  const schedule = [
    {
      day: 1,
      title: '☀️ Daily Sadhana Rhythm',
      desc: 'Invite your community to build a morning practice.',
      text: `🌅 *A beautiful morning reminder* 🌅\n\n` +
        `"Dharmo rakṣati rakṣitaḥ" — Dharma protected, protects.\n\n` +
        `I've been using Shoonaya to structure my morning Sadhana. It aligns daily practice with the Panchang, from Japa to scripture study, across Hindu, Sikh, Buddhist, and Jain traditions.\n\n` +
        `Join me as a founding member (Sthapaka) to build a daily rhythm:\n` +
        `👉 ${referralLink}&utm_source=whatsapp\n\n` +
        `Let's walk this path together! 🙏`,
    },
    {
      day: 2,
      title: '📖 Sacred Scripture Study',
      desc: 'Share the beauty of learning shlokas and shabads.',
      text: `📖 *Ancient Wisdom for Modern Seekers* 📖\n\n` +
        `Whether you want to learn the Bhagavad Gita, Sri Guru Granth Sahib, Dhammapada, or Jain Agamas, Shoonaya Pathshala offers guided, interactive paths to learn scripture.\n\n` +
        `Accept my invitation and explore the sacred texts:\n` +
        `👉 ${referralLink}&utm_source=whatsapp\n\n` +
        `Pranam! 🪔`,
    },
    {
      day: 3,
      title: '📿 Digital Japa & Dhyana',
      desc: 'Introduce the digital mala with audio bead counting.',
      text: `📿 *Let's build a Japa habit* 📿\n\n` +
        `Shoonaya features a digital Japa mala with mantra audio, bead counts, and streak tracking that helps you stay committed to your daily chanting.\n\n` +
        `Access the japa tracker here:\n` +
        `👉 ${referralLink}&utm_source=whatsapp\n\n` +
        `May you find peace and focus. ✨`,
    },
    {
      day: 4,
      title: '🌳 Kul & Lineage Preservation',
      desc: 'Talk about family trees and gotra records.',
      text: `🌳 *Preserving our heritage* 🌳\n\n` +
        `How are you keeping your family traditions and gotra records alive? Shoonaya lets you map your family tree (Kul) and log family sanskaras across generations.\n\n` +
        `Build your family spiritual tree here:\n` +
        `👉 ${referralLink}&utm_source=whatsapp\n\n` +
        `For our ancestors and descendants. 🏠`,
    },
    {
      day: 5,
      title: '✨ Dharma Mitra AI',
      desc: 'Share the AI spiritual guide rooted in Shastra.',
      text: `✨ *Got questions about Dharma?* ✨\n\n` +
        `Shoonaya has a dedicated AI companion called "Dharma Mitra" that is trained on shastra. You can ask questions about gotras, vrats, or daily scriptures, and get authentic answers.\n\n` +
        `Try Dharma Mitra out for free:\n` +
        `👉 ${referralLink}&utm_source=whatsapp\n\n` +
        `A pocket guide to shastra! 🪔`,
    },
    {
      day: 6,
      title: '🤝 Finding Local Mandalis',
      desc: 'Bring people together for in-person satsang.',
      text: `🤝 *Find your spiritual sangham* 🤝\n\n` +
        `Looking for local mandirs, Gurudwaras, or satsang groups? Shoonaya features a Tirtha Map and local Mandali channels to find community in your city.\n\n` +
        `Let's build our local community together:\n` +
        `👉 ${referralLink}&utm_source=whatsapp\n\n` +
        `Sat Sri Akal / Jai Shri Ram! ☬ 🕉️`,
    },
    {
      day: 7,
      title: '📅 Panchang & Auspicious Days',
      desc: 'Promote daily panchang-aligned notifications.',
      text: `📅 *Align with cosmic rhythms* 📅\n\n` +
        `Shoonaya calculates tithi, nakshatras, and brahma muhurta for your exact GPS coordinates, offering custom notifications for vrats and festivals.\n\n` +
        `Get your personal Panchang dashboard here:\n` +
        `👉 ${referralLink}&utm_source=whatsapp\n\n` +
        `Walk in harmony with time. 🌅`,
    }
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopySchedule = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedScheduleIndex(index);
    toast.success(`Day ${index + 1} template copied!`);
    setTimeout(() => setCopiedScheduleIndex(null), 2000);
  };

  if (!isSthapaka) {
    return (
      <div className="py-10 px-4 min-h-[85vh] flex flex-col justify-center items-center">
        <div className="w-full max-w-md bg-white/[0.03] border border-white/[0.08] backdrop-blur-md rounded-[2.5rem] p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-glow opacity-[0.03] pointer-events-none" />
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-3xl mb-6">
            🪔
          </div>
          <h1 className="text-2xl font-bold font-serif text-white mb-3">Sthapaka Kit Exclusive</h1>
          <p className="text-sm text-white/50 leading-relaxed mb-6">
            This dashboard and distribution kit is reserved for **Shoonaya Sthapakas** — the founding builders of our global dharmic sangam.
          </p>

          <div className="text-left space-y-4 mb-8">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <Award className="text-[#C5A059] shrink-0 mt-0.5" size={18} />
              <div>
                <h3 className="text-sm font-semibold text-white/90">Permanent Sthapaka Badge</h3>
                <p className="text-xs text-white/40 mt-0.5">Showcase your founding spot #1-1000 on your public profile.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <Users className="text-[#C5A059] shrink-0 mt-0.5" size={18} />
              <div>
                <h3 className="text-sm font-semibold text-white/90">Exclusive Mandali Access</h3>
                <p className="text-xs text-white/40 mt-0.5">Direct link to OG founders-only discussion channels.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link href="/pricing" className="block w-full py-4 rounded-full bg-[#C5A059] text-black font-bold text-sm shadow-lg active:scale-95 transition-all">
              Become a Sthapaka Now
            </Link>
            <Link href="/home" className="block w-full py-3.5 rounded-full border border-white/10 text-white/60 font-semibold text-sm active:scale-95 transition-all">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-8 font-outfit text-white/90">
      {/* Header */}
      <div className="text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px]" />
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059] block mb-2">Founding Node Dashboard</span>
        <h1 className="text-3xl md:text-4xl font-light font-serif tracking-tight text-white">Sthapaka Starter Kit</h1>
        <p className="text-sm text-white/40 max-w-md mx-auto mt-2">
          Your tools for building, inspiring, and guiding your local and digital dharmic community.
        </p>
      </div>

      {/* Referral Stats & Deep Link */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Stats Card */}
        <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-md rounded-3xl p-6 flex items-center justify-between shadow-xl">
          <div>
            <span className="text-xs text-white/40 uppercase tracking-wider font-semibold block">Dharma Node Attributions</span>
            <span className="text-4xl font-serif font-bold text-[#C5A059] block mt-2">{referralCount}</span>
            <p className="text-xs text-white/40 mt-2">Seekers brought into the fold under your node</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-2xl shadow-inner">
            🤝
          </div>
        </div>

        {/* Deep Link Card */}
        <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-md rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-xs text-white/40 uppercase tracking-wider font-semibold block">Your Sthapaka Deep Link</span>
            <p className="text-xs text-white/40 mt-1">Saves attribution cookie to track converted users</p>
          </div>
          <div className="flex gap-2 items-center bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3 mt-4">
            <span className="text-sm text-white/80 font-mono select-all truncate flex-1">{referralLink}</span>
            <button
              onClick={handleCopyLink}
              className="p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] text-white/70 active:scale-95 transition-all shrink-0"
            >
              {copiedLink ? <Check size={16} className="text-[#C5A059]" /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* 7-Day WhatsApp Schedule */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-serif text-white">7-Day WhatsApp Schedule</h2>
          <p className="text-xs text-white/40 mt-1">Copy-paste ready templates crafted with daily value hooks for your community.</p>
        </div>

        <div className="space-y-3">
          {schedule.map((item, idx) => {
            const isCopied = copiedScheduleIndex === idx;
            return (
              <div
                key={item.day}
                className="bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.08] rounded-3xl p-5 shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-[#C5A059] border border-amber-500/20 font-mono">
                      DAY {item.day}
                    </span>
                    <h3 className="text-sm font-semibold text-white/90">{item.title}</h3>
                  </div>
                  <button
                    onClick={() => handleCopySchedule(item.text, idx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all"
                  >
                    {isCopied ? (
                      <>
                        <Check size={12} className="text-[#C5A059]" />
                        <span className="text-[#C5A059]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Template</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-white/40 mb-3">{item.desc}</p>
                <pre className="text-xs text-white/60 bg-[#070708] border border-white/[0.03] rounded-2xl p-4 overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed shadow-inner">
                  {item.text}
                </pre>
              </div>
            );
          })}
        </div>
      </div>

      {/* Blessing Cards Share section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-serif text-white">WhatsApp Blessing Cards</h2>
          <p className="text-xs text-white/40 mt-1">Send a devotional blessing card pre-configured to attribute users who tap the invite link.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {FESTIVAL_BLESSINGS.slice(0, 4).map((b) => {
            const blessingPageUrl = `https://shoonaya.com/blessing/${b.slug}?ref=${foundingNumber}`;
            const waText = `${b.shareTitle}\n\n${b.shareBody}\n\n👉 Accept invitation: ${blessingPageUrl}`;
            const waHref = `https://wa.me/?text=${encodeURIComponent(waText)}`;

            return (
              <div
                key={b.slug}
                className="rounded-3xl border p-5 flex flex-col justify-between relative overflow-hidden shadow-xl"
                style={{
                  background: b.bgGradient,
                  borderColor: `${b.accentColor}33`,
                }}
              >
                <div className="absolute inset-0 bg-radial-glow opacity-[0.05] pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{b.emoji}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/15 bg-white/5 text-white/60">
                      {b.tradition === 'all' ? 'All traditions' : b.tradition}
                    </span>
                  </div>
                  <h3 className="text-lg font-serif font-light text-white leading-snug">{b.name}</h3>
                  <p className="text-xs text-white/50 italic mt-1">&ldquo;{b.shareBody}&rdquo;</p>
                </div>

                <div className="mt-5 pt-4 border-t border-white/10 flex gap-2">
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#25d366] text-black font-bold text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all"
                  >
                    <Share2 size={13} />
                    WhatsApp
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(waText);
                      toast.success(`${b.name} share text copied!`);
                    }}
                    className="px-3 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 text-white active:scale-95 transition-all"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Community instructions */}
      <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-md rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-lg shadow-inner">
            💡
          </div>
          <div>
            <h2 className="text-lg font-serif text-white">Dharmic Community Guide</h2>
            <p className="text-xs text-white/40">Tips for running a sacred and engaging WhatsApp group</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-2">
          {COMMUNITY_GUIDELINES.map((guideline, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03]">
              <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wide block mb-1">
                {guideline.title}
              </h3>
              <p className="text-xs text-white/40 leading-relaxed">
                {guideline.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
