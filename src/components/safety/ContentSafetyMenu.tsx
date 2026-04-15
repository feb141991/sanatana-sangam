'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { BellOff, EyeOff, Flag, MoreHorizontal, ShieldBan } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import {
  REPORT_REASON_OPTIONS,
  SAFETY_CONTENT_LABELS,
  type ReportReason,
  type SafetyContentType,
} from '@/lib/user-safety';

type Props = {
  userId: string;
  authorId: string;
  contentId: string;
  contentType: SafetyContentType;
  onHideContent?: (contentId: string) => void;
  onHideAuthor?: (authorId: string, mode: 'mute' | 'block') => void;
};

export default function ContentSafetyMenu({
  userId,
  authorId,
  contentId,
  contentType,
  onHideContent,
  onHideAuthor,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [showReportReasons, setShowReportReasons] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setShowReportReasons(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open]);

  if (!userId || !authorId || authorId === userId) return null;

  async function hideContent() {
    setPendingAction('hide');
    const { error } = await supabase
      .from('user_hidden_content')
      .upsert(
        {
          user_id: userId,
          content_type: contentType,
          content_id: contentId,
        },
        { onConflict: 'user_id,content_type,content_id', ignoreDuplicates: true }
      );

    setPendingAction(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`${SAFETY_CONTENT_LABELS[contentType]} hidden from your view.`);
    setOpen(false);
    setShowReportReasons(false);
    onHideContent?.(contentId);
  }

  async function muteAuthor() {
    setPendingAction('mute');
    const { error } = await supabase
      .from('user_muted_profiles')
      .upsert(
        {
          muter_id: userId,
          muted_user_id: authorId,
        },
        { onConflict: 'muter_id,muted_user_id', ignoreDuplicates: true }
      );

    setPendingAction(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('You will no longer see posts from this person.');
    setOpen(false);
    setShowReportReasons(false);
    onHideAuthor?.(authorId, 'mute');
  }

  async function blockAuthor() {
    setPendingAction('block');
    const { error } = await supabase
      .from('user_blocked_profiles')
      .upsert(
        {
          blocker_id: userId,
          blocked_user_id: authorId,
        },
        { onConflict: 'blocker_id,blocked_user_id', ignoreDuplicates: true }
      );

    setPendingAction(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('This person has been blocked from your Sangam view.');
    setOpen(false);
    setShowReportReasons(false);
    onHideAuthor?.(authorId, 'block');
  }

  async function reportContent(reason: ReportReason) {
    setPendingAction(`report:${reason}`);
    const { error } = await supabase
      .from('content_reports')
      .insert({
        reported_by: userId,
        content_type: contentType,
        content_id: contentId,
        reason,
      });

    setPendingAction(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Report submitted for review.');
    setOpen(false);
    setShowReportReasons(false);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((current) => !current);
          setShowReportReasons(false);
        }}
        className="w-8 h-8 rounded-full transition flex items-center justify-center text-[color:var(--brand-muted)] hover:text-[color:var(--brand-ink)] hover:bg-white/10"
        aria-label="Open safety options"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-10 z-[200] w-64 rounded-2xl shadow-2xl p-2"
          style={{
            background: 'rgba(36,33,28,0.97)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(212,166,70,0.18)',
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          {!showReportReasons ? (
            <div className="space-y-0.5">
              <button
                onClick={hideContent}
                disabled={pendingAction !== null}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[color:var(--brand-ink)] hover:bg-white/8 transition disabled:opacity-60"
              >
                <EyeOff size={15} style={{ color: 'var(--brand-primary)' }} />
                Hide this {SAFETY_CONTENT_LABELS[contentType].toLowerCase()}
              </button>
              <button
                onClick={muteAuthor}
                disabled={pendingAction !== null}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[color:var(--brand-ink)] hover:bg-white/8 transition disabled:opacity-60"
              >
                <BellOff size={15} style={{ color: 'var(--brand-primary)' }} />
                Mute this person
              </button>
              <button
                onClick={blockAuthor}
                disabled={pendingAction !== null}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[color:var(--brand-ink)] hover:bg-white/8 transition disabled:opacity-60"
              >
                <ShieldBan size={15} className="text-red-400" />
                Block this person
              </button>
              <div className="h-px bg-white/8 mx-2 my-1" />
              <button
                onClick={() => setShowReportReasons(true)}
                disabled={pendingAction !== null}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[color:var(--brand-muted)] hover:bg-white/8 transition disabled:opacity-60"
              >
                <Flag size={15} className="text-amber-400" />
                Report to moderators
              </button>
            </div>
          ) : (
            <div className="space-y-0.5">
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-[color:var(--brand-ink)]">Why are you reporting this?</p>
                <p className="text-xs text-[color:var(--brand-muted)] mt-1">Pick the closest reason. You can still hide or block separately.</p>
              </div>
              {REPORT_REASON_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => reportContent(option.value)}
                  disabled={pendingAction !== null}
                  className="w-full text-left rounded-xl px-3 py-2.5 text-sm text-[color:var(--brand-ink)] hover:bg-white/8 transition disabled:opacity-60"
                >
                  {option.label}
                </button>
              ))}
              <div className="h-px bg-white/8 mx-2 my-1" />
              <button
                onClick={() => setShowReportReasons(false)}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-[color:var(--brand-muted)] hover:bg-white/8 transition"
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
