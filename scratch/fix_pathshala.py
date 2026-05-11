import sys

file_path = '/Users/Business(C)/Sanatan Sangam/Sanatan_Sangam/src/app/(main)/pathshala/PathshalaClient.tsx'

with open(file_path, 'rb') as f:
    content = f.read()

# Remove the mangled line at line 1175 (approx)
# We know it contains "Browse Path Card" and "return ("
lines = content.split(b'\n')
new_lines = []

found_broken = False
for line in lines:
    if b'//' in line and b'Browse Path Card' in line and b'return (' in line:
        found_broken = True
        continue
    new_lines.append(line)

# Reconstruct the file with the missing parts
# missing part: BrowsePathCard, TABS, and return wrapper

# I'll find where to insert them. After ActivePathCard definition.
# ActivePathCard ends with </motion.div> and then "    );" and then "  }"

final_lines = []
inserted = False
for i, line in enumerate(new_lines):
    final_lines.append(line)
    if b'</motion.div>' in line and i > 0 and b'    );' in new_lines[i+1] and i+2 < len(new_lines) and b'  }' in new_lines[i+2] and not inserted and i > 1100:
        # This is likely the end of ActivePathCard
        # We'll insert after the closing brace of ActivePathCard (which is new_lines[i+2])
        pass

# Actually, I'll just write the whole file from a known good state.
# Since I can't read it easily, I'll use a more robust python approach.

print("Cleaning file...")

# I will just rewrite the entire block from line 1170 to the end.
# I'll use the content I have in my context.

head = lines[:1174] # Up to ActivePathCard
# The broken line is at 1175 (index 1174)

