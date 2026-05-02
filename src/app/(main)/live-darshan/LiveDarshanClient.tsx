'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, MapPin, Clock, Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LIVE_STREAMS, LiveStream, LiveStreamCategory } from '@/lib/live-streams';
import TopBar from '@/components/layout/TopBar';

interface LiveDarshanClientProps {
  tradition: string;
  userId: string;
}

export default function LiveDarshanClient({ tradition, userId }: LiveDarshanClientProps) {
  const [activeCategory, setActiveCategory] = useState<LiveStreamCategory | 'all'>('mandir');
  const [activePlayer, setActivePlayer] = useState<string | null>(null);

  const filteredStreams = LIVE_STREAMS.filter(stream => {
    if (activeCategory !== 'all' && stream.category !== activeCategory) return false;
    // We can filter by tradition if needed, but 'All' usually shows popular ones
    return true;
  });

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] flex flex-col pb-28">
      <TopBar userId={userId} tradition={tradition} />

      <main className="flex-1 px-4 pt-20 max-w-2xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[28px] font-serif font-bold text-[var(--divine-text)]">Live Darshan</h1>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">Live Only</span>
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto no-scrollbar py-1">
          {['all', 'mandir', 'katha', 'satsang'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as any)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold capitalize whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-[var(--divine-saffron)] text-white shadow-[0_4px_12px_rgba(216,138,28,0.3)]'
                  : 'bg-[var(--divine-surface)] text-[var(--divine-muted)] border border-[var(--divine-border)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Live Streams List */}
        <div className="space-y-6">
          <AnimatePresence>
            {filteredStreams.map((stream) => (
              <motion.div
                key={stream.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-[1.5rem] overflow-hidden bg-[var(--divine-surface)] border border-[var(--divine-border)] shadow-sm"
              >
                {/* Card Header */}
                <div className="p-5 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[var(--divine-text)] mb-2">{stream.title}</h2>
                    <div className="flex flex-col gap-1.5">
                      <p className="text-xs text-[var(--divine-muted)] flex items-center gap-1.5">
                        <MapPin size={12} />
                        {stream.location}
                      </p>
                      <p className="text-xs text-[var(--divine-muted)] flex items-center gap-1.5">
                        <Clock size={12} />
                        {stream.schedule}
                      </p>
                    </div>
                  </div>
                  <button className="p-2.5 rounded-full bg-[var(--divine-saffron)]/10 text-[var(--divine-saffron)]">
                    <Bell size={18} />
                  </button>
                </div>

                {/* Player Area */}
                <div className="relative p-3 pt-0">
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border-4 border-[#3A2618] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                    {activePlayer === stream.id ? (
                      <div className="w-full h-full relative">
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/live_stream?channel=${stream.youtubeChannelId}&autoplay=1&mute=1&controls=1`}
                          title={`${stream.title} Live Stream`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0"
                        />
                        <button 
                          onClick={() => setActivePlayer(null)}
                          className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 backdrop-blur-sm"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-full relative cursor-pointer group" onClick={() => setActivePlayer(stream.id)}>
                        <Image 
                          src={stream.thumbnailUrl} 
                          alt={stream.title} 
                          fill 
                          className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                        
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                          <div className="w-16 h-12 bg-red-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:bg-red-500 transition-colors">
                            <Play className="text-white fill-white" size={24} />
                          </div>
                          <h3 className="text-white font-serif font-bold text-lg mb-1 drop-shadow-md">
                            {stream.title} is LIVE
                          </h3>
                          <p className="text-white/80 text-xs drop-shadow-md">
                            Tap to start live darshan stream
                          </p>
                        </div>

                        <div className="absolute top-3 right-3 px-2 py-1 rounded bg-red-600 flex items-center gap-1.5 shadow-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          <span className="text-[9px] font-bold text-white uppercase tracking-wider">Live</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
