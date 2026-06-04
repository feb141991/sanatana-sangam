'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Share2, 
  Calendar, 
  PenTool, 
  AlertCircle,
  CheckCircle2,
  Users,
  RefreshCw,
  BookOpen,
  Heart,
  Smile,
  ChevronLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

type JournalEntry = {
  id: string;
  user_id: string;
  entry_date: string;
  content: string;
  mood: 'peaceful' | 'grateful' | 'seeking' | 'struggling' | 'joyful';
  tradition_context: string | null;
  tags: string[];
  is_shared_to_kul: boolean;
  ai_reflection_generated: boolean;
  created_at: string;
};

type JournalReflection = {
  id: string;
  user_id: string;
  generated_at: string;
  period: 'weekly' | 'monthly' | 'quarterly';
  reflection_text: string;
  entry_ids: string[];
  themes: string[];
  is_shared_to_kul: boolean;
};

type JournalClientProps = {
  userName: string;
  tradition: string;
  timezone: string;
  initialEntries: JournalEntry[];
  initialReflection: JournalReflection | null;
};

const MOODS = [
  { id: 'peaceful', label: 'Peaceful', emoji: '🧘', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 glow-emerald' },
  { id: 'grateful', label: 'Grateful', emoji: '🙏', color: 'bg-rose-500/10 text-rose-300 border-rose-500/30 glow-rose' },
  { id: 'seeking', label: 'Seeking', emoji: '🔍', color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 glow-indigo' },
  { id: 'struggling', label: 'Struggling', emoji: '⛈️', color: 'bg-slate-500/10 text-slate-300 border-slate-500/30 glow-slate' },
  { id: 'joyful', label: 'Joyful', emoji: '☀️', color: 'bg-amber-500/10 text-amber-300 border-amber-500/30 glow-amber' }
] as const;

const DEFAULT_TAGS = [
  'Sadhana', 'Japa', 'Swadhyaya', 'Seva', 'Bhakti', 'Dhyana', 'Pranayama', 'Silence', 'Struggle', 'Grace'
];

export default function JournalClient({
  userName,
  tradition,
  timezone,
  initialEntries,
  initialReflection,
}: JournalClientProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>(initialEntries);
  const [latestReflection, setLatestReflection] = useState<JournalReflection | null>(initialReflection);

  // Composer state
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<JournalEntry['mood'] | null>(null);
  const [traditionContext, setTraditionContext] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSharedToKul, setIsSharedToKul] = useState(false);

  // Date selection (last 7 days)
  const todayDateStr = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
  const [entryDate, setEntryDate] = useState(todayDateStr);

  const datesList = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-CA', { timeZone: timezone });
    const label = i === 0 
      ? 'Today' 
      : i === 1 
        ? 'Yesterday' 
        : d.toLocaleDateString('en-US', { timeZone: timezone, weekday: 'short', month: 'short', day: 'numeric' });
    return { dateStr, label };
  });

  // Action states
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false);
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false);
  const [reflectionPeriod, setReflectionPeriod] = useState<'weekly' | 'monthly' | 'quarterly'>('weekly');
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  // Toggle expanded entries
  const toggleExpandEntry = (id: string) => {
    setExpandedEntries(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select a preset tag
  const togglePresetTag = (tag: string) => {
    setTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Handle entry upsert
  const handleSaveEntry = async () => {
    if (!content.trim()) {
      toast.error('Please write something in your journal entry.');
      return;
    }
    if (!selectedMood) {
      toast.error('Please select your current mood.');
      return;
    }

    setIsSubmittingEntry(true);
    try {
      const res = await fetch('/api/journal/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          mood: selectedMood,
          tradition_context: traditionContext.trim() || null,
          tags,
          is_shared_to_kul: isSharedToKul,
          entry_date: entryDate,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || 'Failed to save entry');
      }

      const savedEntry = body.data;
      setEntries(prev => {
        // If an entry for this date already exists, replace it, else add it
        const filtered = prev.filter(e => e.entry_date !== savedEntry.entry_date);
        return [savedEntry, ...filtered].sort((a, b) => b.entry_date.localeCompare(a.entry_date));
      });

      toast.success(
        entryDate === todayDateStr 
          ? 'Today\'s journal entry saved!' 
          : `Journal entry saved for ${entryDate}!`
      );

      // Only reset form inputs if they successfully saved today's new entry
      // Keep it for easy updates if they stay on same date
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setIsSubmittingEntry(false);
    }
  };

  // Populate composer with existing entry for editing
  const handleEditEntry = (entry: JournalEntry) => {
    setContent(entry.content);
    setSelectedMood(entry.mood);
    setTraditionContext(entry.tradition_context || '');
    setTags(entry.tags || []);
    setIsSharedToKul(entry.is_shared_to_kul);
    setEntryDate(entry.entry_date);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success(`Loaded entry from ${entry.entry_date}`);
  };

  // Generate reflection
  const handleGenerateReflection = async () => {
    setIsGeneratingReflection(true);
    const toastId = toast.loading('Dharma Mitra is reflecting on your spiritual journey...');
    try {
      const res = await fetch('/api/journal/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: reflectionPeriod }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || 'Failed to generate reflection');
      }

      setLatestReflection(body.data);
      toast.success('Your spiritual reflection is ready!', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Reflection generation failed', { id: toastId });
    } finally {
      setIsGeneratingReflection(false);
    }
  };

  // Toggle sharing reflection to Kul
  const handleToggleShareReflection = async (shared: boolean) => {
    if (!latestReflection) return;
    try {
      const res = await fetch('/api/journal/reflect/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reflection_id: latestReflection.id,
          is_shared_to_kul: shared,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || 'Failed to update sharing preference');
      }

      setLatestReflection(prev => prev ? { ...prev, is_shared_to_kul: shared } : null);
      toast.success(shared ? 'Shared with your Kul group' : 'Removed from your Kul group');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update sharing');
    }
  };

  return (
    <div
      className="min-h-screen pb-16"
      style={{ background: 'var(--divine-bg)', color: 'var(--brand-ink)' }}
    >
      {/* Premium Sticky Header */}
      <div
        className="sticky top-0 z-20 px-5 pt-8 pb-4 backdrop-blur-xl border-b"
        style={{ 
          background: 'color-mix(in srgb, var(--divine-bg) 88%, transparent)',
          borderColor: 'var(--card-border)'
        }}
      >
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full border transition-all hover:bg-white/[0.05]"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <ChevronLeft size={16} color="#C5A059" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
                Spiritual Journal
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-[#C5A059]">
                Sadhana Autobiography
              </p>
            </div>
          </div>

          {/* Lock privacy indicator */}
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            title="Your journal is entirely private. Entries are stored securely and only accessible by you, unless shared to your Kul."
          >
            <Lock size={12} className="text-emerald-400" />
            <span>Private & Secure</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 pt-6 grid grid-cols-1 md:grid-cols-5 gap-6">
        
        {/* Left Side: Composer and Timeline (3 Cols) */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Daily Composer Card */}
          <div
            className="rounded-3xl border p-6 backdrop-blur-md shadow-2xl relative overflow-hidden"
            style={{ 
              background: 'var(--card-bg)', 
              borderColor: 'var(--card-border)',
            }}
          >
            {/* Shimmer background effect */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#C5A059]/10 to-transparent rounded-bl-full pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PenTool size={16} className="text-[#C5A059]" />
                <h2 className="text-sm font-semibold tracking-wide uppercase text-white/90">
                  Write Your Entry
                </h2>
              </div>
              
              {/* Date Select Dropdown */}
              <select
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="text-xs bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-1.5 outline-none font-medium text-[#C5A059] transition-all hover:bg-white/[0.08]"
              >
                {datesList.map(item => (
                  <option key={item.dateStr} value={item.dateStr} className="bg-[#121214] text-white">
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Main Textarea */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What practice brought you peace today? What challenges tested your patience? Write freely..."
              rows={5}
              className="w-full bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 text-sm leading-relaxed text-white outline-none focus:border-[#C5A059]/40 focus:bg-white/[0.04] transition-all resize-none"
            />

            {/* Mood Selector */}
            <div className="mt-4">
              <label className="text-[11px] uppercase tracking-wider text-white/50 block mb-2 font-medium">
                Current Mood
              </label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map(mood => {
                  const isSelected = selectedMood === mood.id;
                  return (
                    <button
                      key={mood.id}
                      onClick={() => setSelectedMood(mood.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                        isSelected 
                          ? `${mood.color} border-[#C5A059] scale-105 shadow-[0_0_12px_rgba(197,160,89,0.15)]` 
                          : 'bg-white/[0.02] border-white/[0.06] text-white/70 hover:border-white/[0.15] hover:bg-white/[0.05]'
                      }`}
                    >
                      <span>{mood.emoji}</span>
                      <span>{mood.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Practice Context Field */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-white/50 block mb-2 font-medium">
                  Practice/Tradition Context
                </label>
                <input
                  type="text"
                  value={traditionContext}
                  onChange={(e) => setTraditionContext(e.target.value)}
                  placeholder="e.g. Japa, Sandhyavandanam"
                  className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#C5A059]/40 focus:bg-white/[0.04] transition-all"
                />
              </div>

              {/* Share to Kul Toggle for Daily Entry */}
              <div>
                <label className="text-[11px] uppercase tracking-wider text-white/50 block mb-2 font-medium">
                  Kul Privacy (Family Group)
                </label>
                <button
                  type="button"
                  onClick={() => setIsSharedToKul(!isSharedToKul)}
                  className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-all ${
                    isSharedToKul 
                      ? 'bg-[#C5A059]/10 border-[#C5A059]/30 text-[#C5A059]' 
                      : 'bg-white/[0.02] border-white/[0.06] text-white/60'
                  }`}
                >
                  <span className="text-xs font-semibold">
                    {isSharedToKul ? 'Shared with Kul' : 'Private (Keep Secret)'}
                  </span>
                  {isSharedToKul ? (
                    <Users size={14} className="text-[#C5A059]" />
                  ) : (
                    <Lock size={14} className="text-white/40" />
                  )}
                </button>
              </div>
            </div>

            {/* Presets Tags */}
            <div className="mt-4">
              <label className="text-[11px] uppercase tracking-wider text-white/50 block mb-2 font-medium">
                Sadhana Tags
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_TAGS.map(tag => {
                  const isSelected = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => togglePresetTag(tag)}
                      className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium transition-all ${
                        isSelected 
                          ? 'bg-[#C5A059]/15 border-[#C5A059]/30 text-[#C5A059]' 
                          : 'bg-white/[0.01] border-white/[0.04] text-white/50 hover:bg-white/[0.03]'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveEntry}
              disabled={isSubmittingEntry}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-full py-3.5 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#C5A059', color: '#0E0E0F' }}
            >
              {isSubmittingEntry ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Saving Journal Entry...</span>
                </>
              ) : (
                <span>Save Entry</span>
              )}
            </button>
          </div>

          {/* Timeline Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">
                Timeline (Last 30 Days)
              </h3>
              <span className="text-[10px] text-white/40 font-medium">
                {entries.length} entries recorded
              </span>
            </div>

            {entries.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-8 text-center text-white/40">
                <BookOpen size={24} className="mx-auto mb-2 text-white/20" />
                <p className="text-xs">Your journal timeline is empty.</p>
                <p className="text-[10px] mt-1">Write your first entry above to start your journey.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map(entry => {
                  const moodObj = MOODS.find(m => m.id === entry.mood);
                  const isExpanded = expandedEntries.has(entry.id);
                  const displayDate = new Date(entry.entry_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'UTC' // dates are stored as date without timezone
                  });

                  return (
                    <div
                      key={entry.id}
                      className="rounded-2xl border transition-all overflow-hidden"
                      style={{ 
                        background: 'rgba(255,255,255,0.02)',
                        borderColor: isExpanded ? 'rgba(197,160,89,0.2)' : 'rgba(255,255,255,0.05)'
                      }}
                    >
                      {/* Entry Header */}
                      <div 
                        onClick={() => toggleExpandEntry(entry.id)}
                        className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.01] select-none"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{moodObj?.emoji}</span>
                          <div>
                            <p className="text-xs font-semibold text-white/90">{displayDate}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.08] text-white/50 bg-white/[0.02]">
                                {moodObj?.label}
                              </span>
                              {entry.tradition_context && (
                                <span className="text-[10px] text-[#C5A059] font-medium">
                                  • {entry.tradition_context}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {entry.is_shared_to_kul && (
                            <span title="Shared with Kul group">
                              <Users size={12} className="text-[#C5A059]" />
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEntry(entry);
                            }}
                            className="p-1 rounded text-[10px] uppercase font-bold text-[#C5A059] border border-[#C5A059]/20 bg-[#C5A059]/5 hover:bg-[#C5A059]/15"
                          >
                            Edit
                          </button>
                          {isExpanded ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                        </div>
                      </div>

                      {/* Expanded Content */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden border-t border-white/[0.04]"
                          >
                            <div className="p-4 bg-black/15">
                              <p className="text-xs leading-relaxed text-white/80 whitespace-pre-wrap">
                                {entry.content}
                              </p>

                              {/* Tags */}
                              {entry.tags && entry.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-4">
                                  {entry.tags.map(t => (
                                    <span key={t} className="text-[9px] px-2 py-0.5 rounded bg-white/[0.04] text-white/40">
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: AI Reflections (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* AI Reflection Panel */}
          <div
            className="rounded-3xl border p-6 backdrop-blur-md shadow-2xl relative overflow-hidden flex flex-col justify-between"
            style={{ 
              background: 'var(--card-bg)', 
              borderColor: 'var(--card-border)',
              minHeight: '400px'
            }}
          >
            {/* Shimmer background gradient */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-[#C5A059]/5 to-transparent pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4 border-b border-white/[0.05] pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#C5A059] animate-pulse" />
                  <h2 className="text-sm font-semibold tracking-wide uppercase text-white/95">
                    Dharma Reflections
                  </h2>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/25 font-bold uppercase tracking-wider">
                  Dharma Mitra AI
                </span>
              </div>

              {/* Reflection Body */}
              <AnimatePresence mode="wait">
                {latestReflection ? (
                  <motion.div
                    key={latestReflection.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {/* Reflection Text */}
                    <div className="text-xs leading-relaxed text-white/80 whitespace-pre-wrap italic font-serif pl-3 border-l border-[#C5A059]/30">
                      &ldquo;{latestReflection.reflection_text}&rdquo;
                    </div>

                    {/* Themes Tags */}
                    {latestReflection.themes && latestReflection.themes.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium mb-1.5">
                          Identified Themes
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {latestReflection.themes.map(t => (
                            <span 
                              key={t} 
                              className="text-[9px] font-semibold px-2 py-0.5 rounded-full border border-white/[0.06] text-white/60 bg-white/[0.02]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Generated At and Period */}
                    <div className="flex items-center justify-between text-[9px] text-white/45 border-t border-white/[0.04] pt-3.5 mt-2">
                      <span className="capitalize font-medium">
                        Period: {latestReflection.period} summary
                      </span>
                      <span>
                        Reflected {new Date(latestReflection.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Kul Share toggle for reflection */}
                    <div className="mt-4 pt-3.5 border-t border-white/[0.04] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users size={13} className="text-white/60" />
                        <div>
                          <p className="text-[10px] font-semibold text-white/80">Share Reflection to Kul</p>
                          <p className="text-[8px] text-white/40">Allow family group members to read this summary</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleShareReflection(!latestReflection.is_shared_to_kul)}
                        className={`px-3 py-1.5 rounded-xl border text-[9px] font-bold uppercase transition-all ${
                          latestReflection.is_shared_to_kul
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                            : 'bg-white/[0.02] border-white/[0.06] text-white/50 hover:bg-white/[0.05]'
                        }`}
                      >
                        {latestReflection.is_shared_to_kul ? 'Shared' : 'Share'}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-8 text-center text-white/45 space-y-3"
                  >
                    <BookOpen size={24} className="mx-auto text-white/20" />
                    <p className="text-xs">No spiritual reflections generated yet.</p>
                    <p className="text-[9px] leading-relaxed max-w-xs mx-auto">
                      Dharma Mitra can analyze your entries to help identify themes, assess growth, and recommend scriptures.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reflection Trigger Controls */}
            <div className="mt-6 pt-4 border-t border-white/[0.05] space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/45 block mb-2 font-medium">
                  Reflection Period
                </label>
                <div className="grid grid-cols-3 gap-1 bg-black/25 rounded-xl p-1 border border-white/[0.03]">
                  {(['weekly', 'monthly', 'quarterly'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setReflectionPeriod(p)}
                      className={`py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                        reflectionPeriod === p 
                          ? 'bg-[#C5A059] text-[#0E0E0F] shadow-md scale-102' 
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {p === 'weekly' ? 'Week' : p === 'monthly' ? 'Month' : '3 Mos'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateReflection}
                disabled={isGeneratingReflection || entries.length === 0}
                className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg"
                style={{ 
                  background: 'transparent',
                  color: '#C5A059',
                  border: '1px solid rgba(197,160,89,0.4)',
                }}
              >
                {isGeneratingReflection ? (
                  <>
                    <RefreshCw size={14} className="animate-spin text-[#C5A059]" />
                    <span>Analyzing Entries...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} className="text-[#C5A059]" />
                    <span>Generate Reflection</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
