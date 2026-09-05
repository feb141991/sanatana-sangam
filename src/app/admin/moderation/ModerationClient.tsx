'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { AdminRecordInspector } from "@/components/admin/AdminRecordInspector";
import type { ContentReportRecord } from "@/lib/admin-inspector-types";
import { useSearchParams, usePathname } from 'next/navigation';
import {
  parseAdminStringParam,
  parseModerationFilter,
  buildAdminUrlWithParams,
  type ModerationFilter,
  MODERATION_FILTERS,
} from "@/lib/admin-url-state";
import Image from 'next/image';
import { 
  ShieldAlert, ShieldCheck, Trash2, 
  UserMinus, AlertCircle, CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import { getStaggerDelayStyle, useReducedMotion } from '@/lib/admin-accessibility';

interface Report {
  id: string;
  reported_by: string;
  content_author_id: string;
  content_type: string;
  content_id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  author: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export default function ModerationClient({ initialReports }: { initialReports: Report[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  const targetReportId = parseAdminStringParam(searchParams, "reportId") || parseAdminStringParam(searchParams, "report");
  const initialFilter = parseModerationFilter(searchParams, "all");
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [filter, setFilter] = useState<ModerationFilter>(initialFilter);

  useEffect(() => {
    const nextFilter = parseModerationFilter(searchParams, "all");
    setFilter(nextFilter);
  }, [searchParams]);

  const inspectedReport: ContentReportRecord | null = useMemo(() => {
    if (!targetReportId) return null;
    const match = reports.find((r) => r.id === targetReportId);
    if (!match) return null;
    return {
      type: "content_report",
      id: match.id,
      contentType: match.content_type,
      contentId: match.content_id,
      reason: match.reason,
      status: match.status as any,
      reportedBy: match.reported_by,
      reporterUsername: match.reporter?.username,
      contentAuthorId: match.content_author_id,
      authorUsername: match.author?.username,
      createdAt: match.created_at,
      metadata: {
        reason: match.reason,
      },
    };
  }, [targetReportId, reports]);

  const handleFilterChange = (f: ModerationFilter) => {
    setFilter(f);
    const newUrl = buildAdminUrlWithParams(pathname || "/admin/moderation", searchParams, {
      filter: f === "all" ? null : f,
      status: null,
    });
    window.history.replaceState(null, "", newUrl);
  };

  const handleAction = async (report: Report, action: 'resolve' | 'dismiss' | 'delete' | 'ban') => {
    try {
      if (action === 'ban') {
        const res = await fetch(`/api/admin/users/${report.content_author_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isBanned: true,
            banReason: `Reported content: ${report.reason}`,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || 'Failed to ban user');
        }
        toast.success('User has been banned from Shoonaya');
      }

      const status = action === 'dismiss' ? 'dismissed' : action === 'resolve' ? 'reviewed' : 'actioned';

      const reportRes = await fetch(`/api/admin/reports/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          removeContent: action === 'delete',
          contentType: report.content_type,
          contentId: report.content_id,
        }),
      });
      if (!reportRes.ok) {
        const body = await reportRes.json().catch(() => null);
        throw new Error(body?.error || 'Failed to update report');
      }
      if (action === 'delete') {
        toast.success('Content permanently removed');
      }

      setReports(prev => prev.filter(r => r.id !== report.id));
      if (action !== 'delete' && action !== 'ban') {
        toast.success(`Report ${action}d successfully`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Action failed');
    }
  };

  const filteredReports = reports.filter(r => 
    filter === 'all' ? true : r.status === filter
  );

  return (
    <div className="min-h-screen bg-[var(--divine-bg,#FAF6EF)] pb-24 font-outfit">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[var(--divine-bg,#FAF6EF)]/90 backdrop-blur-xl border-b border-[rgba(197,160,89,0.15)] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 rounded-xl hover:bg-black/5 text-[var(--brand-muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
              <ArrowLeft size={20} />
            </Link>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif theme-ink">Moderation Hub</h1>
              <p className="text-[10px] text-[var(--text-muted-warm)] uppercase tracking-wider font-bold">Admin Resolution Queue</p>
            </div>
          </div>
          <div className="flex bg-black/[0.04] rounded-full p-1 border border-black/5">
            {MODERATION_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  filter === f ? 'bg-amber-800 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {targetReportId && !reports.some((r) => r.id === targetReportId) && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-700 shrink-0" />
              <span>Target report <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded font-bold">{targetReportId}</code> was not found in the loaded moderation queue.</span>
            </div>
          </div>
        )}
        {filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-3 bg-white rounded-2xl border border-black/5 p-8">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold theme-ink">Queue Clear</h3>
              <p className="text-xs text-[var(--text-muted-warm)] mt-0.5">No pending reports for review under [{filter}].</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report, idx) => (
              <div
                key={report.id}
                style={getStaggerDelayStyle(idx, 240, prefersReducedMotion)}
                className={`group relative overflow-hidden bg-white border rounded-2xl p-5 transition-colors animate-in fade-in slide-in-from-bottom-1 duration-150 motion-reduce:animate-none ${
                  report.id === targetReportId
                    ? "border-amber-500 ring-2 ring-amber-500/30 shadow-sm bg-amber-50/10"
                    : "border-black/5 hover:border-black/15 shadow-2xs"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Reporter & Author Info */}
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-[9px] font-bold text-amber-800 uppercase tracking-wider">Reporter</p>
                      <div className="relative w-9 h-9 rounded-full overflow-hidden border border-black/10 bg-black/5">
                        {report.reporter.avatar_url ? (
                          <Image src={report.reporter.avatar_url} alt="Reporter" fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold theme-ink">
                            {getInitials(report.reporter.full_name || report.reporter.username)}
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] font-bold theme-ink">@{report.reporter.username}</p>
                    </div>

                    <div className="h-8 w-px bg-black/10" />

                    <div className="flex flex-col items-center gap-1">
                      <p className="text-[9px] font-bold text-rose-600 uppercase tracking-wider">Author</p>
                      <div className="relative w-9 h-9 rounded-full overflow-hidden border border-rose-200 bg-rose-50">
                        {report.author.avatar_url ? (
                          <Image src={report.author.avatar_url} alt="Author" fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-rose-700">
                            {getInitials(report.author.full_name || report.author.username)}
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-rose-700">@{report.author.username}</p>
                    </div>
                  </div>

                  {/* Content & Reason */}
                  <div className="flex-1 min-w-[200px] space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${report.content_type === 'account_deletion' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-black/5 theme-ink'}`}>
                        {report.content_type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted-warm)] font-mono">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={`p-3 rounded-xl border text-xs ${report.content_type === 'account_deletion' ? 'bg-rose-50/50 border-rose-200' : 'bg-amber-50/40 border-amber-200/60'}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${report.content_type === 'account_deletion' ? 'text-rose-700' : 'text-amber-900'}`}>
                        {report.content_type === 'account_deletion' ? 'Action Required' : `Reason: ${report.reason}`}
                      </p>
                      <p className="text-gray-700 italic">
                        {report.content_type === 'account_deletion' 
                          ? 'Seeker has requested account deletion. Cool-off period (30 days) is active.'
                          : `"${report.reason}" · Content ID: ${report.content_id.slice(0, 8)}...`}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-center sm:self-start">
                    <button 
                      onClick={() => handleAction(report, 'dismiss')}
                      className="p-2.5 rounded-xl bg-black/5 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      title="Dismiss Report"
                      aria-label="Dismiss report"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button 
                      onClick={() => handleAction(report, 'delete')}
                      className="p-2.5 rounded-xl bg-black/5 text-gray-600 hover:bg-rose-50 hover:text-rose-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      title="Remove Content"
                      aria-label="Remove reported content"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleAction(report, 'ban')}
                      className="p-2.5 rounded-xl bg-black/5 text-gray-600 hover:bg-rose-100 hover:text-rose-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      title="Ban Author"
                      aria-label="Ban content author"
                    >
                      <UserMinus size={18} />
                    </button>
                    <button 
                      onClick={() => handleAction(report, 'resolve')}
                      className="p-2.5 rounded-xl bg-amber-800 text-white shadow-sm hover:bg-amber-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      title="Mark Resolved"
                      aria-label="Mark report reviewed and resolved"
                    >
                      <ShieldCheck size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AdminRecordInspector
        record={inspectedReport}
        isOpen={Boolean(targetReportId && inspectedReport)}
        onClose={() => {
          const newUrl = buildAdminUrlWithParams(pathname || "/admin/moderation", searchParams, {
            reportId: null,
            report: null,
          });
          window.history.replaceState(null, "", newUrl);
        }}
        onActionComplete={(rec) => {
          setReports((prev) => prev.filter((r) => r.id !== (rec as ContentReportRecord).id));
        }}
      />
    </div>
  );
}
