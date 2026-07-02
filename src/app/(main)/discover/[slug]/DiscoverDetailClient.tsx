'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Share2, 
  BookOpen, 
  Copy, 
  Check, 
  Sparkles,
  ArrowRight,
  Send,
  Twitter,
  MessageCircle,
  Clapperboard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DiscoverPiece } from '../DiscoverGatewayClient';

type DiscoverDetailClientProps = {
  piece: DiscoverPiece;
  relatedPieces: {
    id: string;
    slug: string;
    title: string;
    hook_question: string;
    body_short: string;
    tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all';
    category: 'festival' | 'practice' | 'scripture' | 'symbol' | 'story';
  }[];
};

export default function DiscoverDetailClient({ piece, relatedPieces }: DiscoverDetailClientProps) {
  const [copiedType, setCopiedType] = useState<'reel' | 'whatsapp' | null>(null);
  const [isCreatorKitOpen, setIsCreatorKitOpen] = useState(false);

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/discover/${piece.slug}` 
    : `https://shoonaya.com/discover/${piece.slug}`;

  // Wisdom-based share copies
  const shareText = `✨ I finally understood this today: "${piece.hook_question}"\n\nRead the meaning and connect back to your roots:\n${shareUrl}`;
  
  // Programmatic Reel Script
  const reelScript = [
    `[0-10s] HOOK:`,
    `Visual: Bold text on screen reads: "${piece.hook_question}"`,
    `Audio (Warm, welcoming): "Have you ever felt like you were just blindly following rules, or felt a bit disconnected from your roots? Let's clarify one of our most beautiful traditions."`,
    ``,
    `[10-40s] THE DEEPER WISDOM:`,
    `Visual: Calm, slow-motion footage reflecting the theme.`,
    `Audio: "${piece.body_short}"`,
    ``,
    `[40-50s] THE SACRED TEXT:`,
    `Visual: Elegant overlay of the original scripture text.`,
    `Audio: "As the sacred verses teach us in ${piece.scripture_source || 'scriptures'}: '${piece.scripture_line || '...'}'"`,
    ``,
    `[50-60s] CALL TO ACTION:`,
    `Visual: Shoonaya app interface showing daily progress and reminders.`,
    `Audio: "Spiritual practice isn't about guilt; it's about connection. Download Shoonaya to go deeper into your daily journey. Link in bio!"`
  ].join('\n');

  // Programmatic WhatsApp Copy (under 280 characters)
  const rawWhatsappCopy = `✨ ${piece.hook_question}\n\nDid you know? ${piece.body_short.substring(0, 150)}...\n\nRead the full wisdom on Shoonaya:\n${shareUrl}`;
  const whatsappCopy = rawWhatsappCopy.length > 280 
    ? rawWhatsappCopy.substring(0, 277) + '...' 
    : rawWhatsappCopy;

  const handleCopyText = (text: string, type: 'reel' | 'whatsapp') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="min-h-screen pb-24 pt-4" style={{ color: 'var(--brand-ink)' }}>
      
      {/* Navigation & Actions Header */}
      <div className="flex items-center justify-between py-4 px-4 max-w-2xl mx-auto">
        <Link
          href="/discover"
          className="flex h-10 w-10 items-center justify-center rounded-full border transition-all hover:bg-white/[0.05]"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <ChevronLeft size={18} color="#C5A059" />
        </Link>

        {/* Share Actions */}
        <div className="flex items-center gap-2">
          {/* WhatsApp share */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
            title="Share on WhatsApp"
          >
            <MessageCircle size={15} />
          </a>
          {/* Twitter share */}
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 transition-all"
            title="Share on Twitter"
          >
            <Twitter size={15} />
          </a>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6 space-y-8">
        
        {/* Hook Question Header */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5A059] px-3 py-1 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/20 inline-block">
            {piece.tradition} • {piece.category}
          </span>
          <h1 className="text-3xl font-bold font-serif text-white leading-tight" style={{ fontFamily: 'var(--font-serif)' }}>
            {piece.hook_question}
          </h1>
          <p className="text-sm text-white/50">{piece.subtitle}</p>
        </div>

        {/* Relief Paragraph Callout Card */}
        <div 
          className="rounded-3xl border p-6 relative overflow-hidden bg-gradient-to-br from-[#C5A059]/5 to-transparent"
          style={{ borderColor: 'rgba(197, 160, 89, 0.2)' }}
        >
          <div className="flex items-start gap-3">
            <Sparkles size={20} className="text-[#C5A059] shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059] mb-1.5">
                The Relief Explanation
              </p>
              <p className="text-base font-medium text-white/90 leading-relaxed italic">
                &ldquo;{piece.body_short}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Scripture Section */}
        {piece.scripture_line && (
          <div className="rounded-3xl border border-white/[0.05] bg-white/[0.01] p-6 text-center space-y-3">
            <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold">
              Sacred Scripture Guidance
            </p>
            <p className="text-xl font-serif text-white leading-relaxed font-bold italic" style={{ fontFamily: 'var(--font-serif)' }}>
              {piece.scripture_line}
            </p>
            <p className="text-xs text-[#C5A059] font-semibold">
              — {piece.scripture_source || 'Sacred Verses'}
            </p>
          </div>
        )}

        {/* Full Explanatory Body */}
        <div className="prose prose-invert max-w-none text-white/80 leading-relaxed text-sm space-y-4 border-t border-white/[0.05] pt-6">
          {piece.body_full.split('\n\n').map((paragraph, index) => {
            if (paragraph.startsWith('## ')) {
              return (
                <h2 key={index} className="text-lg font-bold font-serif text-white pt-4 pb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                  {paragraph.replace('## ', '')}
                </h2>
              );
            }
            if (paragraph.startsWith('### ')) {
              return (
                <h3 key={index} className="text-sm font-semibold text-[#C5A059] pt-2 pb-1">
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            if (paragraph.startsWith('* ') || paragraph.startsWith('- ')) {
              return (
                <ul key={index} className="list-disc pl-5 space-y-1">
                  {paragraph.split('\n').map((li, liIdx) => (
                    <li key={liIdx}>{li.replace(/^[\*\-]\s+/, '')}</li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={index} className="whitespace-pre-wrap">
                {paragraph}
              </p>
            );
          })}
        </div>

        {/* Go Deeper CTA Card */}
        <div 
          className="rounded-3xl border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.02]"
          style={{ borderColor: 'var(--card-border)' }}
        >
          <div>
            <h3 className="text-sm font-bold text-white">Ready to connect deeper?</h3>
            <p className="text-xs text-white/50 mt-1">Explore daily observances, read complete scriptures, and join our practice community.</p>
          </div>
          <Link
            href={piece.app_deep_link}
            className="flex items-center gap-1.5 px-5 py-3 rounded-full text-xs font-bold transition-all shrink-0 uppercase tracking-wider"
            style={{ background: '#C5A059', color: '#0E0E0F' }}
          >
            <span>Now Go Deeper</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Related Pieces */}
        {relatedPieces.length > 0 && (
          <div className="space-y-4 border-t border-white/[0.05] pt-6">
            <h3 className="text-xs uppercase font-bold tracking-wider text-white/50 pl-1">
              Explore More {piece.tradition} Wisdom
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedPieces.map(rel => (
                <Link
                  key={rel.slug}
                  href={`/discover/${rel.slug}`}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4.5 hover:bg-white/[0.03] transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[8px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/[0.04] text-white/40 inline-block mb-2">
                      {rel.category}
                    </span>
                    <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">
                      {rel.hook_question}
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider flex items-center gap-0.5 mt-4">
                    <span>Read</span>
                    <ArrowRight size={10} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Collapsible short-form script creator kit */}
        <div className="border-t border-white/[0.05] pt-6">
          <button
            onClick={() => setIsCreatorKitOpen(!isCreatorKitOpen)}
            className="w-full flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.01] px-5 py-4 text-left transition-all hover:bg-white/[0.03]"
          >
            <div className="flex items-center gap-2.5">
              <Clapperboard size={16} className="text-[#C5A059]" />
              <div>
                <p className="text-xs font-bold text-white">Short-form Creator Kit</p>
                <p className="text-[10px] text-white/40">Programmatically generate Instagram scripts & WhatsApp text</p>
              </div>
            </div>
            <ChevronLeft 
              size={16} 
              className="text-white/45 transition-transform" 
              style={{ transform: isCreatorKitOpen ? 'rotate(90deg)' : 'rotate(270deg)' }} 
            />
          </button>

          {isCreatorKitOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="overflow-hidden bg-black/10 rounded-b-2xl border-x border-b border-white/[0.05] p-5 space-y-5"
            >
              {/* Instagram Reel Script */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059]">
                    60-Second Instagram Reel Script
                  </h4>
                  <button
                    onClick={() => handleCopyText(reelScript, 'reel')}
                    className="flex items-center gap-1 text-[9px] font-bold uppercase text-[#C5A059] bg-[#C5A059]/10 border border-[#C5A059]/20 px-2.5 py-1.5 rounded-lg"
                  >
                    {copiedType === 'reel' ? (
                      <>
                        <Check size={10} />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={10} />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="w-full bg-black/40 border border-white/[0.04] rounded-xl p-3.5 text-[11px] leading-relaxed text-white/70 overflow-x-auto whitespace-pre-wrap font-mono max-h-60">
                  {reelScript}
                </pre>
              </div>

              {/* WhatsApp Broadcast text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059]">
                    WhatsApp Share Text
                  </h4>
                  <button
                    onClick={() => handleCopyText(whatsappCopy, 'whatsapp')}
                    className="flex items-center gap-1 text-[9px] font-bold uppercase text-[#C5A059] bg-[#C5A059]/10 border border-[#C5A059]/20 px-2.5 py-1.5 rounded-lg"
                  >
                    {copiedType === 'whatsapp' ? (
                      <>
                        <Check size={10} />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={10} />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-black/40 border border-white/[0.04] rounded-xl p-3.5 text-xs text-white/75 italic">
                  {whatsappCopy}
                </div>
                <p className="text-[9px] text-white/30 text-right">
                  {whatsappCopy.length} / 280 characters
                </p>
              </div>
            </motion.div>
          )}
        </div>

      </div>

    </div>
  );
}
