'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LifeBuoy,
  Search,
  Sparkles,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Clock,
  ShieldCheck,
  Send,
  Ticket as TicketIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DeflectionResult {
  deflected: boolean;
  confidence: number;
  answer: string;
  bulletPoints: string[];
  suggestedLinks: Array<{ label: string; href: string }>;
  suggestedCategory: string;
  suggestedPriority: string;
  requiresHumanEscalation: boolean;
}

interface TrackedTicket {
  ticketNumber: string;
  seekerName: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  messages: Array<{
    id: string;
    sender_type: string;
    sender_name: string;
    message: string;
    created_at: string;
  }>;
}

const SAMPLE_QUESTIONS = [
  'Why does Ekadashi date differ in my city?',
  'Does Japa Mala sync my counts when I am offline?',
  'How to enable Brahma Muhurta 4 AM notifications?',
  'Is my personal sadhana and Kundali chart private?',
];

export default function HelpClient() {
  const [activeTab, setActiveTab] = useState<'ask' | 'track'>('ask');

  // RAG Deflection state
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [deflectionResult, setDeflectionResult] = useState<DeflectionResult | null>(null);
  const [resolvedStatus, setResolvedStatus] = useState<'none' | 'resolved' | 'escalating'>('none');

  // Escalation ticket form state
  const [seekerName, setSeekerName] = useState('');
  const [seekerEmail, setSeekerEmail] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [createdTicketNumber, setCreatedTicketNumber] = useState<string | null>(null);

  // Ticket tracking state
  const [trackTicketNumber, setTrackTicketNumber] = useState('');
  const [trackEmail, setTrackEmail] = useState('');
  const [loadingTrack, setLoadingTrack] = useState(false);
  const [trackedTicket, setTrackedTicket] = useState<TrackedTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const handleDeflectionSearch = async (textToSearch?: string) => {
    const q = (textToSearch || query).trim();
    if (!q || q.length < 3) {
      toast.error('Please enter at least 3 characters to search');
      return;
    }
    setQuery(q);
    setSearching(true);
    setDeflectionResult(null);
    setResolvedStatus('none');
    setCreatedTicketNumber(null);

    try {
      const res = await fetch('/api/support/deflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          clientMetadata: {
            platform: 'web',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          },
        }),
      });

      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setDeflectionResult(data);
      if (data.requiresHumanEscalation) {
        setResolvedStatus('escalating');
      }
    } catch (err: any) {
      toast.error('Could not complete knowledge search. You can raise a ticket directly.');
      setResolvedStatus('escalating');
    } finally {
      setSearching(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !seekerEmail.trim() || !seekerName.trim()) {
      toast.error('Please fill in your name, email, and inquiry description');
      return;
    }

    setSubmittingTicket(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          seekerName: seekerName.trim(),
          seekerEmail: seekerEmail.trim(),
          category: deflectionResult?.suggestedCategory || 'general',
          ragResponse: deflectionResult?.answer,
          ragFeedback: resolvedStatus === 'escalating' ? 'unresolved' : 'skipped',
          clientMetadata: {
            platform: 'web',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to create ticket');
      }

      const data = await res.json();
      setCreatedTicketNumber(data.ticketNumber);
      toast.success(`Support Ticket #${data.ticketNumber} created successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Error submitting ticket');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleTrackTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackTicketNumber.trim() || !trackEmail.trim()) {
      toast.error('Please enter both your ticket reference number and email');
      return;
    }

    setLoadingTrack(true);
    setTrackedTicket(null);
    try {
      const res = await fetch(
        `/api/support/tickets/${encodeURIComponent(trackTicketNumber.trim())}?email=${encodeURIComponent(
          trackEmail.trim()
        )}`
      );
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Ticket not found or email does not match');
      }
      const data = await res.json();
      setTrackedTicket({
        ...data.ticket,
        messages: data.messages || [],
      });
    } catch (err: any) {
      toast.error(err.message || 'Could not locate ticket');
    } finally {
      setLoadingTrack(false);
    }
  };

  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackedTicket || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/support/tickets/${encodeURIComponent(trackedTicket.ticketNumber)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyText.trim(),
          email: trackEmail.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to post reply');
      }

      const data = await res.json();
      toast.success('Reply submitted to support team');
      setTrackedTicket((prev) =>
        prev
          ? {
              ...prev,
              status: data.ticketStatus || prev.status,
              messages: [...prev.messages, data.message],
            }
          : null
      );
      setReplyText('');
    } catch (err: any) {
      toast.error(err.message || 'Error posting reply');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
          <LifeBuoy size={14} />
          Devotee Care & Astrometric Support
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-wide">
          How can we support your spiritual journey?
        </h1>
        <p className="text-sm sm:text-base text-stone-300 max-w-2xl mx-auto">
          Instant answers grounded in classical Shastras and Shoonaya technology. If your inquiry requires personal assistance, our team is here for you.
        </p>

        {/* Tab Toggle */}
        <div className="inline-flex p-1 rounded-xl bg-stone-900 border border-white/10 mt-4">
          <button
            onClick={() => setActiveTab('ask')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'ask' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
            }`}
          >
            Ask a Question / Report Issue
          </button>
          <button
            onClick={() => setActiveTab('track')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'track' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
            }`}
          >
            <TicketIcon size={13} />
            Track Existing Ticket
          </button>
        </div>
      </div>

      {activeTab === 'ask' ? (
        <div className="space-y-6">
          {/* Conversational Search Input */}
          <div className="p-4 sm:p-6 rounded-3xl bg-stone-900/80 border border-white/10 shadow-xl space-y-4">
            <div className="relative">
              <textarea
                rows={3}
                placeholder="Describe your question or issue in detail (e.g. Panchang sunrise timing, Japa counter sync, account questions)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full p-4 rounded-2xl bg-black/50 border border-white/10 text-white placeholder-stone-500 text-sm focus:outline-none focus:border-amber-400 leading-relaxed"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-400">
                <span className="text-[11px] font-mono text-stone-500">Popular:</span>
                {SAMPLE_QUESTIONS.map((sq, i) => (
                  <button
                    key={i}
                    onClick={() => handleDeflectionSearch(sq)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 text-[11px] transition-colors"
                  >
                    {sq}
                  </button>
                ))}
              </div>

              <button
                disabled={searching || !query.trim()}
                onClick={() => handleDeflectionSearch()}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs shadow-lg transition-colors shrink-0"
              >
                <Sparkles size={14} className={searching ? 'animate-spin' : ''} />
                {searching ? 'Consulting Knowledge Base...' : 'Find Solution'}
              </button>
            </div>
          </div>

          {/* RAG First-Response Guidance Card */}
          {deflectionResult && (
            <div className="p-6 rounded-3xl bg-stone-900 border border-amber-500/30 shadow-2xl space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-sm">
                  <Sparkles size={16} />
                  Grounded Guidance from Shoonaya Knowledge Base
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-stone-300">
                  {deflectionResult.suggestedCategory.replace('_', ' ')}
                </span>
              </div>

              <div className="text-stone-200 text-sm leading-relaxed whitespace-pre-wrap">
                {deflectionResult.answer}
              </div>

              {deflectionResult.bulletPoints && deflectionResult.bulletPoints.length > 0 && (
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <div className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider">
                    Recommended Steps:
                  </div>
                  <ul className="space-y-1.5 text-xs text-stone-300 list-disc list-inside">
                    {deflectionResult.bulletPoints.map((bp, i) => (
                      <li key={i}>{bp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {deflectionResult.suggestedLinks && deflectionResult.suggestedLinks.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-stone-400">Quick Links:</span>
                  {deflectionResult.suggestedLinks.map((link, i) => (
                    <Link
                      key={i}
                      href={link.href}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors"
                    >
                      {link.label}
                      <ArrowRight size={12} />
                    </Link>
                  ))}
                </div>
              )}

              {/* Resolution Confirmation */}
              {resolvedStatus === 'none' && !deflectionResult.requiresHumanEscalation && (
                <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs text-stone-400">Did this resolve your question?</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setResolvedStatus('resolved');
                        toast.success('Dhanyavaad! We are glad this helped your practice.');
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors"
                    >
                      <CheckCircle size={14} />
                      Yes, problem solved!
                    </button>
                    <button
                      onClick={() => setResolvedStatus('escalating')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
                    >
                      <MessageSquare size={14} />
                      No, I still need help
                    </button>
                  </div>
                </div>
              )}

              {resolvedStatus === 'resolved' && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>Glad to assist! May your sadhana and contemplation flourish in peace.</span>
                </div>
              )}
            </div>
          )}

          {/* Ticket Creation / Escalation Form */}
          {resolvedStatus === 'escalating' && !createdTicketNumber && (
            <div className="p-6 rounded-3xl bg-stone-900 border border-white/15 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center gap-2 text-white font-serif font-bold text-base">
                <TicketIcon size={18} className="text-amber-400" />
                Connect with Support Team (Create Ticket)
              </div>
              <p className="text-xs text-stone-300">
                Our care team will review your diagnostic context and reply directly. Please provide your contact info.
              </p>

              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-stone-400 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Sharma"
                      value={seekerName}
                      onChange={(e) => setSeekerName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-stone-400 mb-1">Your Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. ramesh@example.com"
                      value={seekerEmail}
                      onChange={(e) => setSeekerEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-stone-400 mb-1">Inquiry Description</label>
                  <textarea
                    rows={3}
                    required
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submittingTicket}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs shadow-md transition-colors"
                  >
                    <Send size={13} />
                    {submittingTicket ? 'Submitting Ticket...' : 'Submit Support Ticket'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Ticket Created Confirmation */}
          {createdTicketNumber && (
            <div className="p-8 rounded-3xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto">
                <CheckCircle size={28} />
              </div>
              <h3 className="text-xl font-serif font-bold text-white">Support Ticket Created</h3>
              <div className="font-mono text-lg font-bold text-amber-300 bg-black/50 py-2 px-4 rounded-xl inline-block border border-amber-500/30">
                {createdTicketNumber}
              </div>
              <p className="text-xs text-stone-300 max-w-md mx-auto">
                We have received your ticket. A confirmation has been logged, and our team will review the issue. You can track this ticket anytime using your reference code.
              </p>
              <button
                onClick={() => {
                  setTrackTicketNumber(createdTicketNumber);
                  setTrackEmail(seekerEmail);
                  setActiveTab('track');
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/10 transition-colors inline-flex items-center gap-1.5"
              >
                Track Ticket Status
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Ticket Tracking Section */
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-stone-900 border border-white/10 shadow-xl space-y-4">
            <h2 className="text-base font-serif font-bold text-white">Track an Existing Support Ticket</h2>
            <form onSubmit={handleTrackTicket} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Ticket Reference (e.g. TKT-202611-ABCD)"
                value={trackTicketNumber}
                onChange={(e) => setTrackTicketNumber(e.target.value.toUpperCase())}
                className="px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
              />
              <input
                type="email"
                required
                placeholder="Email used when submitting"
                value={trackEmail}
                onChange={(e) => setTrackEmail(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={loadingTrack}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors"
              >
                <Search size={14} />
                {loadingTrack ? 'Locating...' : 'Check Status'}
              </button>
            </form>
          </div>

          {/* Tracked Ticket View */}
          {trackedTicket && (
            <div className="p-6 rounded-3xl bg-stone-900 border border-white/15 shadow-2xl space-y-5 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-300">{trackedTicket.ticketNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-stone-200">
                      {trackedTicket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-lg font-serif font-bold text-white mt-1">{trackedTicket.subject}</h3>
                </div>
                <div className="text-xs text-stone-400 font-mono">
                  Submitted {new Date(trackedTicket.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Message Thread */}
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider">
                  Conversation History:
                </div>
                {trackedTicket.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                      m.sender_type === 'admin'
                        ? 'bg-sky-950/30 border-sky-500/40 text-sky-100 ml-4'
                        : m.sender_type === 'system_agent'
                        ? 'bg-purple-950/30 border-purple-500/40 text-purple-100'
                        : 'bg-white/5 border-white/10 text-stone-200 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="font-bold text-white">
                        {m.sender_name} {m.sender_type === 'admin' && '(Shoonaya Care)'}
                      </span>
                      <span className="text-stone-400">{new Date(m.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">{m.message}</div>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendTicketReply} className="pt-4 border-t border-white/10 space-y-3">
                <textarea
                  rows={2}
                  required
                  placeholder="Type a reply to the support team..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs transition-colors"
                  >
                    <Send size={13} />
                    {sendingReply ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
