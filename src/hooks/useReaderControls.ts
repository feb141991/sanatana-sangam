'use client';

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { ReadableCapabilities } from '@/lib/readable-content';
import type { PramanaPipelineTags } from '@/lib/ai/pipeline-tags';

export interface ReaderControlsState {
  showTransliteration: boolean;
  showLocalLanguage: boolean;
  showMeaning: boolean;
  isGeneratingTTS: boolean;
  ttsError: string | null;
  isCopied: boolean;
}

export interface TTSRequestOptions {
  quality?: 'standard' | 'pandit';
  language?: string;
  voice?: 'male' | 'female';
  speed?: number;
  pipelineTags?: Partial<PramanaPipelineTags>;
}

export interface ExplainContext {
  source?: string;
  title?: string;
  tradition?: string;
  language?: string;
  contentType?: string;
  responseMode?: string;
  transliteration?: string;
  translation?: string;
  pipelineTags?: Partial<PramanaPipelineTags>;
}

export interface ExplainResult {
  raw?: string;
  explanation?: {
    word_by_word: string;
    meaning: string;
    commentary: string;
    daily_application: string;
    contemplation: string;
    related_text: string;
  };
  teacher?: string;
  tradition?: string;
  source?: string;
  title?: string;
  ai?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ReaderControlsHandlers {
  toggleTransliteration: () => void;
  toggleLocalLanguage: () => void;
  toggleMeaning: () => void;
  resetDisplayState: () => void;
  requestTTS: (text: string, options?: TTSRequestOptions) => Promise<string | null>;
  copyText: (text: string, label?: string) => Promise<void>;
  share: (text: string, title?: string, url?: string) => Promise<void>;
  requestExplain: (text: string, context?: ExplainContext) => Promise<ExplainResult | null>;
}

/**
 * Unified hook for reader controls: language toggle, transliteration, TTS, explain, share/copy.
 * Drives all reading surface interactions consistently.
 */
export function useReaderControls(capabilities: ReadableCapabilities) {
  // Display state
  const [showTransliteration, setShowTransliteration] = useState(false);
  const [showLocalLanguage, setShowLocalLanguage] = useState(false);
  const [showMeaning, setShowMeaning] = useState(capabilities.canShowMeaning ?? true);

  // Audio state
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

  // Share state
  const [isCopied, setIsCopied] = useState(false);

  // Display toggles
  const toggleTransliteration = useCallback(() => {
    if (capabilities.canToggleTransliteration) {
      setShowTransliteration(prev => !prev);
    }
  }, [capabilities.canToggleTransliteration]);

  const toggleLocalLanguage = useCallback(() => {
    if (capabilities.canToggleLocalLanguage) {
      setShowLocalLanguage(prev => !prev);
    }
  }, [capabilities.canToggleLocalLanguage]);

  const toggleMeaning = useCallback(() => {
    if (capabilities.canShowMeaning) {
      setShowMeaning(prev => !prev);
    }
  }, [capabilities.canShowMeaning]);

  const resetDisplayState = useCallback(() => {
    setShowTransliteration(false);
    setShowLocalLanguage(false);
    setShowMeaning(capabilities.canShowMeaning ?? true);
  }, [capabilities.canShowMeaning]);

  // TTS request
  const requestTTS = useCallback(async (
    text: string,
    options?: TTSRequestOptions
  ): Promise<string | null> => {
    if (!capabilities.canGenerateTTS || !text) {
      return null;
    }

    setIsGeneratingTTS(true);
    setTtsError(null);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          quality: options?.quality ?? 'standard',
          language: options?.language,
          voice: options?.voice,
          speed: options?.speed,
          pipelineTags: options?.pipelineTags,
        })
      });

      if (!res.ok) {
        throw new Error(`TTS request failed: ${res.status}`);
      }

      const data = await res.json();
      
      if (data.audioContent) {
        return `data:audio/mp3;base64,${data.audioContent}`;
      } else if (data.error) {
        throw new Error(data.error as string);
      } else {
        throw new Error('No audio content in response');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'TTS generation failed';
      setTtsError(message);
      console.error('[useReaderControls] TTS error:', err);
      return null;
    } finally {
      setIsGeneratingTTS(false);
    }
  }, [capabilities.canGenerateTTS]);

  // Copy text
  const copyText = useCallback(async (text: string, label = 'Text') => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success(`${label} copied! 🙏`);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('[useReaderControls] Copy failed:', err);
      toast.error('Failed to copy');
    }
  }, []);

  // Share content
  const share = useCallback(async (text: string, title = 'Shoonaya', url?: string) => {
    const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');
    const shareText = text || title;

    try {
      if (navigator.share) {
        await navigator.share({ title, text: shareText, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success('Link copied to clipboard! 🙏');
      }
    } catch (err) {
      console.error('[useReaderControls] Share failed:', err);
    }
  }, []);

  // Request explanation
  const requestExplain = useCallback(async (
    text: string,
    context?: ExplainContext
  ): Promise<ExplainResult | null> => {
    if (!capabilities.canShowExplain || !text) {
      return null;
    }

    try {
      const res = await fetch('/api/pathshala/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: text,
          source: context?.source,
          title: context?.title,
          tradition: context?.tradition,
          language: context?.language,
          transliteration: context?.transliteration,
          translation: context?.translation,
          responseMode: context?.responseMode,
          pipelineTags: context?.pipelineTags ?? {
            content_type: context?.contentType,
            response_mode: context?.responseMode,
            tradition: context?.tradition as PramanaPipelineTags['tradition'] | undefined,
          },
        })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = typeof data?.error === 'string'
          ? data.error
          : `Explain request failed: ${res.status}`;
        throw new Error(message);
      }

      if (typeof data?.error === 'string') {
        throw new Error(data.error);
      }

      return data as ExplainResult;
    } catch (err) {
      console.error('[useReaderControls] Explain request failed:', err);
      throw err instanceof Error ? err : new Error('Explain request failed');
    }
  }, [capabilities.canShowExplain]);

  const state: ReaderControlsState = {
    showTransliteration,
    showLocalLanguage,
    showMeaning,
    isGeneratingTTS,
    ttsError,
    isCopied,
  };

  const handlers: ReaderControlsHandlers = {
    toggleTransliteration,
    toggleLocalLanguage,
    toggleMeaning,
    resetDisplayState,
    requestTTS,
    copyText,
    share,
    requestExplain,
  };

  return { state, handlers };
}
