'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Share2, Copy, Bookmark, Volume2, VolumeX, Loader2, Type, Globe } from 'lucide-react';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export interface ReaderShellProps {
  // Navigation & Meta
  title: string;
  subtitle?: string;
  fallbackBackUrl: string;
  onBack?: () => void;

  // Aesthetic
  themeColor?: string; // Default #C5A059
  headerCenterContent?: ReactNode; // E.g. Om symbol or special badge
  ambientGlowColor?: string; // For traditional glow

  // Font Control
  fontPresets?: { label: string; [key: string]: any }[];
  fontStep?: number;
  setFontStep?: (step: number) => void;

  // Language Control
  languages?: { code: string; label: string }[];
  currentLanguage?: string;
  setLanguage?: (code: any) => void;

  // Toggles
  showTransliterationToggle?: boolean;
  isTransliterationOn?: boolean;
  onToggleTransliteration?: () => void;

  showMeaningToggle?: boolean;
  isMeaningOn?: boolean;
  onToggleMeaning?: () => void;

  // Quick Actions (Top Right)
  onTTS?: () => void;
  isSpeaking?: boolean;
  isTTSGenerating?: boolean;
  onCopy?: () => void;
  isCopied?: boolean;
  onShare?: () => void;
  ttsRate?: number;
  onTTSRateChange?: (rate: number) => void;

  // Bottom Quick Actions (Bottom Bar layout - optional)
  bottomBar?: ReactNode;

  shellBackgroundColor?: string;
  shellHeaderBackgroundColor?: string;

  // Content
  children: ReactNode;
  
  // Custom container classes
  contentClassName?: string;
}

