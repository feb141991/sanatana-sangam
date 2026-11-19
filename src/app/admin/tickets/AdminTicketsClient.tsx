'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import {
  LifeBuoy,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  MessageSquare,
  Send,
  User,
  Shield,
  Smartphone,
  MapPin,
  ExternalLink,
  RefreshCw,
  X,
  FileText,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Ticket {
  id: string;
  ticket_number: string;
  seeker_name: string;
  seeker_email: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_on_seeker' | 'resolved' | 'closed';
  subject: string;
  description: string;
  rag_deflection_attempted: boolean;
  rag_solution_offered?: string;
  rag_deflection_feedback?: string;
  client_metadata?: any;
  assigned_admin?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_type: 'seeker' | 'admin' | 'system_agent';
  sender_name: string;
  message: string;
  is_internal_note: boolean;
  created_at: string;
}

interface TicketStats {
  total: number;
  open: number;
  urgent: number;
  waitingOnSeeker: number;
  resolved: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  calendar_panchang: 'Calendar & Panchang',
  sadhana_japa: 'Japa & Practice',
  account_auth: 'Account & Security',
  app_bug: 'App Bug / Crash',
  spiritual_content: 'Spiritual Content',
  billing_donation: 'Billing & Donation',
  general: 'General Help',
};

const CANNED_RESPONSES = [
  {
    title: 'Panchang Astrometry',
    text: 'Namaste. Shoonaya calculates observances according to high-precision astronomical algorithms (Drigganita). An observance date depends on the exact sunrise time at your specific city latitude and longitude. Please verify that your city is accurately set under Settings -> Location.',
  },
  {
    title: 'App Cache Refresh',
    text: 'Namaste. To clear older cached data, please force-refresh the app: on Android, go to App Info -> Storage & Cache -> Clear Cache (not Clear Storage). On desktop web, press Cmd+Shift+R or Ctrl+Shift+R.',
  },
  {
    title: 'Brahma Muhurta Notifications',
    text: 'Namaste. Brahma Muhurta reminders require separate consent from general notifications. Please check Settings -> Notifications -> Brahma Muhurta Reminders and ensure battery-saver mode does not suppress early morning alarms.',
  },
];

