'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Shield, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { submitReport, type ReportType } from '@/lib/moderation';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reporterId: string;
  targetId: string;
  targetType: ReportType;
  targetName: string;
}

const REASONS = [
  'Inappropriate Content',
  'Hate Speech / Harassment',
  'Spam / Misleading',
  'Privacy Violation',
  'Other'
];

export default function ReportDialog({ isOpen, onClose, reporterId, targetId, targetType, targetName }: ReportDialogProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return toast.error('Please select a reason');
    
    setIsSubmitting(true);
    try {
      await submitReport(reporterId, targetId, targetType, reason, details);
      setIsDone(true);
      setTimeout(() => {
        onClose();
        setIsDone(false);
        setReason('');
        setDetails('');
      }, 2000);
    } catch (error) {
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[var(--divine-bg)] border border-[rgba(200,146,74,0.3)] rounded-3xl p-6 shadow-2xl overflow-hidden"
          >
            {isDone ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-serif theme-ink">Report Submitted</h3>
                <p className="text-sm text-[var(--text-muted-warm)] px-4">
                  Thank you for helping keep the Mandali safe. Our moderators will review this shortly.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif theme-ink">Report {targetType}</h3>
                      <p className="text-[10px] text-[var(--text-muted-warm)] uppercase tracking-widest font-bold">Target: {targetName}</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <X size={20} className="text-[var(--text-dim)]" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest">Reason</label>
                    <div className="grid grid-cols-1 gap-2">
                      {REASONS.map((r) => (
                        <button
                          key={r}
                          onClick={() => setReason(r)}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                            reason === r 
                              ? 'bg-[rgba(200,146,74,0.1)] border-[#C5A059] theme-ink' 
                              : 'bg-black/5 dark:bg-white/5 border-transparent text-[var(--text-muted-warm)] hover:border-black/10 dark:hover:border-white/10'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest">Details (Optional)</label>
                    <textarea
                      placeholder="Help us understand the issue..."
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      className="w-full h-24 bg-black/5 dark:bg-white/5 border border-transparent rounded-2xl p-4 text-sm theme-ink focus:border-[#C5A059]/30 outline-none resize-none"
                    />
                  </div>

                  <button
                    disabled={!reason || isSubmitting}
                    onClick={handleSubmit}
                    className="w-full py-4 rounded-2xl bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Submitting...' : <><Shield size={16} /> Submit Report</>}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
