'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RotateCcw, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MessageReference {
  id: string;
  title: string;
  source: string;
  tradition: string;
}

interface Message {
  id:        string;
  role:      'user' | 'model';
  text:      string;
  timestamp: Date;
  references?: MessageReference[];
  trustMode?: 'source-guided' | 'reflective';
}

interface Props {
  userId: string;
  userName: string;
  tradition: string | null;
  initialPrompt?: string;
  contextLabel?: string;
}

// ─── Tradition-aware suggestions ──────────────────────────────────────────────
const SUGGESTIONS_BY_TRADITION: Record<string, string[]> = {
  hindu: [
    'What does the Gita say about anxiety?',
    'How do I start a daily sadhana practice?',
    'What is the meaning of Om?',
    'Explain the concept of dharma simply',
    'What is the difference between karma and destiny?',
    'How to balance work and spiritual life?',
    'How do I deal with grief from a dharmic perspective?',
    'What are the four Purusharthas?',
  ],
  sikh: [
    'What is the meaning of Ik Onkar?',
    'How do I start a daily Nitnem practice?',
    'What does Gurbani say about dealing with hardship?',
    'Explain Seva and its importance in Sikhi',
    'What is the significance of the Ardas?',
    'How to find peace through Naam Simran?',
    'What are the five Kakars and why do they matter?',
    'How does the Guru Granth Sahib guide daily life?',
  ],
  buddhist: [
    'What is the Noble Eightfold Path?',
    'How do I start a daily meditation practice?',
    'What does the Dhammapada say about the mind?',
    'Explain the concept of impermanence simply',
    'What is the difference between compassion and attachment?',
    'How to deal with suffering from a Buddhist perspective?',
    'What are the Three Jewels (Tisarana)?',
    'How do I cultivate Metta (loving-kindness)?',
  ],
  jain: [
    'What is the meaning of Ahimsa in daily life?',
    'How do I start a daily Pratikraman practice?',
    'What does the Namokar Mantra mean?',
    'Explain Anekantavada — the Jain view of truth',
    'What is Aparigraha and how to practice it today?',
    'How to deal with anger through Jain teachings?',
    'What are the Five Major Vows (Mahavrata)?',
    'How does Jainism view karma differently from Hinduism?',
  ],
};

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm ${
        isUser ? 'bg-[#7B1A1A] text-white' : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
      }`}>
        {isUser ? '🙏' : '✨'}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'glass-button-primary text-white rounded-tr-sm'
            : 'glass-panel text-gray-800 rounded-tl-sm'
        }`}>
          {msg.text}
        </div>
        {!isUser && (
          <div className="space-y-1.5 px-1">
            <span className={`inline-flex text-[10px] font-semibold px-2 py-1 rounded-full border ${
              msg.trustMode === 'source-guided'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {msg.trustMode === 'source-guided' ? 'Source-guided' : 'Reflective guidance'}
            </span>
            {msg.references && msg.references.length > 0 && (
              <div className="clay-card rounded-2xl px-3 py-2.5 max-w-full">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Suggested sources</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {msg.references.map((reference) => (
                    <span key={reference.id} className="clay-pill text-[11px] text-gray-700">
                      {reference.source}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <span className="text-[10px] text-gray-400 px-1">
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-2 mb-4">
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm bg-gradient-to-br from-amber-400 to-orange-500 text-white">
        ✨
      </div>
      <div className="glass-panel rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-5">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

const PRACTICE_LANES = [
  {
    title: 'Reflect on a verse',
    body: 'Bring a shloka, pauri, sutra, or personal question and ask for a grounded explanation.',
  },
  {
    title: 'Prepare for study',
    body: 'Ask for a chapter summary, a beginner-friendly meaning, or a few reflection questions.',
  },
  {
    title: 'Work through life gently',
    body: 'Use Dharma Mitra for calm, source-aware guidance when life feels confusing or heavy.',
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AIChatClient({ userId, userName, tradition, initialPrompt, contextLabel }: Props) {
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);
  const seededPromptRef = useRef(false);

  // Tradition-aware content
  const suggestions = SUGGESTIONS_BY_TRADITION[tradition ?? 'hindu'] ?? SUGGESTIONS_BY_TRADITION.hindu;
  const greetingMap: Record<string, string> = {
    hindu:    'Hari Om 🕉️',
    sikh:     'Sat Sri Akal ☬',
    buddhist: 'Namo Buddhaya ☸️',
    jain:     'Jai Jinendra 🤲',
  };
  const greeting = greetingMap[tradition ?? 'hindu'] ?? 'Namaste 🙏';
  const trustLabel = tradition
    ? `Rooted in ${tradition.charAt(0).toUpperCase()}${tradition.slice(1)} guidance when sources are available`
    : 'Rooted in dharmic guidance when sources are available';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!initialPrompt || seededPromptRef.current) return;

    seededPromptRef.current = true;
    setInput(initialPrompt);
    setShowSuggestions(false);

    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
      el.setSelectionRange(el.value.length, el.value.length);
    });
  }, [initialPrompt]);

  function newId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  async function sendMessage(text?: string) {
    const msgText = (text ?? input).trim();
    if (!msgText || loading) return;

    setInput('');
    setShowSuggestions(false);

    const userMsg: Message = { id: newId(), role: 'user', text: msgText, timestamp: new Date() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    // Build history for the API (exclude the just-added user message — it's the current one)
    const history = messages.map(m => ({ role: m.role, text: m.text }));

    try {
      const res = await fetch('/api/ai/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: msgText, history, tradition }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Something went wrong');
        setLoading(false);
        return;
      }
      const modelMsg: Message = {
        id: newId(),
        role: 'model',
        text: data.reply,
        timestamp: new Date(),
        references: Array.isArray(data.references) ? data.references : [],
        trustMode: data.trustMode === 'source-guided' ? 'source-guided' : 'reflective',
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch {
      toast.error('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([]);
    setShowSuggestions(true);
    setInput('');
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] fade-in">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="glass-panel rounded-[1.75rem] px-4 py-4 mb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 18%, white), color-mix(in srgb, var(--brand-secondary) 26%, white))' }}>
            ✨
            </div>
            <div>
              <h1 className="font-display font-bold text-gray-900 text-lg leading-tight">Dharma Mitra</h1>
              <p className="text-xs text-gray-500">A calmer place to ask, reflect, study, and return to trusted sources.</p>
            </div>
          </div>
          {!isEmpty && (
            <button onClick={clearChat}
              className="glass-button-secondary flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-gray-500 transition"
              style={{ color: 'var(--brand-primary-strong)' }}>
              <RotateCcw size={12} />
              New chat
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="clay-pill text-[11px] text-gray-700">
            {trustLabel}
          </span>
          <span className="clay-pill text-[11px] text-gray-700">
            Best for study, reflection, and gentle next steps
          </span>
          {initialPrompt && (
            <span className="clay-pill text-[11px] text-gray-700">
              Opened from {contextLabel ?? 'Pathshala'}
            </span>
          )}
        </div>
      </div>

      {/* ── Messages area ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-0 pr-1">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 space-y-6">
            {/* Welcome */}
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-4xl"
                style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 14%, white), color-mix(in srgb, var(--brand-secondary) 20%, white))' }}>
                🙏
              </div>
              <h2 className="font-display font-bold text-xl text-gray-900">
                {greeting}, {userName}
              </h2>
              <p className="text-sm text-gray-500 max-w-xs">
                Begin with one question, one verse, or one burden. This space should feel more like guidance than search.
              </p>
              <p className="text-xs text-gray-400 max-w-sm">
                When relevant, Dharma Mitra surfaces internal scripture references and trust cues so the conversation stays easier to verify.
              </p>
            </div>

            <div className="w-full max-w-2xl grid gap-3 sm:grid-cols-3">
              {PRACTICE_LANES.map((lane) => (
                <div key={lane.title} className="clay-card rounded-[1.5rem] px-4 py-4 text-left">
                  <p className="text-sm font-semibold text-gray-900">{lane.title}</p>
                  <p className="text-xs leading-relaxed text-gray-600 mt-2">{lane.body}</p>
                </div>
              ))}
            </div>

            {initialPrompt && (
              <div className="w-full max-w-xl">
                <div className="clay-card rounded-[1.6rem] px-4 py-4 text-left space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">
                        {contextLabel ?? 'Pathshala study prompt'}
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed mt-2">
                        A study prompt was brought in from Pathshala. You can send it as-is or edit it before asking.
                      </p>
                    </div>
                    <Sparkles size={18} className="text-[color:var(--brand-primary)] flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="glass-panel rounded-2xl px-4 py-3 text-sm text-gray-800">
                    {initialPrompt}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => sendMessage(initialPrompt)}
                      className="glass-button-primary px-4 py-2 rounded-full text-sm text-white"
                    >
                      Ask this now
                    </button>
                    <button
                      onClick={() => {
                        setInput(initialPrompt);
                        inputRef.current?.focus();
                      }}
                      className="glass-button-secondary px-4 py-2 rounded-full text-sm"
                      style={{ color: 'var(--brand-primary)' }}
                    >
                      Edit first
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {showSuggestions && (
              <div className="w-full max-w-sm space-y-2">
                <p className="text-xs text-gray-400 font-medium">Good first questions</p>
                <div className="flex flex-col gap-2">
                  {suggestions.slice(0, 4).map(s => (
                    <button key={s} onClick={() => sendMessage(s)}
                      className="glass-panel text-left px-4 py-2.5 rounded-xl text-sm text-gray-700 transition shadow-sm"
                      style={{ ['--tw-ring-color' as never]: 'transparent' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ─────────────────────────────────────────────────────── */}
      <div className="glass-panel rounded-[1.75rem] px-3 py-3 mt-2">
        {/* Quick suggestion chips (after conversation starts) */}
        {!isEmpty && !loading && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {suggestions.slice(4).map(s => (
              <button key={s} onClick={() => sendMessage(s)}
                className="glass-chip flex-shrink-0 px-3 py-1.5 rounded-full text-xs text-gray-600 transition whitespace-nowrap">
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="glass-input flex-1 rounded-2xl focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition overflow-hidden">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a verse, question, or life situation... Shift+Enter for a new line"
              rows={1}
              disabled={loading}
              style={{ resize: 'none', maxHeight: '120px' }}
              className="w-full px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent disabled:opacity-60"
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="glass-button-primary w-11 h-11 rounded-2xl flex items-center justify-center text-white transition disabled:opacity-40"
            style={{ flexShrink: 0 }}>
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Dharma Mitra is a study and reflection companion. Verify spiritually sensitive guidance with trusted teachers and sources.
        </p>
      </div>
    </div>
  );
}