export default function ReaderShell({
  title,
  subtitle,
  fallbackBackUrl,
  onBack,
  themeColor = '#C5A059',
  headerCenterContent,
  ambientGlowColor,
  fontPresets,
  fontStep,
  setFontStep,
  languages,
  currentLanguage,
  setLanguage,
  showTransliterationToggle,
  isTransliterationOn,
  onToggleTransliteration,
  showMeaningToggle,
  isMeaningOn,
  onToggleMeaning,
  onTTS,
  isSpeaking,
  isTTSGenerating,
  onCopy,
  isCopied,
  onShare,
  ttsRate,
  onTTSRateChange,
  bottomBar,
  shellBackgroundColor,
  shellHeaderBackgroundColor,
  children,
  contentClassName = 'px-6 mt-8 space-y-6',
}: ReaderShellProps) {
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';
  const { t } = useLanguage();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 2) {
      router.back();
    } else {
      router.push(fallbackBackUrl);
    }
  };

  // Theme derived tokens
  const bgBase = shellBackgroundColor || (isDark ? '#0e0a06' : '#fdf6ee');
  const bgCard = shellHeaderBackgroundColor || (isDark ? 'rgba(22,14,8,0.85)' : 'rgba(255,246,232,0.85)');
  const bgSubCard = isDark ? 'rgba(22,14,8,0.95)' : 'rgba(255,246,232,0.98)';
  const bdr = `${themeColor}22`;
  const textMain = isDark ? '#f5dfa0' : '#2a1002';
  const textDim = isDark ? 'rgba(245,210,130,0.5)' : 'rgba(42,16,2,0.5)';

  return (
    <div 
      className="relative min-h-screen pb-36 overflow-x-hidden text-[var(--text-main)] font-outfit selection:bg-[#C5A059]/30"
      style={{ background: bgBase }}
    >
      {/* Ambient glow */}
      {ambientGlowColor && (
        <div
          className="fixed top-0 left-0 w-96 h-96 blur-[140px] rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none -z-10 opacity-25 dark:opacity-20"
          style={{ background: ambientGlowColor }}
        />
      )}

      {/* ── Header ── */}
      <div 
        className="sticky top-0 z-40 px-6 pt-12 pb-4 backdrop-blur-xl border-b flex flex-col gap-3"
        style={{ background: bgCard, borderBottomColor: bdr }}
      >
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleBack}
            className="w-11 h-11 rounded-full border flex flex-shrink-0 items-center justify-center transition-all hover:bg-[var(--surface-base)]/40 active:scale-90"
            style={{ borderColor: bdr, background: 'rgba(var(--surface-base-rgb), 0.2)' }}
           aria-label="Go back">
            <ChevronLeft size={18} color={themeColor} />
          </button>
          
          <div className="text-center min-w-0 flex-1">
            {headerCenterContent ? (
              headerCenterContent
            ) : (
              <>
                {subtitle && (
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] truncate" style={{ color: themeColor }}>
                    {subtitle}
                  </p>
                )}
                <h1 className="text-sm font-semibold truncate" style={{ color: textMain }}>
                  {title}
                </h1>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onTTS && (
              <button
                onClick={onTTS}
                disabled={isTTSGenerating}
                className="w-11 h-11 rounded-full border flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
                style={{ borderColor: bdr, background: 'rgba(var(--surface-base-rgb), 0.2)' }}
                title={isSpeaking ? t('stopReading') : t('listen')}
              >
                {isTTSGenerating ? (
                  <Loader2 size={14} color={themeColor} className="animate-spin" />
                ) : isSpeaking ? (
                  <VolumeX size={14} color={themeColor} />
                ) : (
                  <Volume2 size={14} color={themeColor} />
                )}
              </button>
            )}
            {onCopy && (
              <button
                onClick={onCopy}
                className="w-11 h-11 rounded-full border flex items-center justify-center transition-all active:scale-90"
                style={{ borderColor: bdr, background: 'rgba(var(--surface-base-rgb), 0.2)' }}
                title="Copy"
              >
                {isCopied ? <Bookmark size={14} color="#2D9E4A" className="fill-current" /> : <Copy size={14} color={themeColor} />}
              </button>
            )}
            {onShare && (
              <button
                onClick={onShare}
                className="w-11 h-11 rounded-full border flex items-center justify-center transition-all active:scale-90"
                style={{ borderColor: bdr, background: 'rgba(var(--surface-base-rgb), 0.2)' }}
                title="Share"
               aria-label="Share">
                <Share2 size={14} color={themeColor} />
              </button>
            )}
          </div>
        </div>

        {/* ── Subheader Controls ── */}
        {(fontPresets || languages || showTransliterationToggle || showMeaningToggle) && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            
            {/* Font & Language Group */}
            <div className="flex flex-wrap items-center gap-2">
              {fontPresets && setFontStep && typeof fontStep === 'number' && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border" style={{ background: bgSubCard, borderColor: bdr }}>
                  <Type size={12} color={textDim} />
                  {fontPresets.map((step, idx) => (
                    <button
                      key={idx}
                      onClick={() => setFontStep(idx)}
                      className="px-2 py-1 rounded-full text-[10px] font-bold flex items-center justify-center transition-all"
                      style={{
                        background: fontStep === idx ? themeColor : 'transparent',
                        color: fontStep === idx ? (isDark ? '#000' : '#fff') : textDim,
                        boxShadow: fontStep === idx ? `0 2px 5px ${themeColor}40` : 'none'
                      }}
                    >
                      {step.label}
                    </button>
                  ))}
                </div>
              )}

              {languages && setLanguage && currentLanguage && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border" style={{ background: bgSubCard, borderColor: bdr }}>
                  <Globe size={12} color={textDim} />
                  {languages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => setLanguage(l.code)}
                      className="px-2 py-1 rounded-full text-[10px] font-bold transition-all"
                      style={{
                        background: currentLanguage === l.code ? themeColor : 'transparent',
                        color: currentLanguage === l.code ? (isDark ? '#000' : '#fff') : textDim,
                        boxShadow: currentLanguage === l.code ? `0 2px 5px ${themeColor}40` : 'none'
                      }}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}

              {onTTS && ttsRate !== undefined && onTTSRateChange && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border" style={{ background: bgSubCard, borderColor: bdr }}>
                  {[0.75, 1.0, 1.25].map(rate => (
                    <button
                      key={rate}
                      onClick={() => onTTSRateChange(rate)}
                      className="px-2 py-1 rounded-full text-[10px] font-bold transition-all"
                      style={{
                        background: ttsRate === rate ? themeColor : 'transparent',
                        color: ttsRate === rate ? (isDark ? '#000' : '#fff') : textDim,
                        boxShadow: ttsRate === rate ? `0 2px 5px ${themeColor}40` : 'none'
                      }}
                    >
                      {rate === 1.0 ? '1' : rate}×
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content Toggles Group */}
            {(showTransliterationToggle || showMeaningToggle) && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border" style={{ background: bgSubCard, borderColor: bdr }}>
                {showTransliterationToggle && onToggleTransliteration && (
                  <button
                    onClick={onToggleTransliteration}
                    className="px-2 py-1 rounded-full text-[9px] font-bold transition-all"
                    style={{
                      background: isTransliterationOn ? themeColor : 'transparent',
                      color: isTransliterationOn ? (isDark ? '#000' : '#fff') : textDim,
                    }}
                  >
                    {t('transliteration') || 'TRNS'}
                  </button>
                )}
                {showMeaningToggle && onToggleMeaning && (
                  <button
                    onClick={onToggleMeaning}
                    className="px-2 py-1 rounded-full text-[9px] font-bold transition-all"
                    style={{
                      background: isMeaningOn ? themeColor : 'transparent',
                      color: isMeaningOn ? (isDark ? '#000' : '#fff') : textDim,
                    }}
                  >
                    {t('meaning') || 'MEANING'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <section className={contentClassName}>
        {children}
      </section>

      {/* ── Fixed Bottom Bar ── */}
      {bottomBar && (
        <div
          className="fixed bottom-0 inset-x-0 z-40 border-t pb-[env(safe-area-inset-bottom)]"
          style={{
            /* Frosted-glass: strong blur keeps the bar legible while letting
               content bleed through. Opacity kept at ~50% so scrolled text
               is visible underneath and the bar feels lighter on the page. */
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            background: isDark
              ? 'rgba(14, 8, 4, 0.50)'
              : 'rgba(255, 246, 232, 0.50)',
            borderTopColor: bdr,
          }}
        >
          {/* Soft gradient fade at the very top of the bar so text underneath
              transitions in smoothly rather than hitting a hard edge */}
          <div
            className="absolute inset-x-0 top-0 -translate-y-full h-8 pointer-events-none"
            style={{
              background: isDark
                ? 'linear-gradient(to top, rgba(14,8,4,0.35), transparent)'
                : 'linear-gradient(to top, rgba(255,246,232,0.35), transparent)',
            }}
          />
          {bottomBar}
        </div>
      )}
    </div>
  );
}
