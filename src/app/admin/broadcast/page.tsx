"use client";

import { useState } from "react";
import {
  Megaphone, Shield, ArrowLeft,
  Send, Users, Smartphone,
  AlertTriangle, CheckCircle2, XCircle
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function OperationalBroadcast() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; inserted?: number; sent?: number; total?: number; error?: string } | null>(null);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setResult(null);
    setShowConfirm(true);
  };

  const handleExecuteSend = async () => {
    setSending(true);
    setShowConfirm(false);
    setResult(null);

    try {
      const response = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: message.trim() }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setResult({ success: false, error: payload.error ?? `HTTP ${response.status}` });
      } else {
        setResult({
          success: true,
          inserted: payload.inserted,
          sent: payload.sent,
          total: payload.total,
        });
        setTitle("");
        setMessage("");
      }
    } catch (err: any) {
      setResult({ success: false, error: err.message ?? "Network error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 font-outfit">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[rgba(197,160,89,0.15)] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-xl hover:bg-black/5 text-[var(--brand-muted)] transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                <Megaphone size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold font-serif theme-ink">Operational Broadcast</h1>
                <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-[0.2em] font-bold">In-App & Push Operations</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 text-[10px] font-bold uppercase tracking-widest">
            <Shield size={14} /> Authority Mode
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Form Area */}
          <div className="lg:col-span-7 space-y-8">
            <form onSubmit={handleOpenConfirm} className="glass-panel rounded-[2.5rem] border border-black/5 p-8 bg-white/40 space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-[var(--brand-muted)] uppercase tracking-widest px-2">Broadcast Scope</label>
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--premium-gold)] bg-[var(--premium-gold)]/10 text-[var(--brand-dark)]">
                  <Users size={18} />
                  <div>
                    <p className="text-xs font-bold">All Registered Devotees</p>
                    <p className="text-[10px] text-[var(--brand-muted)]">Sends in-app notification bell record + Expo push notification</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <label className="text-[10px] font-black text-[var(--brand-muted)] uppercase tracking-widest px-2">Operational Message</label>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Subject / Notification Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    disabled={sending}
                    className="w-full bg-white/50 border border-black/5 rounded-2xl px-6 py-4 text-sm font-bold placeholder:text-slate-400 outline-none focus:border-[var(--premium-gold)] transition-all"
                  />
                  <textarea
                    placeholder="Type the message body here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    disabled={sending}
                    className="w-full bg-white/50 border border-black/5 rounded-3xl px-6 py-4 text-sm font-medium placeholder:text-slate-400 outline-none focus:border-[var(--premium-gold)] transition-all resize-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={sending || !title.trim() || !message.trim()}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <Send size={18} /> Review & Confirm Broadcast
                </button>
              </div>
            </form>
          </div>

          {/* Preview & Info Area */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel rounded-[2.5rem] border border-black/5 p-8 bg-black/5 space-y-6">
              <h3 className="text-sm font-bold theme-ink flex items-center gap-2">
                <Smartphone size={18} /> Notification Preview
              </h3>
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-black/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white">
                    <Megaphone size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Shoonaya</p>
                    <p className="text-xs font-bold theme-ink">{title || "Notification Title"}</p>
                  </div>
                </div>
                <p className="text-xs text-[var(--brand-muted)] leading-relaxed line-clamp-4">
                  {message || "Your operational notification message will appear on seekers device screens and notifications bell."}
                </p>
              </div>
            </div>

            <div className="glass-panel rounded-[2.5rem] border border-orange-500/10 p-6 bg-orange-500/5 space-y-3">
              <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={14} /> Operational Guardrail
              </h3>
              <p className="text-[10px] text-orange-800 leading-relaxed font-medium">
                This is an operational broadcast system. It bypasses marketing campaign queues to deliver essential service announcements directly. For newsletters and festival outreach, use the Marketing Campaign Hub.
              </p>
            </div>

            {/* Results Display */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-6 rounded-[2rem] text-white flex items-center gap-4 shadow-xl ${result.success ? "bg-emerald-600 shadow-emerald-500/20" : "bg-rose-600 shadow-rose-500/20"}`}
                >
                  {result.success ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
                  <div>
                    <p className="text-sm font-bold">{result.success ? "Broadcast Dispatched" : "Broadcast Failed"}</p>
                    {result.success ? (
                      <p className="text-[10px] opacity-90 tracking-wide font-medium">
                        Inserted: {result.inserted} | Push Dispatched: {result.sent} of {result.total}
                      </p>
                    ) : (
                      <p className="text-[10px] opacity-90 tracking-wide font-medium">{result.error}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] p-8 max-w-md w-full space-y-6 shadow-2xl border border-black/10"
            >
              <div className="flex items-center gap-3 text-orange-600">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-bold">Confirm Operational Broadcast</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                You are about to send an operational push and in-app notification to all registered users. This action cannot be undone.
              </p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-800">{title}</p>
                <p className="text-slate-600 line-clamp-3">{message}</p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSend}
                  disabled={sending}
                  className="flex-1 py-3 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
                >
                  {sending ? "Sending..." : "Confirm & Send"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
