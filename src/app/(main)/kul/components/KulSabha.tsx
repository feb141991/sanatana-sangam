'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Sparkles, MessageSquare, Heart, Lightbulb } from 'lucide-react';
import { MessageRow, MemberRow } from '../types';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const SACRED_EMOJIS = ['🙏', '🕉️', '📿', '🪔', '🌸', '🥥', '🐚', '🕯️'];

const DISCUSSION_PROMPTS = [
  "What spiritual goal are we focusing on this week?",
  "Which ancestor's story should we share today?",
  "Planning the next family puja together...",
  "Daily gratitude: What are we thankful for as a Kul?",
  "Reflecting on today's daily verse...",
  "How can we better support each other's sadhana?"
];

export function KulSabha({
  messages,
  members,
  userId,
  onSendMessage,
}: {
  messages: MessageRow[];
  members: MemberRow[];
  userId: string;
  onSendMessage: (content: string) => void;
}) {
  const { t } = useLanguage();
  const [content, setContent] = useState('');
  const [showPrompts, setShowPrompts] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<MessageRow[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync optimistic messages with real messages
  useEffect(() => {
    setOptimisticMessages([]);
  }, [messages]);

  const allMessages = useMemo(() => [...messages, ...optimisticMessages], [messages, optimisticMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [allMessages]);

  const handleSend = (text?: string) => {
    const finalContent = text || content;
    if (!finalContent.trim()) return;

    // Optimistic Update
    const tempId = 'temp-' + Date.now();
    const newMessage: MessageRow = {
      id: tempId,
      sender_id: userId,
      content: finalContent,
      created_at: new Date().toISOString(),
      reaction: null,
      profiles: {
        full_name: members.find(m => m.user_id === userId)?.profiles?.full_name || 'Me',
        username: members.find(m => m.user_id === userId)?.profiles?.username || 'me',
        avatar_url: members.find(m => m.user_id === userId)?.profiles?.avatar_url || null,
      }
    };
    
    setOptimisticMessages(prev => [...prev, newMessage]);
    onSendMessage(finalContent);
    setContent('');
    setShowPrompts(false);
  };

  const currentPrompt = useMemo(() => {
    const day = new Date().getDate();
    return DISCUSSION_PROMPTS[day % DISCUSSION_PROMPTS.length];
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[550px] glass-panel rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl relative">
      {/* Background Sacred Geometry Watermark */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center overflow-hidden">
        <div className="text-[400px] select-none font-bold">🕉️</div>
      </div>

      {/* Header */}
      <div className="px-6 py-4 border-b border-white/8 bg-white/10 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400/20 to-orange-600/20 flex items-center justify-center text-xl shadow-inner border border-white/10">
            💬
          </div>
          <div>
            <h2 className="text-lg font-bold theme-ink premium-serif leading-none">{t('kulSabhaTitle')}</h2>
            <p className="text-[10px] theme-muted uppercase tracking-[0.2em] font-bold mt-1.5 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {t('kulSabhaDesc')}
            </p>
          </div>
        </div>
        <div className="flex -space-x-2">
          {members.slice(0, 5).map(m => (
            <motion.div 
              key={m.id} 
              whileHover={{ y: -5, zIndex: 20 }}
              className="w-9 h-9 rounded-full border-2 border-[var(--surface-soft)] overflow-hidden bg-slate-200 shadow-md"
            >
              {m.profiles?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.profiles.avatar_url} alt={m.profiles.username ?? ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-slate-500">
                  {(m.profiles?.full_name ?? m.profiles?.username ?? '?')[0]}
                </div>
              )}
            </motion.div>
          ))}
          {members.length > 5 && (
            <div className="w-9 h-9 rounded-full border-2 border-[var(--surface-soft)] bg-white/10 backdrop-blur-md flex items-center justify-center text-[10px] font-bold theme-ink shadow-md">
              +{members.length - 5}
            </div>
          )}
        </div>
      </div>

      {/* Discussion Prompt Card */}
      <AnimatePresence>
        {showPrompts && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-6 py-4 bg-orange-50/80 backdrop-blur-md border-b border-orange-100 z-20"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                <Lightbulb size={18} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-orange-800 uppercase tracking-wider mb-1">Today&apos;s Discussion Topic</p>
                <p className="text-sm font-medium theme-ink italic leading-relaxed">&ldquo;{currentPrompt}&rdquo;</p>
              </div>
              <button 
                onClick={() => handleSend(currentPrompt)}
                className="text-[10px] font-bold bg-orange-600 text-white px-3 py-1.5 rounded-xl hover:bg-orange-700 transition-colors shadow-sm"
              >
                Use This
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin z-10"
      >
        <AnimatePresence initial={false}>
          {allMessages.map((msg, i) => {
            const isMe = msg.sender_id === userId;
            const isTemp = msg.id.toString().startsWith('temp-');
            const showAvatar = i === 0 || allMessages[i-1].sender_id !== msg.sender_id;
            
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {!isMe && (
                  <div className="w-9 h-9 rounded-2xl overflow-hidden flex-shrink-0 bg-white/20 backdrop-blur-md border border-white/10 shadow-sm">
                    {showAvatar && (
                      msg.profiles?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={msg.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[12px] font-bold theme-muted uppercase">
                          {(msg.profiles?.full_name ?? msg.profiles?.username ?? '?')[0]}
                        </div>
                      )
                    )}
                  </div>
                )}
                
                <div className={`max-w-[75%] space-y-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
                  {showAvatar && !isMe && (
                     <p className="text-[10px] font-bold theme-muted ml-1 uppercase tracking-widest opacity-60">
                       {msg.profiles?.full_name || msg.profiles?.username}
                     </p>
                  )}
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className={`px-5 py-3 rounded-2xl text-sm shadow-md leading-relaxed ${
                      isMe 
                        ? 'bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-strong)] text-white rounded-br-none' 
                        : 'bg-white/40 backdrop-blur-xl border border-white/20 theme-ink rounded-bl-none'
                    } ${isTemp ? 'opacity-70 animate-pulse' : ''}`}
                  >
                    {msg.content}
                  </motion.div>
                  <p className={`text-[9px] theme-dim px-1 font-medium ${isMe ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Sacred Emoji Bar */}
      <div className="px-6 py-2 bg-white/5 border-t border-white/5 flex items-center gap-4 z-10">
        <p className="text-[9px] font-bold theme-muted uppercase tracking-widest whitespace-nowrap">Sacred Reactions</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {SACRED_EMOJIS.map(emoji => (
            <motion.button
              key={emoji}
              whileHover={{ scale: 1.2, y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSend(emoji)}
              className="text-lg transition-all filter hover:drop-shadow-lg"
            >
              {emoji}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-5 bg-white/10 backdrop-blur-2xl border-t border-white/10 z-10">
        <div className="flex gap-4 items-center">
           <button 
             onClick={() => setShowPrompts(!showPrompts)}
             className={`p-2.5 rounded-xl transition-all ${showPrompts ? 'bg-orange-100 text-orange-600 shadow-inner' : 'bg-white/5 text-[color:var(--brand-muted)] hover:bg-white/10'}`}
           >
              <Lightbulb size={20} />
           </button>
           <div className="flex-1 relative group">
             <input
               value={content}
               onChange={e => setContent(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && handleSend()}
               placeholder={t('kulSabhaPlaceholder')}
               className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-[var(--brand-primary)]/40 focus:bg-white/10 outline-none text-sm theme-ink transition-all placeholder:text-[color:var(--brand-muted)] shadow-inner"
             />
             <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
               <Sparkles size={16} className="text-[color:var(--brand-primary)] opacity-40 group-focus-within:opacity-100 transition-opacity" />
             </div>
           </div>
           <motion.button
             onClick={() => handleSend()}
             disabled={!content.trim()}
             whileHover={content.trim() ? { scale: 1.05 } : {}}
             whileTap={content.trim() ? { scale: 0.95 } : {}}
             className="w-14 h-14 rounded-2xl flex items-center justify-center text-white disabled:opacity-30 transition-all shadow-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-strong)]"
           >
             <Send size={22} strokeWidth={2.5} />
           </motion.button>
        </div>
      </div>
    </div>
  );
}
