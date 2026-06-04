'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useThemePreference } from '@/components/providers/ThemeProvider';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scriptureSource: string;
  verseText: string;
}

export default function ScriptureCorrectionModal({ isOpen, onClose, scriptureSource, verseText }: Props) {
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';

  const [suggestedCorrection, setSuggestedCorrection] = useState('');
  const [reasonDetails, setReasonDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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

  // Theme styles
  const overlayBg = 'rgba(0, 0, 0, 0.4)';
  const modalBg = isDark ? '#1a0e08' : '#FAF6EF';
  const modalBorder = isDark ? '1px solid rgba(200, 146, 74, 0.25)' : '1px solid rgba(200, 160, 110, 0.35)';
  const textColor = isDark ? '#F5ECD7' : '#3E2A1F';
  const labelColor = isDark ? 'rgba(245, 236, 215, 0.45)' : 'rgba(62, 42, 31, 0.55)';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF';
  const inputBorder = isDark ? 'rgba(200, 146, 74, 0.15)' : 'rgba(200, 160, 110, 0.25)';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Container */}
          <motion.div
            className="relative z-10 w-full max-w-lg rounded-2xl overflow-hidden shadow-xl p-6"
            style={{
              background: modalBg,
              color: textColor,
              border: modalBorder,
            }}
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {success ? (
              /* Success State */
              <div className="text-center py-6">
                <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
                <h3
                  className="text-xl font-serif font-bold mb-2"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Report Received
                </h3>
                <p className="text-sm mb-6 leading-relaxed" style={{ color: labelColor }}>
                  Thank you — our scholars will review this suggested translation correction. 🙏
                </p>
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#C8924A' }}
                >
                  Close
                </button>
              </div>
            ) : (
              /* Form State */
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3
                  className="text-xl font-bold font-serif"
                  style={{ fontFamily: 'var(--font-serif)', color: textColor }}
                >
                  Report a Translation Issue
                </h3>

                {/* Read-Only Source */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: labelColor }}>
                    Scripture Source
                  </label>
                  <div
                    className="mt-1 px-3 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                  >
                    {scriptureSource}
                  </div>
                </div>

                {/* Read-Only Original Verse */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: labelColor }}>
                    Original Verse Text
                  </label>
                  <div
                    className="mt-1 px-3 py-2 rounded-xl text-xs italic leading-relaxed line-clamp-3 overflow-hidden"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      fontFamily: 'Georgia, serif',
                    }}
                  >
                    {verseText}
                  </div>
                </div>

                {/* Suggested Correction */}
                <div>
                  <label htmlFor="suggested-correction" className="text-[10px] font-bold uppercase tracking-wider flex justify-between" style={{ color: labelColor }}>
                    <span>Suggested Correction *</span>
                    <span className="text-[9px] lowercase italic font-normal text-amber-600 dark:text-amber-400">Required</span>
                  </label>
                  <textarea
                    id="suggested-correction"
                    required
                    value={suggestedCorrection}
                    onChange={(e) => setSuggestedCorrection(e.target.value)}
                    placeholder="Enter the correct translation or text..."
                    rows={3}
                    className="mt-1 w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#C8924A] transition-all"
                    style={{ background: inputBg, border: `1px solid ${inputBorder}` }}
                  />
                </div>

                {/* Reason / Reference */}
                <div>
                  <label htmlFor="reason-details" className="text-[10px] font-bold uppercase tracking-wider" style={{ color: labelColor }}>
                    Reason / Reference
                  </label>
                  <textarea
                    id="reason-details"
                    value={reasonDetails}
                    onChange={(e) => setReasonDetails(e.target.value)}
                    placeholder="e.g. Cross-referenced with Swami Gambhirananda translation"
                    rows={2}
                    className="mt-1 w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#C8924A] transition-all"
                    style={{ background: inputBg, border: `1px solid ${inputBorder}` }}
                  />
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="flex items-center gap-2 text-xs text-rose-500 font-semibold mt-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2.5 rounded-full text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#C8924A' }}
                  >
                    {loading && <Loader2 size={12} className="animate-spin" />}
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
