'use client';

// ─── AI Chat Floating Action Button ──────────────────────────────────────────
// Renders a persistent FAB (Bot icon) above the bottom nav on every page.
// Tapping opens a full-screen bottom sheet with the Dharma Mitra AI chat.
// Conversation is preserved as long as the FAB is mounted (session-scoped).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, RotateCcw, BookOpen, ChevronDown } from 'lucide-react';

interface ScriptureRef {
  text_id?: string;
  chapter?: number;
  verse?: number;
  sanskrit?: string;
  transliteration?: string;
  source_label?: string;
}

interface Message {
  id:        string;
  role:      'user' | 'model';
  text:      string;
  timestamp: Date;
  verses?:   ScriptureRef[];
  fromRag?:  boolean;
}

interface Props {
  userId:    string;
  tradition: string;
  userName:  string;
  isGuest?:  boolean;
}

const SUGGESTIONS: Record<string, string[]> = {
  hindu:    ['What does the Gita say about anxiety?', 'How do I start a daily sadhana?', 'What is the meaning of dharma?', 'How to balance work and spiritual life?'],
  sikh:     ['What is the meaning of Ik Onkar?', 'How do I start a Nitnem practice?', 'What does Gurbani say about hardship?', 'Explain Seva and its importance'],
  buddhist: ['What is the Noble Eightfold Path?', 'How do I start meditating daily?', 'Explain impermanence simply', 'How to cultivate Metta?'],
  jain:     ['What is Ahimsa in daily life?', 'What does the Namokar Mantra mean?', 'Explain Anekantavada', 'What are the Five Major Vows?'],
};

const GREETINGS: Record<string, string> = {
  hindu: 'Hari Om 🕉️', sikh: 'Sat Sri Akal ☬', buddhist: 'Namo Buddhaya ☸️', jain: 'Jai Jinendra 🤲',
};

function formatVerseLabel(v: ScriptureRef): string {
  if (v.source_label) return v.source_label;
  const TEXT_LABELS: Record<string, string> = {
    bhagavad_gita: 'Bhagavad Gita', gita: 'Bhagavad Gita',
    dhammapada: 'Dhammapada', guru_granth_sahib: 'Guru Granth Sahib',
    upanishads: 'Upanishad', yoga_sutras: 'Yoga Sūtras', ramayana: 'Rāmāyaṇa',
  };
  const bookName = TEXT_LABELS[(v.text_id ?? '').toLowerCase()] ?? (v.text_id ?? '').replace(/_/g, ' ');
  if (v.chapter && v.verse) return `${bookName} ${v.chapter}.${v.verse}`;
  if (v.chapter) return `${bookName} Ch. ${v.chapter}`;
  return bookName;
}