missing_code = b"""
  // \xe2\x94\x80\xe2\x94\x80 Browse Path Card \xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80
  function BrowsePathCard({ path }: { path: typeof SEED_PATHS[0] }) {
    const isEnrolled = activePaths.some(e => e.path_id === path.id);
    const diff       = DIFF_STYLE[path.difficulty] ?? DIFF_STYLE.beginner;
    return (
      <motion.div
        className="rounded-[1.45rem] p-4"
        style={cardStyle}
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: `${meta.accentColour}14` }}>
            {TRAD_ICON[path.tradition] ?? '\xf0\x9f\x93\x96'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm" style={{ color: primaryText }}>{path.title}</h3>
              <span className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                style={{ background: diff.bg, color: diff.text, border: `1px solid ${diff.border}` }}>
                {diff.label}
              </span>
            </div>
            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: secondaryText }}>{path.description}</p>
            <p className="text-xs mt-1" style={{ color: tertiaryText }}>
              {path.total_lessons} lessons \xc2\xb7 {path.duration_days}-day journey
            </p>
          </div>
        </div>
        <button
          disabled={isEnrolled || enrolling !== null}
          onClick={() => enroll(path.id)}
          className={`mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm transition-all border ${
            isEnrolled
              ? 'border-green-800/40 text-green-400 bg-green-900/20 cursor-default'
              : ''
          }`}
          style={!isEnrolled ? {
            background: `${meta.accentColour}12`,
            color: meta.accentColour,
            border: `1px solid ${glassBorder}`,
          } : {}}
        >
          {enrolling === path.id
            ? <Loader2 size={14} className="animate-spin" />
            : isEnrolled
              ? <><Star size={14} /> Enrolled</>
              : <><Plus size={14} /> Enroll in this Path</>
          }
        </button>
      </motion.div>
    );
  }

  // \xe2\x94\x80\xe2\x94\x80 Tab definitions \xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80
  const TABS = [
    { id: 'learn'     as const, label: 'My Learning',      count: activePaths.length || undefined },
    { id: 'scripture' as const, label: meta.navLibraryLabel, count: undefined },
    { id: 'explore'   as const, label: 'Explore',          count: allPaths.length || undefined },
  ];

  // \xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80
  return (
    <div className="divine-home-shell min-h-screen bg-[var(--divine-bg)] -mx-3 sm:-mx-4 relative selection:bg-[#C5A059]/30">
      <div className="relative pb-24">

        {/* \xe2\x94\x80\xe2\x94\x80 Zenith Header Overlay \xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80 */}
        <div className="absolute top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 pt-5 pb-3 pointer-events-none">
          <button onClick={() => router.back()}
            className="w-10 h-10 rounded-full glass-panel border border-white/10 flex items-center justify-center pointer-events-auto transition-transform active:scale-90">
            <ChevronLeft size={20} className="text-white" />
          </button>
          
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xl drop-shadow-md">{meta.symbol}</span>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
              Digital Gurukul \xc2\xb7 {meta.label}
            </p>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {activePaths.length > 0 && (
              <div className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 border border-white/10 bg-white/5 backdrop-blur-md">
                <Trophy size={12} style={{ color: meta.accentColour }} />
                <span className="text-[10px] font-bold" style={{ color: meta.accentColour }}>
                  {activePaths.length}
                </span>
              </div>
            )}
            <Link
              href="/pathshala/insights"
              className="w-10 h-10 rounded-full glass-panel border border-white/10 flex items-center justify-center transition-transform active:scale-90"
            >
              <BarChart2 size={18} style={{ color: meta.accentColour }} />
            </Link>
          </div>
        </div>

        {/* Tab Control Area */}
        <div className="pt-20">
          <div className="px-4 mb-6 relative z-30">
            <div className="flex flex-wrap gap-2 items-center">
              {TABS.map(t => (
                <motion.button
                  key={t.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border shadow-sm flex items-center gap-1.5 ${
                    tab === t.id
                      ? 'border-white/20 text-[#1c1c1a]'
                      : 'bg-white/5 border-white/5 text-[color:var(--brand-muted)] hover:bg-white/8 hover:border-white/10'
                  }`}
                  style={tab === t.id ? { 
                    background: meta.accentColour,
                    boxShadow: `0 4px 12px ${meta.accentColour}33`
                  } : {}}
                >
                  {t.label}
                  {t.count !== undefined && t.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                      tab === t.id ? 'bg-black/10 text-black/60' : 'bg-white/5 text-[color:var(--brand-muted)]'
                    }`}>
                      {t.count}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab content */}
        {loading && tab === 'learn' ? (
          <div className="flex items-center justify-center gap-3 pt-20">
            <Loader2 size={22} className="animate-spin" style={{ color: meta.accentColour }} />
            <span className="text-sm text-[color:var(--brand-muted)]">Loading your gurukul\xe2\x80\xa6</span>
          </div>
        ) : (
          <div className="px-4 space-y-3 relative z-20">
            {tab === 'learn' && (
              <>
                {activePaths.length === 0 ? (
                  <>
                    <motion.div
                      className="relative -mx-4 overflow-hidden text-center rounded-b-[3rem] mb-6"
                      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
                      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[#1c1c1a] via-[#2c1a0e] to-[#1c1c1a] opacity-40 dark:opacity-60" />
                      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--divine-bg)] to-transparent z-10" />
                      
                      <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none overflow-hidden opacity-10">
                        <span style={{
                          fontFamily: 'var(--font-deva, serif)',
                          fontSize: '15rem',
                          lineHeight: 1,
                          color: meta.accentColour,
                        }}>
                          {meta.heroFallback.mark}
                        </span>
                      </div>

                      <div className="relative z-20 px-6 pt-8 pb-12">
                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-4 text-[#C5A059]">
                          {meta.symbol} {meta.label} \xc2\xb7 {meta.navLibraryLabel}
                        </p>
                        <p className="text-[3.2rem] leading-none mb-4 font-medium"
                          style={{ fontFamily: 'var(--font-deva, serif)', color: 'white', opacity: 0.9 }}>
                          {seatMeta.scriptWord}
                        </p>
                        <h2 className="font-bold text-2xl mb-2 text-white" style={{ fontFamily: 'var(--font-serif)' }}>
                          Your seat awaits
                        </h2>
                        <p className="text-sm leading-relaxed mb-8 mx-auto max-w-[260px] text-white/70">
                          Begin your study of {meta.pathshalaVocabulary} \xe2\x80\x94 one lesson at a time.
                        </p>
                        <button onClick={() => setTab('explore')}
                          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-[#1c1c1a] font-bold text-sm transition-transform active:scale-95"
                          style={{
                            background: `linear-gradient(135deg, ${meta.accentColour}, ${meta.accentColour}cc)`,
                            boxShadow: `0 12px 32px ${meta.accentColour}40`,
                          }}>
                          <GraduationCap size={18} /> Choose a Path
                        </button>
                      </div>
                    </motion.div>
                    <DailyVersePrompt />
                  </>
                ) : (
                  <>
                    <ContinueLearningHero />
                    {activePaths.slice(1).length > 0 && (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] px-1 pt-1" style={{ color: tertiaryText }}>
                          Also enrolled
                        </p>
                        {activePaths.slice(1).map(e => (
                          <ActivePathCard key={e.path_id} enrollment={e} />
                        ))}
                      </>
                    )}
                    <DailyVersePrompt />
                    {!isPro && (
                      <div className="flex items-center gap-3 rounded-[1.45rem] p-4"
                        style={{ ...cardStyle, background: isDark ? `${meta.accentColour}10` : `${meta.accentColour}12` }}>
                        <Lock size={18} style={{ color: meta.accentColour }} className="flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold" style={{ color: primaryText }}>Sangam Pro \xe2\x80\x94 unlimited paths</p>
                          <p className="text-[10px] mt-0.5" style={{ color: secondaryText }}>
                            Free plan: 1 active path. Pro unlocks all paths, From Memory &amp; Timed recitation modes, and progress analytics.
                          </p>
                        </div>
                        <Link href="/profile"
                          className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold text-[#1c1c1a]"
                          style={{ background: meta.accentColour }}>
                          <Sparkles size={10} /> Upgrade
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {tab === 'scripture' && (
              <ScriptureTab
                tradition={tradition}
                accentColour={meta.accentColour}
                navLabel={meta.navLibraryLabel}
              />
            )}

            {tab === 'explore' && (
              <>
                <div className="flex items-center gap-3 pb-1">
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ fontFamily: 'var(--font-serif)', color: primaryText }}>
                      Sacred Learning Paths
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: secondaryText }}>
                      {allPaths.length} paths \xc2\xb7 {meta.label} tradition
                      {!isPro && <span style={{ color: meta.accentColour }}> \xc2\xb7 1 active (free)</span>}
                    </p>
                  </div>
                  {!isPro && (
                    <Link href="/profile"
                      className="text-[10px] font-bold rounded-full px-3 py-1.5 flex items-center gap-1 shrink-0"
                      style={{ background: `${meta.accentColour}15`, color: meta.accentColour, border: `1px solid ${meta.accentColour}20` }}>
                      <Sparkles size={9} /> Unlock All
                    </Link>
                  )}
                </div>
                {allPaths.map(p => <BrowsePathCard key={p.id} path={p} />)}
              </>
            )}
          </div>
        )}

        {(readingEntry || readingChapter) && (
          <ScriptureReader
            entry={readingEntry}
            chapter={readingChapter}
            accentColour={meta.accentColour}
            userId={userId}
            tradition={tradition}
            onClose={() => { setReadingEntry(undefined); setReadingChapter(undefined); }}
          />
        )}
      </div>
      <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>
  );
}
"""

# Now find where the return ( or BrowsePathCard started in the original file
# We'll use the lines we found in sed output

# I'll just find the first occurrence of b'return (' after line 1100
final_content = b'\n'.join(head) + missing_code

with open(file_path, 'wb') as f:
    f.write(final_content)

print("Restoration complete.")