export default function AdminTicketsClient() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats>({ total: 0, open: 0, urgent: 0, waitingOnSeeker: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [replyStatusUpdate, setReplyStatusUpdate] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [, startTransition] = useTransition();

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/tickets?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load tickets');
      const data = await res.json();
      setTickets(data.tickets || []);
      if (data.stats) setStats(data.stats);
    } catch (err: any) {
      toast.error(err.message || 'Error loading tickets');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const loadTicketDetails = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}`);
      if (!res.ok) throw new Error('Failed to load ticket details');
      const data = await res.json();
      setSelectedTicket(data.ticket);
      setMessages(data.messages || []);
    } catch (err: any) {
      toast.error(err.message || 'Error loading thread');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Status update failed');
      const data = await res.json();
      toast.success(`Ticket marked as ${newStatus.replace('_', ' ')}`);
      setSelectedTicket(data.ticket);
      startTransition(() => {
        fetchTickets();
      });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyText.trim(),
          isInternalNote,
          updateStatus: replyStatusUpdate || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to send response');
      const data = await res.json();
      toast.success(isInternalNote ? 'Internal note added' : 'Reply sent to seeker');
      setMessages((prev) => [...prev, data.message]);
      if (data.ticket) setSelectedTicket(data.ticket);
      setReplyText('');
      setReplyStatusUpdate('');
      startTransition(() => {
        fetchTickets();
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-stone-500/20 text-stone-300 border-stone-500/40';
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'open':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'in_progress':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'waiting_on_seeker':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'resolved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'closed':
        return 'bg-stone-600/30 text-stone-400 border-stone-600/40';
      default:
        return 'bg-stone-500/20 text-stone-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <LifeBuoy size={22} />
            </div>
            <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
              Support Tickets & Devotee Desk
            </h1>
          </div>
          <p className="text-sm text-white/60 mt-1">
            Grounded RAG first-response queue, devotee inquiries, and operational escalations.
          </p>
        </div>
        <button
          onClick={fetchTickets}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Queue
        </button>
      </div>

      {/* Vital Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-xs text-white/50 font-medium uppercase tracking-wider">Total Tickets</div>
          <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
        </div>
        <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20">
          <div className="text-xs text-sky-400 font-medium uppercase tracking-wider">Open Queue</div>
          <div className="text-2xl font-bold text-sky-300 mt-1">{stats.open}</div>
        </div>
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
          <div className="text-xs text-red-400 font-medium uppercase tracking-wider">Urgent / High</div>
          <div className="text-2xl font-bold text-red-300 mt-1">{stats.urgent}</div>
        </div>
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <div className="text-xs text-amber-400 font-medium uppercase tracking-wider">Awaiting Seeker</div>
          <div className="text-2xl font-bold text-amber-300 mt-1">{stats.waitingOnSeeker}</div>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Resolved</div>
          <div className="text-2xl font-bold text-emerald-300 mt-1">{stats.resolved}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search ticket #, email, seeker name, keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/40 text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_on_seeker">Waiting on Seeker</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Tickets List Table */}
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-white/50 uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Seeker</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">RAG Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-white/40">
                    Loading support tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-white/40">
                    No support tickets match the selected filters.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => loadTicketDetails(t)}
                    className="hover:bg-white/[0.04] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-amber-300">
                      {t.ticket_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{t.seeker_name}</div>
                      <div className="text-[11px] text-white/50">{t.seeker_email}</div>
                    </td>
                    <td className="py-3 px-4 text-white/80">
                      {CATEGORY_LABELS[t.category] || t.category}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase ${getPriorityBadge(t.priority)}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase ${getStatusBadge(t.status)}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {t.rag_deflection_attempted ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          RAG Attempted
                        </span>
                      ) : (
                        <span className="text-white/40 text-[10px]">Direct</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-white/50">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadTicketDetails(t);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details & Resolution Drawer */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-stone-900 border-l border-white/15 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-300">{selectedTicket.ticket_number}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getStatusBadge(selectedTicket.status)}`}>
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getPriorityBadge(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
                <h2 className="text-base font-serif font-bold text-white mt-1">{selectedTicket.subject}</h2>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Devotee Info Strip */}
            <div className="px-4 py-2.5 bg-black/40 border-b border-white/10 text-xs flex flex-wrap items-center gap-4 text-white/70">
              <div className="flex items-center gap-1.5">
                <User size={13} className="text-amber-400" />
                <span className="text-white font-medium">{selectedTicket.seeker_name}</span>
                <span className="text-white/40">({selectedTicket.seeker_email})</span>
              </div>
              {selectedTicket.client_metadata?.platform && (
                <div className="flex items-center gap-1">
                  <Smartphone size={13} className="text-white/40" />
                  <span className="capitalize">{selectedTicket.client_metadata.platform}</span>
                </div>
              )}
              {selectedTicket.client_metadata?.city && (
                <div className="flex items-center gap-1">
                  <MapPin size={13} className="text-white/40" />
                  <span>{selectedTicket.client_metadata.city}</span>
                </div>
              )}
            </div>

            {/* Quick Status Control Bar */}
            <div className="px-4 py-2 border-b border-white/10 bg-white/[0.02] flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-white/50 text-[11px] font-mono">Transition:</span>
              <button
                onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                className="px-2 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-medium text-[11px] border border-purple-500/30"
              >
                Mark In Progress
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedTicket.id, 'waiting_on_seeker')}
                className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-[11px] border border-amber-500/30"
              >
                Waiting on Seeker
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-medium text-[11px] border border-emerald-500/30"
              >
                Mark Resolved
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')}
                className="px-2 py-1 rounded bg-stone-700/50 hover:bg-stone-700 text-stone-300 font-medium text-[11px] border border-stone-600/40"
              >
                Close Ticket
              </button>
            </div>

            {/* Conversation Timeline */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="text-center py-8 text-white/40 text-xs">Loading message thread...</div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                      m.is_internal_note
                        ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                        : m.sender_type === 'admin'
                        ? 'bg-sky-950/30 border-sky-500/40 text-sky-100 ml-4'
                        : m.sender_type === 'system_agent'
                        ? 'bg-purple-950/30 border-purple-500/40 text-purple-100'
                        : 'bg-white/5 border-white/10 text-white/90 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <div className="flex items-center gap-1.5">
                        {m.is_internal_note && <Lock size={12} className="text-amber-400" />}
                        <span className="font-bold">
                          {m.sender_name} {m.is_internal_note && '(Internal Note)'}
                        </span>
                      </div>
                      <span className="text-white/40">{new Date(m.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">{m.message}</div>
                  </div>
                ))
              )}
            </div>

            {/* Canned Responses */}
            <div className="p-2 border-t border-white/10 bg-black/40 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-white/40 shrink-0 px-2 font-mono text-[10px]">Templates:</span>
              {CANNED_RESPONSES.map((cr, idx) => (
                <button
                  key={idx}
                  onClick={() => setReplyText(cr.text)}
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/80 shrink-0 text-[10px] transition-colors"
                >
                  {cr.title}
                </button>
              ))}
            </div>

            {/* Reply Composer */}
            <div className="p-4 border-t border-white/15 bg-black/60 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsInternalNote(false)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      !isInternalNote ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-white/50 hover:text-white'
                    }`}
                  >
                    Reply to Seeker
                  </button>
                  <button
                    onClick={() => setIsInternalNote(true)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                      isInternalNote ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-white/50 hover:text-white'
                    }`}
                  >
                    <Lock size={12} />
                    Internal Note
                  </button>
                </div>

                {!isInternalNote && (
                  <select
                    value={replyStatusUpdate}
                    onChange={(e) => setReplyStatusUpdate(e.target.value)}
                    className="px-2 py-1 rounded bg-black/40 border border-white/15 text-white/80 text-[11px]"
                  >
                    <option value="">Status: In Progress</option>
                    <option value="waiting_on_seeker">Set: Waiting on Seeker</option>
                    <option value="resolved">Set: Resolved</option>
                  </select>
                )}
              </div>

              <textarea
                rows={3}
                placeholder={
                  isInternalNote
                    ? 'Write private note for other administrators (never sent to seeker)...'
                    : 'Compose respectful response to the seeker...'
                }
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/50 border border-white/15 text-white placeholder-white/40 text-xs focus:outline-none focus:border-amber-400"
              />

              <div className="flex justify-end">
                <button
                  disabled={!replyText.trim() || submittingReply}
                  onClick={handleSendReply}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs shadow-md transition-colors"
                >
                  <Send size={13} />
                  {submittingReply ? 'Sending...' : isInternalNote ? 'Save Note' : 'Send Response'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
