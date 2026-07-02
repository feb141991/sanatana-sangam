'use client';

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scriptureSource: string;
  verseText: string;
}

export default function ScriptureCorrectionModal({ isOpen, onClose, scriptureSource, verseText }: Props) {
  const [suggestedCorrection, setSuggestedCorrection] = useState('');
  const [reasonDetails, setReasonDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!suggestedCorrection.trim()) {
      setError('Suggested correction is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/scripture/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scripture_source: scriptureSource,
          verse_text_original: verseText,
          suggested_correction: suggestedCorrection,
          reason_details: reasonDetails || undefined,
        }),
      });

      if (res.status === 401) {
        setError('Sign in to submit corrections');
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit translation correction.');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'An error occurred while submitting.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuggestedCorrection('');
    setReasonDetails('');
    setSuccess(false);
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end sm:justify-center p-0 sm:p-4 overflow-x-hidden overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-sm mx-auto mt-auto sm:my-auto rounded-[24px] bg-white border border-[var(--premium-border)] shadow-[0_8px_40px_rgba(62,42,31,0.12)] p-6 z-[201]"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1 text-[var(--brand-muted)] hover:opacity-80 transition-opacity"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {success ? (
              /* Success State */
              <div className="text-center py-6 flex flex-col items-center gap-4">
                <div className="text-4xl">🙏</div>
                <p className="text-sm font-serif font-semibold text-[var(--brand-primary-strong)]">
                  Thank you — our scholars will review this.
                </p>
                <button
                  onClick={handleClose}
                  className="w-full bg-[var(--premium-gold)] text-white font-bold rounded-full py-3.5 hover:opacity-90 transition-opacity"
                >
                  Close
                </button>
              </div>
            ) : (
              /* Form State */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3 pr-8">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--premium-gold-soft)] text-xl shrink-0">
                    📜
                  </div>
                  <h3
                    className="text-[18px] font-bold text-[var(--brand-primary-strong)] leading-tight font-serif"
                    style={{ fontFamily: 'var(--font-serif), Playfair Display, serif' }}
                  >
                    Report a Translation Issue
                  </h3>
                </div>

                {/* Body Content */}
                <div className="space-y-3">
                  {/* Read-Only Source Chip */}
                  <div className="flex">
                    <span className="bg-[var(--premium-gold-soft)] border border-[var(--premium-border)] rounded-full px-3 py-1 text-xs font-semibold text-[var(--premium-gold)]">
                      {scriptureSource}
                    </span>
                  </div>

                  {/* Original Verse Preview */}
                  <div className="bg-[var(--premium-ivory)] border border-[var(--premium-border)] rounded-xl p-3 text-sm italic font-serif text-[var(--brand-muted)] line-clamp-3">
                    {verseText}
                  </div>

                  {/* Suggested Correction Textarea */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-[var(--brand-muted)]">
                      Your suggested correction *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={suggestedCorrection}
                      onChange={(e) => setSuggestedCorrection(e.target.value)}
                      placeholder="Enter the correct translation..."
                      className="w-full bg-white border border-[var(--premium-border)] focus:border-[var(--premium-gold)] rounded-xl p-3 text-sm outline-none resize-none transition-all"
                    />
                  </div>

                  {/* Reason Textarea */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-[var(--brand-muted)]">
                      Reference or reason
                    </label>
                    <textarea
                      rows={3}
                      value={reasonDetails}
                      onChange={(e) => setReasonDetails(e.target.value)}
                      placeholder="e.g. Cross-referenced with Swami Gambhirananda, Gita Press edition, verse 2.47"
                      className="w-full bg-white border border-[var(--premium-border)] focus:border-[var(--premium-gold)] rounded-xl p-3 text-sm outline-none resize-none transition-all"
                    />
                  </div>
                </div>

                {/* Inline Error Text */}
                {error && (
                  <div className="text-xs text-rose-500 font-semibold leading-relaxed">
                    {error}
                  </div>
                )}

                {/* Submit Footer */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[var(--premium-gold)] text-white font-bold rounded-full py-3.5 hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>Submit for Review 🙏</>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