function VerseChip({ verse }: { verse: ScriptureRef }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-[color:var(--brand-primary)] font-medium rounded-full px-2.5 py-0.5 transition-colors"
        style={{ background: 'rgba(200,146,74,0.10)', border: '1px solid rgba(200,146,74,0.18)' }}>
        <BookOpen size={10} />
        {formatVerseLabel(verse)}
        <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && verse.sanskrit && (
        <div className="mt-1.5 rounded-xl p-2.5 text-xs" style={{ background: 'rgba(200,146,74,0.08)', border: '1px solid rgba(200,146,74,0.16)' }}>
          <p className="font-[family:var(--font-deva)] font-medium leading-relaxed" style={{ color: 'var(--text-cream)' }}>{verse.sanskrit}</p>
          {verse.transliteration && <p className="text-[color:var(--brand-muted)] italic mt-0.5">{verse.transliteration}</p>}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2 mb-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${isUser ? 'bg-[#7B1A1A] text-white' : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'}`}>
        {isUser ? '🙏' : '✨'}
      </div>
      <div className={`max-w-[82%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        <div className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'bg-[#7B1A1A] text-white rounded-tr-sm' : 'rounded-tl-sm border'}`}
          style={!isUser ? { background: 'var(--surface-raised)', borderColor: 'rgba(200,146,74,0.16)', color: 'var(--brand-ink)' } : undefined}>
          {msg.text}
          {!isUser && msg.verses && msg.verses.length > 0 && (
            <div className="mt-1">{msg.verses.map((v, i) => <VerseChip key={i} verse={v} />)}</div>
          )}
        </div>
        <span className="text-[9px] text-[color:var(--text-dim)] px-1">
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {msg.fromRag && <span className="ml-1.5 text-orange-400">📖</span>}
        </span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 mb-3">
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs">✨</div>
      <div className="border rounded-2xl rounded-tl-sm px-3 py-2.5" style={{ background: 'var(--surface-raised)', borderColor: 'rgba(200,146,74,0.16)' }}>
        <div className="flex gap-1 items-center h-4">
          {[0, 150, 300].map(delay => (
            <span key={delay} className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AIChatFAB({ userId, tradition, userName, isGuest = false }: Props) {
  const [open,           setOpen]           = useState(false);
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [input,          setInput]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [showSuggestions,setShowSuggestions]= useState(true);
  const [portalTarget,   setPortalTarget]   = useState<Element | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setPortalTarget(document.body); }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const suggestions = SUGGESTIONS[tradition] ?? SUGGESTIONS.hindu;
  const greeting    = GREETINGS[tradition] ?? 'Namaste 🙏';
  const isEmpty     = messages.length === 0;

  function newId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

  async function sendMessage(text?: string) {
    const msgText = (text ?? input).trim();
    if (!msgText || loading) return;
    setInput('');
    setShowSuggestions(false);

    const userMsg: Message = { id: newId(), role: 'user', text: msgText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const history = messages.map(m => ({ role: m.role, text: m.text }));
    try {
      const res = await fetch('/api/ai/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: msgText, history, tradition }),
      });
      const data = await res.json();
      if (!res.ok) { setLoading(false); return; }
      setMessages(prev => [...prev, {
        id: newId(), role: 'model', text: data.reply, timestamp: new Date(), fromRag: false,
      }]);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setShowSuggestions(true);
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  if (isGuest) return null;

  const sheet = portalTarget ? createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 9990 }}
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />

          {/* Chat sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 flex flex-col rounded-t-[2rem] overflow-hidden"
            style={{
              zIndex: 9991,
              background: 'var(--surface-raised)',
              border: '1px solid rgba(200,146,74,0.14)',
              maxHeight: '92dvh',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36, mass: 0.9 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-0 flex-shrink-0">
              <div className="w-10 h-1 rounded-full opacity-25" style={{ background: '#C8924A' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b" style={{ borderColor: 'rgba(200,146,74,0.12)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg"
                  style={{ background: 'linear-gradient(135deg, #ff770220, #d4a01720)' }}>
                  ✨
                </div>
                <div>
                  <h2 className="font-display font-bold text-[color:var(--text-cream)] text-base leading-tight">Dharma Mitra</h2>
                  <p className="text-[10px] text-[color:var(--text-dim)]">Your AI spiritual guide</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isEmpty && (
                  <button onClick={clearChat}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs border transition"
                    style={{ background: 'var(--surface-raised)', borderColor: 'rgba(200,146,74,0.18)', color: 'var(--brand-muted)' }}>
                    <RotateCcw size={11} /> New
                  </button>
                )}
                <button onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <X size={15} className="text-[color:var(--brand-muted)]" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {isEmpty ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-5 pb-4">
                  <div className="space-y-2">
                    <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-3xl"
                      style={{ background: 'linear-gradient(135deg, #ff770218, #d4a01718)' }}>
                      🙏
                    </div>
                    <h3 className="font-display font-bold text-lg text-[color:var(--text-cream)]">{greeting}, {userName}</h3>
                    <p className="text-xs text-[color:var(--brand-muted)] max-w-xs leading-relaxed">
                      Ask me anything — dharmic wisdom, spiritual practice, life questions.
                    </p>
                  </div>
                  {showSuggestions && (
                    <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
                      {suggestions.slice(0, 4).map(s => (
                        <button key={s} onClick={() => sendMessage(s)}
                          className="text-left p-2.5 rounded-xl text-xs transition leading-snug border"
                          style={{ background: 'var(--surface-raised)', borderColor: 'rgba(200,146,74,0.18)', color: 'var(--brand-muted)' }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
                  {loading && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="flex-shrink-0 px-3 py-2 border-t" style={{ borderColor: 'rgba(200,146,74,0.12)', background: 'var(--surface-base)' }}>
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a dharmic question…"
                  disabled={loading}
                  className="flex-1 resize-none rounded-2xl border px-3.5 py-2.5 text-sm focus:outline-none transition disabled:opacity-50"
                  style={{ background: 'var(--surface-raised)', borderColor: 'rgba(200,146,74,0.2)', color: 'var(--brand-ink)', minHeight: '40px', maxHeight: '120px' } as React.CSSProperties}
                />
                <motion.button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  whileTap={{ scale: 0.92 }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all"
                  style={{ background: 'linear-gradient(135deg, #c8920a, #d4a818)' }}
                >
                  <Send size={16} className="text-[#1c1c1a]" />
                </motion.button>
              </div>
              <p className="text-[9px] text-[color:var(--text-dim)] text-center mt-1.5">
                Dharma Mitra may make mistakes. Use discernment.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalTarget
  ) : null;

  return (
    <>
      {/* FAB — right side, above bottom nav */}
      <AnimatePresence>
        {!open && (
          <motion.button
            onClick={() => setOpen(true)}
            className="fixed right-4 z-[9989] flex items-center justify-center rounded-full shadow-lg"
            style={{
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 82px)',
              width:  '52px',
              height: '52px',
              background: 'linear-gradient(135deg, #c8920a 0%, #d4a818 50%, #b07a08 100%)',
              boxShadow: '0 4px 20px rgba(212,166,70,0.45)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
            title="Dharma Mitra — AI Guide"
          >
            <Bot size={22} className="text-[#1c1c1a]" />
          </motion.button>
        )}
      </AnimatePresence>

      {sheet}
    </>
  );
}
