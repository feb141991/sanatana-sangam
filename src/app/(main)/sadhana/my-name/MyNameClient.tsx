'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Share2,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  BookOpen,
  Compass,
  Globe,
  Users,
  Flame,
  ArrowRight,
  Languages
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  defaultNameStoryTranslationLanguage,
  isNameStoryIntent,
  isNameStoryTradition,
  isNameStoryTranslationLanguage,
  normalizeFirstName,
  type NameStoryIntent,
  type NameStorySourceConfidence,
  type NameStoryTradition,
  type NameStoryTranslationLanguage,
} from '@/lib/name-story';

type NameStory = {
  id: string;
  user_id: string;
  name_input: string;
  display_name: string | null;
  normalized_first_name: string | null;
  name_native_script: string | null;
  name_transliteration: string | null;
  user_intent: NameStoryIntent[] | null;
  translation_language: NameStoryTranslationLanguage | null;
  tradition: NameStoryTradition;
  etymology_text: string;
  deity_connection: string | null;
  origin_tradition: string | null;
  historical_bearers: string[];
  meaning_summary: string;
  sacred_meaning: string | null;
  name_story: string | null;
  inner_quality: string | null;
  life_blessing: string | null;
  practice_suggestion: string | null;
  name_mantra: string | null;
  name_mantra_translation: string | null;
  scripture_line: string | null;
  scripture_original: string | null;
  scripture_transliteration: string | null;
  scripture_translation: string | null;
  scripture_translation_language: NameStoryTranslationLanguage | null;
  scripture_source: string | null;
  source_confidence: NameStorySourceConfidence | null;
  source_note: string | null;
  generated_at: string;
  is_public: boolean;
  share_slug: string;
};

type MyNameClientProps = {
  userId: string;
  initialTradition: string;
  initialUserName: string;
  initialStory: NameStory | null;
};

const TRADITIONS = [
  { key: 'hindu', label: 'Sanatan Dharma', emoji: '🪔' },
  { key: 'sikh', label: 'Sikhi', emoji: '☬' },
  { key: 'buddhist', label: 'Buddha Dharma', emoji: '☸️' },
  { key: 'jain', label: 'Jain Dharma', emoji: '🤲' },
  { key: 'all', label: 'Universal / All', emoji: '🌐' },
] as const;

const LANGUAGES: { key: NameStoryTranslationLanguage; label: string }[] = [
  { key: 'hi', label: 'Hindi' },
  { key: 'en', label: 'English' },
  { key: 'pa', label: 'Punjabi' },
  { key: 'mr', label: 'Marathi' },
  { key: 'bn', label: 'Bengali' },
  { key: 'gu', label: 'Gujarati' },
  { key: 'ta', label: 'Tamil' },
  { key: 'te', label: 'Telugu' },
];

const INTENT_OPTIONS: { key: NameStoryIntent; label: string }[] = [
  { key: 'sacred_meaning', label: 'Sacred meaning' },
  { key: 'scripture_connection', label: 'Scripture connection' },
  { key: 'inner_quality', label: 'Inner quality' },
  { key: 'name_mantra', label: 'Name mantra' },
  { key: 'daily_practice', label: 'Daily practice' },
  { key: 'family_lineage', label: 'Family lineage' },
];

const DEFAULT_INTENTS: NameStoryIntent[] = [
  'sacred_meaning',
  'scripture_connection',
  'inner_quality',
  'name_mantra',
];

function resolveTradition(value: string | null | undefined): NameStoryTradition {
  return isNameStoryTradition(value) ? value : 'all';
}

function resolveLanguage(
  value: string | null | undefined,
  tradition: NameStoryTradition,
): NameStoryTranslationLanguage {
  return isNameStoryTranslationLanguage(value)
    ? value
    : defaultNameStoryTranslationLanguage(tradition);
}

function resolveIntents(value: NameStoryIntent[] | null | undefined): NameStoryIntent[] {
  const validIntents = Array.isArray(value) ? value.filter(isNameStoryIntent) : [];
  return validIntents.length > 0 ? Array.from(new Set(validIntents)) : DEFAULT_INTENTS;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Generation failed';
}

