'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell, ArrowLeft, Search, RefreshCw, CheckCircle, AlertTriangle,
  Sparkles, Layers, Send, Copy, Check, RotateCcw, Smartphone,
  Clock, Globe, ChevronRight
} from 'lucide-react';
import type { NotificationTemplateItem } from '@/lib/notification-templates';

const CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: Layers },
  { id: 'daily_routine', label: '🌅 Daily Routine', icon: Clock },
  { id: 'sadhana', label: '📿 Sadhana & Practice', icon: Sparkles },
  { id: 'aarti', label: '🪔 Temples & Aarti', icon: Bell },
  { id: 'calendar', label: '🌿 Vrats & Festivals', icon: Globe },
];

const TRADITIONS = [
  { id: 'all', label: 'All Traditions' },
  { id: 'hindu', label: 'Hindu' },
  { id: 'sikh', label: 'Sikh' },
  { id: 'buddhist', label: 'Buddhist' },
  { id: 'jain', label: 'Jain' },
];

export default function NotificationTemplatesAdminPage() {
  const [templates, setTemplates] = useState<NotificationTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTradition, setSelectedTradition] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftActive, setDraftActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/notification-templates');
      if (!res.ok) throw new Error('Failed to fetch templates');
      const data = await res.json();
      setTemplates(data.templates || []);
      if (data.templates?.length > 0) {
        setEditingId((prev) => prev || data.templates[0].id);
        const current = data.templates.find((t: any) => t.id === editingId) || data.templates[0];
        setDraftTitle(current.titleTemplate);
        setDraftBody(current.bodyTemplate);
        setDraftActive(current.isActive);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Could not load templates' });
    } finally {
      setLoading(false);
    }
  }, [editingId]);

  useEffect(() => {
    void fetchTemplates();
  }, []);

  const activeTemplate = useMemo(() => {
    return templates.find((t) => t.id === editingId) || templates[0] || null;
  }, [templates, editingId]);

  const selectTemplate = (item: NotificationTemplateItem) => {
    setEditingId(item.id);
    setDraftTitle(item.titleTemplate);
    setDraftBody(item.bodyTemplate);
    setDraftActive(item.isActive);
    setFeedback(null);
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.routine.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesTradition = selectedTradition === 'all' || item.tradition === selectedTradition;

      return matchesSearch && matchesCategory && matchesTradition;
    });
  }, [templates, searchQuery, selectedCategory, selectedTradition]);

  // Live Simulated Preview Values
  const sampleData: Record<string, string> = useMemo(() => ({
    userName: 'Sadhak',
    streak: '14',
    vratName: 'Nirjala Ekadashi',
    paranaWindow: '05:42 AM – 08:15 AM',
    festivalName: 'Diwali',
    templeShort: 'Kashi Vishwanath',
    aartiTime: '4:00 AM',
    symbol: '🕉️',
    sacredTextLabel: 'Bhagavad Gita',
    shlokaWord: 'shloka',
    streakMessage: "Don't break your 14-day streak! 🔥",
    tithiSuffix: ' Today is Shukla Ekadashi — auspicious for sadhana.',
    tithi: 'Shukla Ekadashi',
    emoji: '🌿',
    dayNumber: '5',
    dayTitle: 'The 3 Gunas of Nature',
    aiEncouragement: 'You have walked half the path of your 21-day Sankalpa. Let your abhyasa remain steadfast 🙏',
  }), []);

  const renderPreview = (templateStr: string) => {
    if (!templateStr) return '';
    return templateStr.replace(/\{\{\s*(\w+)\s*\}\}|\{\s*(\w+)\s*\}/g, (_, k1, k2) => {
      const k = k1 || k2;
      return sampleData[k] || '{' + k + '}';
    });
  };

  const handleInsertPlaceholder = (placeholderKey: string, field: 'title' | 'body') => {
    const tag = '{{' + placeholderKey + '}}';
    if (field === 'title') {
      setDraftTitle((prev) => (prev ? prev + ' ' + tag : tag));
    } else {
      setDraftBody((prev) => (prev ? prev + ' ' + tag : tag));
    }
    setCopiedKey(placeholderKey);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleSave = async () => {
    if (!activeTemplate) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/notification-templates', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: activeTemplate.id,
          titleTemplate: draftTitle,
          bodyTemplate: draftBody,
          isActive: draftActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      setTemplates((prev) =>
        prev.map((t) =>
          t.id === activeTemplate.id
            ? { ...t, titleTemplate: draftTitle, bodyTemplate: draftBody, isActive: draftActive }
            : t
        )
      );
      setFeedback({ type: 'success', message: 'Template updated successfully! Live across all cron dispatchers.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save template' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!activeTemplate) return;
    if (!confirm('Are you sure you want to reset this notification to the default system text?')) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/notification-templates', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: activeTemplate.id,
          resetToDefault: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');

      setDraftTitle(activeTemplate.defaultTitle);
      setDraftBody(activeTemplate.defaultBody);
      setDraftActive(true);
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === activeTemplate.id
            ? {
                ...t,
                titleTemplate: activeTemplate.defaultTitle,
                bodyTemplate: activeTemplate.defaultBody,
                isActive: true,
              }
            : t
        )
      );
      setFeedback({ type: 'success', message: 'Reset to default copy successfully.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Reset failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestPush = async () => {
    if (!activeTemplate) return;
    setTesting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/notification-templates/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          titleTemplate: draftTitle,
          bodyTemplate: draftBody,
          sampleVars: sampleData,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch test push');

      setFeedback({
        type: 'success',
        message: 'Test push dispatched to ' + data.sentToUsers + ' admin device(s)! Check your phone.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Test push failed' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--divine-bg,#FAF6EF)] pb-20 font-sans text-gray-900">
      {/* ─── STICKY HEADER ─────────────────────────────────────────────────── */}
      <div className="sticky top-14 z-40 bg-[var(--divine-bg,#FAF6EF)]/95 backdrop-blur-md border-b border-[rgba(197,160,89,0.2)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl border border-black/10 hover:bg-black/5 text-gray-600 transition-colors"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-serif text-gray-900 flex items-center gap-2">
                  <Bell className="text-amber-600" size={20} />
                  Notification Studio & Copy Editor
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                  Live Overrides
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Manage, edit and test notification titles, bodies, and placeholders in real time without code releases.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void fetchTemplates()}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition-all shadow-sm"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-amber-600' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Feedback Alert */}
        {feedback && (
          <div
            className={
              'p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-sm ' +
              (feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900')
            }
          >
            <div className="flex items-center gap-2 font-medium">
              {feedback.type === 'success' ? (
                <CheckCircle size={16} className="text-emerald-600" />
              ) : (
                <AlertTriangle size={16} className="text-rose-600" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold underline opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ─── FILTERS & SEARCH ────────────────────────────────────────────── */}
        <div className="p-4 rounded-2xl bg-white border border-[rgba(197,160,89,0.2)] shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates by routine, name or keyword..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>

            {/* Tradition Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">Tradition:</span>
              {TRADITIONS.map((tr) => (
                <button
                  key={tr.id}
                  onClick={() => setSelectedTradition(tr.id)}
                  className={
                    'px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ' +
                    (selectedTradition === tr.id
                      ? 'bg-amber-800 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                  }
                >
                  {tr.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 border-t border-gray-100 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ' +
                    (isActive
                      ? 'bg-amber-500/15 text-amber-900 border border-amber-500/30'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-black/5')
                  }
                >
                  <Icon size={14} className={isActive ? 'text-amber-700' : 'text-gray-400'} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── MAIN TWO-COLUMN WORKSPACE ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Template List (5 Cols) */}
          <div className="lg:col-span-5 rounded-2xl bg-white border border-[rgba(197,160,89,0.2)] shadow-sm overflow-hidden flex flex-col max-h-[820px]">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs font-bold text-gray-600">
              <span>Notification Routines ({filteredTemplates.length})</span>
              <span className="text-[10px] text-gray-400 font-normal">Click to edit</span>
            </div>

            <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
              {filteredTemplates.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  No notification routines match your criteria.
                </div>
              ) : (
                filteredTemplates.map((item) => {
                  const isSelected = item.id === editingId;
                  const isCustomized =
                    item.titleTemplate !== item.defaultTitle || item.bodyTemplate !== item.defaultBody;

                  return (
                    <button
                      key={item.id}
                      onClick={() => selectTemplate(item)}
                      className={
                        'w-full text-left p-4 transition-all flex items-start justify-between gap-3 ' +
                        (isSelected ? 'bg-amber-500/10 border-l-4 border-amber-600' : 'hover:bg-black/[0.01]')
                      }
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <b className="text-xs text-gray-900 truncate block">{item.name}</b>
                          {isCustomized && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 text-[9px] font-bold">
                              Customized
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-1">{item.description}</p>
                        <div className="flex items-center gap-2 pt-0.5">
                          <code className="text-[10px] text-gray-400 font-mono">/cron/{item.routine}</code>
                          <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100/60 px-1.5 py-0.2 rounded">
                            {item.tradition}
                          </span>
                        </div>
                      </div>

                      <ChevronRight
                        size={16}
                        className={'shrink-0 mt-2 ' + (isSelected ? 'text-amber-700' : 'text-gray-300')}
                      />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Interactive Editor & Live Simulator (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {activeTemplate ? (
              <>
                {/* ─── LIVE MOBILE LOCKSCREEN SIMULATOR ─── */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950 via-gray-900 to-black text-white shadow-xl border border-amber-500/20 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-white/10">
                    <div className="flex items-center gap-2 font-bold tracking-wide text-amber-300">
                      <Smartphone size={15} />
                      <span>Live Lockscreen Preview (iOS / Android)</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">Dynamic Sample Values</span>
                  </div>

                  {/* Push Notification Card Simulation */}
                  <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-amber-500 flex items-center justify-center text-black font-bold text-[10px] shadow-sm">
                          🕉️
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-white/90">SHOONAYA</span>
                      </div>
                      <span className="text-[10px] text-white/50">now</span>
                    </div>

                    <div className="space-y-0.5 pt-0.5">
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {renderPreview(draftTitle) || 'Notification Title'}
                      </h4>
                      <p className="text-xs text-white/80 leading-relaxed">
                        {renderPreview(draftBody) || 'Notification body text will appear here...'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ─── TEMPLATE EDITOR FORM ─── */}
                <div className="p-6 rounded-2xl bg-white border border-[rgba(197,160,89,0.2)] shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{activeTemplate.name}</h3>
                      <p className="text-xs text-gray-500">{activeTemplate.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftActive}
                          onChange={(e) => setDraftActive(e.target.checked)}
                          className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                        />
                        <span>Active</span>
                      </label>
                    </div>
                  </div>

                  {/* Title Template Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-gray-700">Notification Title Template</label>
                      <span
                        className={
                          'text-[10px] font-mono ' +
                          (draftTitle.length > 100 ? 'text-amber-600 font-bold' : 'text-gray-400')
                        }
                      >
                        {draftTitle.length}/120 chars
                      </span>
                    </div>
                    <input
                      type="text"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-sans"
                      placeholder="e.g. 🌅 Brahma Muhurta — The Sacred Hour Opens"
                    />
                  </div>

                  {/* Body Template Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-gray-700">Notification Body Template</label>
                      <span
                        className={
                          'text-[10px] font-mono ' +
                          (draftBody.length > 250 ? 'text-amber-600 font-bold' : 'text-gray-400')
                        }
                      >
                        {draftBody.length}/300 chars
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={draftBody}
                      onChange={(e) => setDraftBody(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-sans leading-relaxed"
                      placeholder="e.g. This is the most auspicious time for sadhana. Rise and begin your practice."
                    />
                  </div>

                  {/* Available Placeholders / Clickable Chips */}
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                      <Sparkles size={14} className="text-amber-700" />
                      <span>Clickable Dynamic Placeholders (Click to insert):</span>
                    </div>

                    {activeTemplate.placeholders.length === 0 ? (
                      <p className="text-xs text-amber-800/80">
                        No dynamic placeholders required for this routine.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {activeTemplate.placeholders.map((p) => (
                          <div
                            key={p.key}
                            className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-amber-300 shadow-sm text-xs"
                          >
                            <button
                              type="button"
                              onClick={() => handleInsertPlaceholder(p.key, 'body')}
                              className="font-mono font-bold text-amber-900 hover:text-amber-700 flex items-center gap-1"
                              title={'Click to insert {{' + p.key + '}} into body'}
                            >
                              <code>{'{{' + p.key + '}}'}</code>
                              {copiedKey === p.key ? (
                                <Check size={11} className="text-emerald-600" />
                              ) : (
                                <Copy size={11} className="text-gray-400" />
                              )}
                            </button>
                            <span className="text-[10px] text-gray-500 pl-1 border-l border-gray-200">
                              {p.label} (e.g. &quot;{p.sample}&quot;)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleResetToDefault}
                      disabled={saving || testing}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-all"
                    >
                      <RotateCcw size={13} />
                      <span>Reset to Default</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSendTestPush}
                        disabled={saving || testing}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-100 text-purple-900 hover:bg-purple-200 text-xs font-bold transition-all shadow-sm"
                      >
                        <Send size={13} className={testing ? 'animate-spin' : ''} />
                        <span>{testing ? 'Dispatching...' : 'Send Test Push'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || testing}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-900 hover:bg-amber-800 text-white text-xs font-bold transition-all shadow-md"
                      >
                        <CheckCircle size={14} className={saving ? 'animate-spin' : ''} />
                        <span>{saving ? 'Saving Changes...' : 'Save Template'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-white border border-[rgba(197,160,89,0.2)] text-gray-400 text-xs">
                Select a notification routine from the left panel to begin editing.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
