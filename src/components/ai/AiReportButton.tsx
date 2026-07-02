'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Flag } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { AI_REPORT_REASON_OPTIONS, type AiReportReason } from '@/lib/user-safety';

interface Props {
  userId:      string;
  messageId:   string;
  aiText:      string;
  userPrompt?: string;
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export default function AiReportButton({ userId, messageId, aiText, userPrompt }: Props) {
  const [open,        setOpen]        = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [hidden,      setHidden]      = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase    = useMemo(() => createClient(), []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Hide permanently after success
  useEffect(() => {
    if (submitState !== 'success') return;
    const timer = setTimeout(() => setHidden(true), 2500);
    return () => clearTimeout(timer);
  }, [submitState]);

  if (hidden) return null;

  async function selectReason(reason: AiReportReason) {
    setOpen(false);
    setSubmitState('submitting');

    const { error } = await supabase.from('content_reports').insert({
      reported_by:        userId,
      content_author_id:  '',
      content_type:       'ai_chat_response',
      content_id:         messageId,
      reason,
      status:             'pending',
      metadata: {
        ai_text:     aiText.slice(0, 2000),
        user_prompt: (userPrompt ?? '').slice(0, 500),
      },
    });

    setSubmitState(error ? 'error' : 'success');
  }

  if (submitState === 'success') {
    return (
      <p className="text-[10px] mt-0.5 px-1" style={{ color: 'var(--text-dim)' }}>
        Thanks &mdash; this helps us improve Dharma Mitra.
      </p>
    );
  }

  if (submitState === 'error') {
    return (
      <p className="text-[10px] mt-0.5 px-1" style={{ color: 'var(--text-dim)' }}>
        Couldn&apos;t send report — please try again.
      </p>
    );
  }

  return (
    <div ref={dropdownRef} className="relative inline-flex mt-0.5">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={submitState === 'submitting'}
        aria-label="Report AI response"
        title="Report this response"
        className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg transition-opacity disabled:opacity-30"
        style={{
          opacity:          0.4,
          color:            'var(--text-dim)',
          background:       'transparent',
          border:           'none',
          cursor:           'pointer',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.4'; }}
      >
        <Flag size={12} />
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 mb-1 z-50 rounded-2xl shadow-lg overflow-hidden"
          style={{
            background:  'var(--card-bg)',
            border:      '1px solid var(--card-border)',
            minWidth:    '180px',
          }}
        >
          <p
            className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--text-dim)' }}
          >
            Report reason
          </p>
          {AI_REPORT_REASON_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => selectReason(opt.value)}
              className="w-full text-left px-3 py-2 text-xs transition-colors"
              style={{ color: 'var(--brand-muted)', background: 'transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-soft)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              {opt.label}
            </button>
          ))}
          <div className="h-2" />
        </div>
      )}
    </div>
  );
}
