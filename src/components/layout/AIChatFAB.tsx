'use client';

// ─── AI Chat Floating Action Button ──────────────────────────────────────────
// Draggable FAB — user can reposition it anywhere on screen.
// Position persists via localStorage.
// Hides when the BottomNav quick-action menu is open (via CustomEvent).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { X, Send, RotateCcw, BookOpen, ChevronDown } from 'lucide-react';

// ── Shankha (Conch Shell) SVG Icon ────────────────────────────────────────────
function ShankhaIcon({ size = 22, color = 'currentColor', opacity = 1 }: { size?: number; color?: string; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ opacity }}>
      {/* Main conch body */}
      <path
        d="M5.8 15.8C4.3 13.9 4.1 11.3 5.2 9C6.4 6.3 9.1 4.6 12.1 5C15.1 5.4 17.4 7.9 17.2 11C17 14 14.6 16.6 11.5 17.3C9.4 17.8 7.2 17.2 5.8 15.8Z"
        fill={color}
      />
      {/* Pointed spire protruding upper-right */}
      <path
        d="M12.1 5C13.3 3.3 15.6 1.9 17.2 2.5C18.8 3.1 18.3 5.8 16.4 7.1C15.2 7.9 13.2 8.2 12 7.2"
        fill={color}
        opacity="0.85"
      />
      {/* Mouth / opening - small flare */}
      <path
        d="M5.8 15.8L3.5 19.8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Inner spiral groove */}
      <path
        d="M11 13C10.2 11.3 11.1 9.2 13.1 9.7C15 10.2 14.8 12.8 13 13.2"
        stroke="white"
        strokeWidth="0.9"
        strokeOpacity="0.50"
        fill="none"
        strokeLinecap="round"
      />
      {/* Second subtle groove */}
      <path
        d="M9.5 11.5C9 10 9.8 8.5 11.2 8.5"
        stroke="white"
        strokeWidth="0.7"
        strokeOpacity="0.28"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

const FAB_SIZE   = 52;
const FAB_RIGHT  = 16; // initial right offset (px)
const FAB_BOTTOM = 82; // initial bottom offset above nav (px)
const POS_KEY    = 'ai-fab-pos';

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
      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${isUser ? 'bg-[#7B1A1A] text-white' : ''}`}
        style={!isUser ? { background: 'linear-gradient(135deg, #c8920a 0%, #d4a818 100%)' } : undefined}>
        {isUser ? '🙏' : <ShankhaIcon size={16} color="#1c1c1a" />}
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
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #c8920a 0%, #d4a818 100%)' }}>
        <ShankhaIcon size={15} color="#1c1c1a" />
      </div>
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
  const [open,            setOpen]           = useState(false);
  const [messages,        setMessages]       = useState<Message[]>([]);
  const [input,           setInput]          = useState('');
  const [loading,         setLoading]        = useState(false);
  const [showSuggestions, setShowSuggestions]= useState(true);
  const [portalTarget,    setPortalTarget]   = useState<Element | null>(null);
  const [menuObscuring,   setMenuObscuring]  = useState(false); // quick-action menu is open
  const [constraints,     setConstraints]    = useState({ left: 0, right: 0, top: 0, bottom: 0 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);
  const didDrag        = useRef(false); // distinguish tap vs drag

  // Persisted drag position (transforms from the default anchor)
  const fabX = useMotionValue(0);
  const fabY = useMotionValue(0);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setPortalTarget(document.body);

    // Restore saved drag position
    try {
      const saved = JSON.parse(localStorage.getItem(POS_KEY) ?? 'null');
      if (saved?.x != null) fabX.set(saved.x);
      if (saved?.y != null) fabY.set(saved.y);
    } catch { /* ok */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Drag constraints — recomputed on resize ───────────────────────────────
  useEffect(() => {
    function compute() {
      setConstraints({
        right:  0,                                                   // can't go past default anchor
        left:   -(window.innerWidth  - FAB_SIZE - FAB_RIGHT * 2),   // to left edge
        bottom: 0,
        top:    -(window.innerHeight - FAB_SIZE - FAB_BOTTOM - 72), // to near top (72px safe-area pad)
      });
    }
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  // ── Listen for quick-menu visibility signal from BottomNav ────────────────
  useEffect(() => {
    function handler(e: Event) {
      setMenuObscuring((e as CustomEvent<{ hidden: boolean }>).detail.hidden);
    }
    window.addEventListener('ai-fab-visibility', handler);
    return () => window.removeEventListener('ai-fab-visibility', handler);
  }, []);

  // ── Auto-scroll chat ──────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Auto-resize textarea ──────────────────────────────────────────────────
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

  function saveFabPos() {
    try { localStorage.setItem(POS_KEY, JSON.stringify({ x: fabX.get(), y: fabY.get() })); }
    catch { /* ok */ }
  }

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

  // ── Chat sheet portal ─────────────────────────────────────────────────────
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
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #c8920a22, #d4a81822)', border: '1px solid rgba(200,146,74,0.22)' }}>
                  <ShankhaIcon size={20} color="rgba(200,146,74,0.90)" />
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

  // ── FAB — draggable, hides when chat or quick-menu open ──────────────────
  const fabHidden = open || menuObscuring;

  return (
    <>
      {/* Draggable FAB container */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={constraints}
        onDragStart={() => { didDrag.current = false; }}
        onDrag={() => { didDrag.current = true; }}
        onDragEnd={saveFabPos}
        onClick={() => {
          if (didDrag.current) { didDrag.current = false; return; }
          setOpen(true);
        }}
        className="fixed z-[9989] cursor-grab active:cursor-grabbing"
        style={{
          right:  FAB_RIGHT,
          bottom: `calc(env(safe-area-inset-bottom, 0px) + ${FAB_BOTTOM}px)`,
          x: fabX,
          y: fabY,
          touchAction: 'none', // required for mobile pointer-events
          width:  FAB_SIZE,
          height: FAB_SIZE,
        }}
        animate={{
          opacity:       fabHidden ? 0 : 1,
          scale:         fabHidden ? 0.7 : 1,
          pointerEvents: fabHidden ? 'none' : 'auto',
        }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        title="Dharma Mitra — AI Guide (drag to move)"
      >
        <motion.div
          className="w-full h-full rounded-full flex items-center justify-center shadow-lg select-none relative overflow-hidden"
          style={{
            background:  'linear-gradient(135deg, #c8920a 0%, #d4a818 50%, #b07a08 100%)',
            boxShadow:   '0 4px 20px rgba(212,166,70,0.45)',
          }}
          whileTap={{ scale: 0.9 }}
        >
          {/* Animated glow ring */}
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ border: '1.5px solid rgba(255,230,140,0.55)' }}
            animate={{ scale: [1, 1.22, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <ShankhaIcon size={22} color="#1c1c1a" />
        </motion.div>
      </motion.div>

      {sheet}
    </>
  );
}
