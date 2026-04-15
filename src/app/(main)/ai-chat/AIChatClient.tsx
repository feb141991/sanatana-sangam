'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RotateCcw, ChevronDown, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEngine } from '@/contexts/EngineContext';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ScriptureRef {
  text_id:         string;
  chapter?:        number;
  verse?:          number;
  sanskrit?:       string;
  transliteration?: string;
  source_label?:   string;
}

interface Message {
  id:         string;
  role:       'user' | 'model';
  text:       string;
  timestamp:  Date;
  /** Scripture verses returned by RAG (only on model messages) */
  verses?:    ScriptureRef[];
  /** Whether this reply came from scripture RAG vs plain Gemini */
  fromRag?:   boolean;
}

interface Props {
  userId:         string;
  userName:       string;
  tradition:      string | null;
  /** Pre-filled prompt injected via ?prefill= query param (e.g. from deep links) */
  initialPrompt?: string;
  /** Short context label shown in header (e.g. "From Pathshala") */
  contextLabel?:  string;
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
            ? 'bg-[#7B1A1A] text-white rounded-tr-sm'
            : 'bg-white text-gray-800 rounded-tl-sm border border-orange-100 shadow-sm'
        }`}>
          {msg.text}
          {/* ── Scripture sources (RAG only) ── */}
          {!isUser && msg.verses && msg.verses.length > 0 && (
            <div className="mt-1">
              {msg.verses.map((v, i) => <VerseChip key={i} verse={v} />)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 px-1">
          <span className="text-[10px] text-gray-400">
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {msg.fromRag && (
            <span className="text-[9px] bg-orange-50 text-orange-500 border border-orange-100 rounded-full px-1.5 py-0.5 font-medium">
              📖 Scripture-grounded
            </span>
          )}
        </div>
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
      <div className="bg-white border border-orange-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-5">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Scripture Verse Chip ─────────────────────────────────────────────────────
function VerseChip({ verse }: { verse: ScriptureRef }) {
  const [open, setOpen] = useState(false);
  const label = verse.source_label
    ?? `${verse.text_id?.replace(/_/g, ' ')} ${verse.chapter ? `${verse.chapter}.${verse.verse}` : ''}`.trim();
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-orange-600 font-medium bg-orange-50 border border-orange-100 rounded-full px-3 py-1 hover:bg-orange-100 transition-colors"
      >
        <BookOpen size={11} />
        {label}
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && verse.sanskrit && (
        <div className="mt-2 bg-orange-50/60 border border-orange-100 rounded-xl p-3 text-xs space-y-1">
          <p className="font-[family:var(--font-deva)] text-[#7B1A1A] font-medium leading-relaxed">
            {verse.sanskrit}
          </p>
          {verse.transliteration && (
            <p className="text-gray-500 italic">{verse.transliteration}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AIChatClient({ userId, userName, tradition, initialPrompt, contextLabel }: Props) {
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [input,      setInput]      = useState(initialPrompt ?? '');
  const [loading,    setLoading]    = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);
  const { engine, isReady } = useEngine();

  // Tradition-aware content
  const suggestions = SUGGESTIONS_BY_TRADITION[tradition ?? 'hindu'] ?? SUGGESTIONS_BY_TRADITION.hindu;
  const greetingMap: Record<string, string> = {
    hindu:    'Hari Om 🕉️',
    sikh:     'Sat Sri Akal ☬',
    buddhist: 'Namo Buddhaya ☸️',
    jain:     'Jai Jinendra 🤲',
  };
  const greeting = greetingMap[tradition ?? 'hindu'] ?? 'Namaste 🙏';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function newId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  async function sendMessage(text?: string) {
    const msgText = (text ?? input).trim();
    if (!msgText || loading) return;

    setInput('');
    setShowSuggestions(false);

    const userMsg: Message = { id: newId(), role: 'user', text: msgText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // ── Path A: RAG via engine.search.ask() ──────────────────────────────────
    // Uses pgvector to find relevant scripture chunks, then Gemini explains them.
    // Falls through to Path B if engine not ready or user has no scripture indexed.
    if (isReady && engine) {
      try {
        const ragResult = await engine.search.ask(msgText, userId, {
          matchCount:      5,
          matchThreshold:  0.25,
          withExplanation: true,
        });

        if (ragResult.answer) {
          const modelMsg: Message = {
            id:        newId(),
            role:      'model',
            text:      ragResult.answer,
            timestamp: new Date(),
            verses:    (ragResult.verses ?? []).slice(0, 3).map(v => ({
              text_id:         v.verse?.text_id,
              chapter:         v.verse?.chapter,
              verse:           v.verse?.verse,
              sanskrit:        v.verse?.sanskrit,
              transliteration: v.verse?.transliteration,
              source_label:    v.verse?.text_id?.replace(/_/g, ' '),
            })),
            fromRag: true,
          };
          setMessages(prev => [...prev, modelMsg]);
          setLoading(false);
          return;
        }
      } catch (ragErr) {
        console.warn('[AiChat] RAG failed, falling back to direct API:', ragErr);
        // Fall through to Path B
      }
    }

    // ── Path B: Fallback — tradition-aware Gemini via API route ─────────────
    // Used when: corpus not yet seeded, engine not ready, or RAG returned empty answer.
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
        id:        newId(),
        role:      'model',
        text:      data.reply,
        timestamp: new Date(),
        fromRag:   false,
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
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, #ff770220, #d4a01720)' }}>
            ✨
          </div>
          <div>
            <h1 className="font-display font-bold text-gray-900 text-lg leading-tight">Dharma Mitra</h1>
            <p className="text-xs text-gray-400">AI guide for life & spirituality</p>
          </div>
        </div>
        {!isEmpty && (
          <button onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-gray-500 hover:text-[#7B1A1A] border border-gray-200 hover:border-orange-200 transition bg-white">
            <RotateCcw size={12} />
            New chat
          </button>
        )}
      </div>

      {/* ── Messages area ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-0 pr-1">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 space-y-6">
            {/* Welcome */}
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-4xl"
                style={{ background: 'linear-gradient(135deg, #ff770218, #d4a01718)' }}>
                🙏
              </div>
              <h2 className="font-display font-bold text-xl text-gray-900">
                {greeting}, {userName}
              </h2>
              <p className="text-sm text-gray-500 max-w-xs">
                Ask me anything — life questions, spiritual wisdom, dharmic perspectives, or just a thoughtful conversation.
              </p>
            </div>

            {/* Suggestions */}
            {showSuggestions && (
              <div className="w-full max-w-sm space-y-2">
                <p className="text-xs text-gray-400 font-medium">Try asking…</p>
                <div className="flex flex-col gap-2">
                  {suggestions.slice(0, 4).map(s => (
                    <button key={s} onClick={() => sendMessage(s)}
                      className="text-left px-4 py-2.5 rounded-xl bg-white border border-orange-100 text-sm text-gray-700 hover:border-orange-300 hover:text-[#7B1A1A] transition shadow-sm">
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
      <div className="pt-3 border-t border-orange-100/60 mt-2">
        {/* Quick suggestion chips (after conversation starts) */}
        {!isEmpty && !loading && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {suggestions.slice(4).map(s => (
              <button key={s} onClick={() => sendMessage(s)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white border border-orange-100 text-xs text-gray-600 hover:border-orange-300 hover:text-[#7B1A1A] transition whitespace-nowrap">
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition overflow-hidden">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything… Shift+Enter for new line"
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
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white transition disabled:opacity-40"
            style={{ background: '#7B1A1A', flexShrink: 0 }}>
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Dharma Mitra can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