export default function MyNameClient({
  userId,
  initialTradition,
  initialUserName,
  initialStory,
}: MyNameClientProps) {
  const router = useRouter();
  const initialResolvedTradition = resolveTradition(initialStory?.tradition || initialTradition);
  const [step, setStep] = useState<1 | 2 | 3>(initialStory ? 3 : 1);
  const [story, setStory] = useState<NameStory | null>(initialStory);
  const [name, setName] = useState(initialStory?.display_name || initialStory?.name_input || initialUserName || '');
  const [nativeScript, setNativeScript] = useState(initialStory?.name_native_script || '');
  const [transliteration, setTransliteration] = useState(initialStory?.name_transliteration || '');
  const [tradition, setTradition] = useState<NameStoryTradition>(initialResolvedTradition);
  const [translationLanguage, setTranslationLanguage] = useState<NameStoryTranslationLanguage>(
    resolveLanguage(initialStory?.translation_language, initialResolvedTradition),
  );
  const [selectedIntents, setSelectedIntents] = useState<NameStoryIntent[]>(
    resolveIntents(initialStory?.user_intent),
  );

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check if regeneration is throttled
  const getThrottleStatus = () => {
    if (!story) return { throttled: false, remainingDays: 0 };

    const generatedAt = new Date(story.generated_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - generatedAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      throttled: diffDays <= 30,
      remainingDays: 30 - diffDays
    };
  };

  const { throttled, remainingDays } = getThrottleStatus();

  const firstName = normalizeFirstName(name);
  const hasSurname = firstName && name.trim().length > firstName.length;

  const handleContinue = () => {
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    setTranslationLanguage(resolveLanguage(translationLanguage, tradition));
    setStep(2);
  };

  const toggleIntent = (intent: NameStoryIntent) => {
    setSelectedIntents((current) => {
      if (current.includes(intent)) {
        return current.length === 1 ? current : current.filter((item) => item !== intent);
      }
      return [...current, intent];
    });
  };

  const handleGenerate = async () => {
    setLoading(true);
    const toastId = toast.loading('Invoking cosmic etymology...');

    try {
      const res = await fetch('/api/name-story/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          displayName: name,
          confirmedFirstName: firstName,
          nativeScript,
          transliteration,
          tradition,
          translationLanguage,
          intent: selectedIntents,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || 'Failed to generate name story');
      }

      setStory(body.data);
      setStep(3);
      toast.success('Your Name Story has been generated!', { id: toastId });
      router.refresh();
    } catch (err: unknown) {
      toast.error(errorMessage(err), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = () => {
    if (!story) return;
    const url = `${window.location.origin}/name/${story.share_slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success('Shareable link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const storyName = story?.normalized_first_name || story?.name_input || firstName;
  const storyMeaning = story?.sacred_meaning || story?.meaning_summary || '';
  const storyNarrative = story?.name_story || story?.etymology_text || '';
  const scriptureText = [
    story?.scripture_original,
    story?.scripture_transliteration,
    story?.scripture_translation,
  ].filter(Boolean).join('\n\n') || story?.scripture_line || '';

  return (
    <div
      className="min-h-screen pb-16"
      style={{ background: 'var(--divine-bg)', color: 'var(--brand-ink)' }}
    >
      {/* Premium Sticky Header */}
      <div
        className="sticky top-0 z-20 px-5 pt-safe-top pb-4 backdrop-blur-xl border-b"
        style={{
          background: 'color-mix(in srgb, var(--divine-bg) 88%, transparent)',
          borderColor: 'var(--card-border)'
        }}
      >
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (step === 2) setStep(1);
                else router.back();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border transition-all hover:bg-white/[0.05]"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <ChevronLeft size={16} color="#C5A059" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
                Dharmic Name Story
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-[#C5A059]">
                identity &amp; lineage registry
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 pt-8 grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Left column: input details and config (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="rounded-3xl border p-6 backdrop-blur-md relative overflow-hidden"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                }}
              >
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-serif)' }}>
                  <Sparkles size={16} className="text-[#C5A059]" />
                  <span>Name Registry</span>
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1.5 font-semibold">
                      Name to Analyze
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="E.g., Arjun, Simran, Anand"
                      disabled={loading || throttled}
                      className="w-full rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3 text-white placeholder-white/20 outline-none focus:border-[#C5A059] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1.5 font-semibold">
                      Tradition Focus
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {TRADITIONS.map((trad) => (
                        <button
                          key={trad.key}
                          type="button"
                          disabled={loading || throttled}
                          onClick={() => {
                            setTradition(trad.key);
                            setTranslationLanguage(defaultNameStoryTranslationLanguage(trad.key));
                          }}
                          className="w-full flex items-center justify-between rounded-xl px-4 py-3 border text-left text-sm transition-all"
                          style={tradition === trad.key
                            ? { borderColor: '#C5A059', background: 'rgba(197,160,89,0.08)', color: '#C5A059' }
                            : { borderColor: 'rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)' }
                          }
                        >
                          <span className="font-medium">{trad.label}</span>
                          <span>{trad.emoji}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {throttled && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 leading-relaxed">
                      🔒 You recently generated a Name Story. The registry limits regeneration to once every 30 days to maintain spiritual focus. Remaining: <strong>{remainingDays} days</strong>.
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={loading || throttled || !name.trim()}
                    onClick={handleContinue}
                    className="w-full mt-4 flex items-center justify-center gap-2 rounded-full bg-[#C5A059] text-black font-bold py-3.5 transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span>Continue</span>
                    <ArrowRight size={16} />
                  </button>

                  {story && step === 1 && (
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="w-full text-xs text-white/40 hover:text-white/80 transition-all font-medium py-2"
                    >
                      View existing story
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="rounded-3xl border p-6 backdrop-blur-md relative overflow-hidden"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                }}
              >
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-serif)' }}>
                  <Compass size={16} className="text-[#C5A059]" />
                  <span>Confirm Focus</span>
                </h2>

                <div className="space-y-6">
                  <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 text-center">
                    <p className="text-[11px] uppercase tracking-wider text-white/40 mb-2 font-semibold">
                      We&apos;ll create your Name Story for:
                    </p>
                    <p className="text-2xl font-serif text-white tracking-wide">
                      {firstName}
                    </p>
                    {hasSurname && (
                      <p className="text-xs text-[#C5A059]/80 mt-2">
                        Your surname is excluded to focus deeply on the spiritual root of your identity.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1.5 font-semibold">
                        Native Script Spelling
                      </label>
                      <input
                        type="text"
                        value={nativeScript}
                        onChange={(e) => setNativeScript(e.target.value)}
                        placeholder="Optional, e.g. साक्षी"
                        disabled={loading}
                        className="w-full rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3 text-white placeholder-white/20 outline-none focus:border-[#C5A059] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1.5 font-semibold">
                        Transliteration
                      </label>
                      <input
                        type="text"
                        value={transliteration}
                        onChange={(e) => setTransliteration(e.target.value)}
                        placeholder="Optional, e.g. Sakshi"
                        disabled={loading}
                        className="w-full rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3 text-white placeholder-white/20 outline-none focus:border-[#C5A059] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/40 mb-2 font-semibold">
                      <Languages size={14} />
                      Scripture Translation Language
                    </label>
                    <select
                      value={translationLanguage}
                      onChange={(e) => setTranslationLanguage(e.target.value as NameStoryTranslationLanguage)}
                      className="w-full rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3 text-white outline-none focus:border-[#C5A059] transition-all appearance-none"
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang.key} value={lang.key} style={{ background: '#111' }}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-2 font-semibold">
                      What do you want to know?
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {INTENT_OPTIONS.map((option) => {
                        const active = selectedIntents.includes(option.key);
                        return (
                          <button
                            key={option.key}
                            type="button"
                            disabled={loading}
                            onClick={() => toggleIntent(option.key)}
                            className="flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs transition-all"
                            style={active
                              ? { borderColor: 'var(--brand-primary)', background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)', color: 'var(--brand-primary)' }
                              : { borderColor: 'var(--card-border)', background: 'var(--card-bg)', color: 'color-mix(in srgb, var(--brand-ink) 62%, transparent)' }
                            }
                          >
                            <span className="font-medium">{option.label}</span>
                            {active && <Check size={13} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleGenerate}
                    className="w-full mt-2 flex items-center justify-center gap-2 rounded-full bg-[#C5A059] text-black font-bold py-3.5 transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(197,160,89,0.3)]"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="animate-spin" size={16} />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Generate Name Story</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border p-6 backdrop-blur-md relative overflow-hidden"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                }}
              >
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-serif)' }}>
                  <Sparkles size={16} className="text-[#C5A059]" />
                  <span>Name Registry</span>
                </h2>

                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 text-center mb-6">
                  <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1 font-semibold">
                    Current Focus
                  </p>
                  <p className="text-xl font-serif text-white tracking-wide">
                    {storyName || name}
                  </p>
                  <p className="text-[10px] uppercase text-[#C5A059]/80 mt-1.5">
                    {TRADITIONS.find(t => t.key === (story?.tradition || tradition))?.label}
                  </p>
                </div>

                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-[#C5A059]">
                  <Share2 size={14} />
                  <span>Share your Story</span>
                </h3>
                <p className="text-xs text-white/50 mb-4 leading-relaxed">
                  Allow others to read the etymology and scripture of your name. Sharing helps preserve tradition and heritage.
                </p>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={copyShareLink}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] py-3 text-sm text-white font-medium hover:bg-white/[0.06] transition-all"
                    >
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copied ? 'Copied URL!' : 'Copy Public URL'}</span>
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Check out the spiritual story of my name on Shoonaya!\n\n${window.location.origin}/name/${story?.share_slug}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 hover:bg-emerald-500/20 transition-all"
                    >
                      <span className="font-bold">📲 WhatsApp</span>
                    </a>
                  </div>

                  {(!throttled || remainingDays === 0) && (
                    <button
                      onClick={() => setStep(1)}
                      className="w-full mt-2 text-xs text-white/40 hover:text-white/80 transition-all font-medium py-2 flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw size={12} /> Start Over
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right column: name story preview card (3 cols) */}
        <div className="md:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {!story || step !== 3 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-3xl border p-12 text-center flex flex-col items-center justify-center"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  minHeight: '400px'
                }}
              >
                <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mb-6 text-2xl">
                  📜
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                  Unlock Your Name Story
                </h3>
                <p className="text-sm text-white/40 max-w-sm mx-auto leading-relaxed mb-6">
                  Every name carries a vibration, history, and connection to the divine. Analyze your name to discover its etymology and scriptural alignment.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl border p-8 md:p-10 relative overflow-hidden shadow-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.01)',
                  borderColor: 'rgba(197, 160, 89, 0.25)',
                }}
              >
                <div className="absolute inset-0 bg-radial-gradient from-[#C5A059]/[0.03] to-transparent pointer-events-none" />

                <div className="flex flex-col items-center text-center mb-8">
                  <div className="text-xs uppercase tracking-[0.2em] text-[#C5A059] font-serif mb-1">
                    {TRADITIONS.find(t => t.key === story.tradition)?.emoji} {TRADITIONS.find(t => t.key === story.tradition)?.label}
                  </div>
                  {story.origin_tradition && (
                    <span className="text-[10px] uppercase tracking-wider text-white/45 bg-white/[0.04] border border-white/[0.06] px-3 py-1 rounded-full mb-4">
                      {story.origin_tradition}
                    </span>
                  )}
                  <h2 className="text-4xl font-light font-serif tracking-wide text-white mb-3">
                    {storyName}
                  </h2>
                  {(story.name_native_script || story.name_transliteration) && (
                    <p className="text-sm text-white/45 mb-3">
                      {[story.name_native_script, story.name_transliteration].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="text-lg font-serif italic text-white/80 max-w-md">
                    “{storyMeaning}”
                  </p>
                </div>

                <div className="h-px bg-white/[0.08] my-6" />

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-[#C5A059] font-bold mb-1.5 flex items-center gap-1.5">
                      <Compass size={12} />
                      <span>Name Story</span>
                    </h4>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {storyNarrative}
                    </p>
                  </div>

                  {story.inner_quality && (
                    <div>
                      <h4 className="text-[10px] uppercase tracking-wider text-[#C5A059] font-bold mb-1.5 flex items-center gap-1.5">
                        <Flame size={12} />
                        <span>Inner Quality</span>
                      </h4>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {story.inner_quality}
                      </p>
                    </div>
                  )}

                  {story.life_blessing && (
                    <div>
                      <h4 className="text-[10px] uppercase tracking-wider text-[#C5A059] font-bold mb-1.5 flex items-center gap-1.5">
                        <Users size={12} />
                        <span>Life Blessing</span>
                      </h4>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {story.life_blessing}
                      </p>
                    </div>
                  )}

                  {(story.practice_suggestion || story.name_mantra) && (
                    <div>
                      <h4 className="text-[10px] uppercase tracking-wider text-[#C5A059] font-bold mb-1.5 flex items-center gap-1.5">
                        <Globe size={12} />
                        <span>Practice</span>
                      </h4>
                      {story.practice_suggestion && (
                        <p className="text-sm text-white/70 leading-relaxed">
                          {story.practice_suggestion}
                        </p>
                      )}
                      {story.name_mantra && (
                        <p className="text-sm text-white/80 font-serif italic leading-relaxed mt-3">
                          “{story.name_mantra}”
                        </p>
                      )}
                      {story.name_mantra_translation && (
                        <p className="text-xs text-white/45 leading-relaxed mt-1">
                          {story.name_mantra_translation}
                        </p>
                      )}
                    </div>
                  )}

                  {scriptureText && (
                    <div className="rounded-2xl border border-[#C5A059]/15 bg-[#C5A059]/[0.01] p-5 mt-4">
                      <h4 className="text-[10px] uppercase tracking-wider text-[#C5A059] font-bold mb-3 flex items-center gap-1.5">
                        <BookOpen size={12} />
                        <span>Scriptural Alignment</span>
                      </h4>
                      <p className="text-base text-white font-serif text-center leading-relaxed mb-2.5 whitespace-pre-line">
                        {scriptureText}
                      </p>
                      {story.scripture_source && (
                        <p className="text-[10px] uppercase tracking-widest text-[#C5A059] text-center font-medium">
                          — {story.scripture_source}
                        </p>
                      )}
                    </div>
                  )}

                  {story.source_note && (
                    <p className="text-[11px] text-white/35 leading-relaxed">
                      {story.source_note}
                    </p>
                  )}
                </div>

                <div className="text-[10px] text-white/20 text-center mt-8">
                  Registered in Shoonaya · {new Date(story.generated_at).toLocaleDateString()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
