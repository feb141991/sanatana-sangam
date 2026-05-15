'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Image as ImageIcon } from 'lucide-react';
import { MessageRow, MemberRow } from '../types';
import { useLanguage } from '@/lib/i18n/LanguageContext';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!content.trim()) return;
    onSendMessage(content);
    setContent('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[500px] glass-panel rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/8 bg-white/5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold theme-ink premium-serif">{t('kulSabhaTitle')}</h2>
          <p className="text-[10px] theme-muted uppercase tracking-widest font-bold">{t('kulSabhaDesc')}</p>
        </div>
        <div className="flex -space-x-2">
          {members.slice(0, 5).map(m => (
            <div key={m.id} className="w-8 h-8 rounded-full border-2 border-[var(--surface-soft)] overflow-hidden bg-slate-200">
              {m.profiles?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.profiles.avatar_url} alt={m.profiles.username ?? ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                  {(m.profiles?.full_name ?? m.profiles?.username ?? '?')[0]}
                </div>
              )}
            </div>
          ))}
          {members.length > 5 && (
            <div className="w-8 h-8 rounded-full border-2 border-[var(--surface-soft)] bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
              +{members.length - 5}
            </div>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin"
      >
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === userId;
          const showAvatar = i === 0 || messages[i-1].sender_id !== msg.sender_id;
          
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {!isMe && (
                <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 border border-black/5">
                  {showAvatar && (
                    msg.profiles?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={msg.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                        {(msg.profiles?.full_name ?? msg.profiles?.username ?? '?')[0]}
                      </div>
                    )
                  )}
                </div>
              )}
              
              <div className={`max-w-[80%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                {showAvatar && !isMe && (
                   <p className="text-[10px] font-bold theme-muted ml-1 uppercase tracking-wider">
                     {msg.profiles?.full_name || msg.profiles?.username}
                   </p>
                )}
                <div 
                  className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                    isMe 
                      ? 'bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-strong)] text-white rounded-br-none' 
                      : 'bg-white/10 border border-white/5 theme-ink rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
                <p className={`text-[8px] theme-dim px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 bg-white/5 border-t border-white/8">
        <div className="flex gap-3 items-center">
           <button className="p-2 text-[color:var(--brand-muted)] hover:text-[color:var(--brand-ink)] transition-colors">
              <Smile size={20} />
           </button>
           <div className="flex-1 relative">
             <input
               value={content}
               onChange={e => setContent(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && handleSend()}
               placeholder={t('kulSabhaPlaceholder')}
               className="w-full px-5 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-[var(--brand-primary)]/40 outline-none text-sm theme-ink placeholder:text-[color:var(--brand-muted)]"
             />
           </div>
           <button
             onClick={handleSend}
             disabled={!content.trim()}
             className="w-12 h-12 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 transition-all shadow-lg"
             style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))' }}
           >
             <Send size={18} />
           </button>
        </div>
      </div>
    </div>
  );
}
