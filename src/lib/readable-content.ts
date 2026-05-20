import { PramanaPipelineTags } from './ai/pipeline-tags';

export type TextScript = 'devanagari' | 'gurmukhi' | 'latin' | 'tibetan' | 'unknown';
export type TextLanguage = 'sa' | 'hi' | 'pa' | 'en' | 'unknown';

/**
 * A unified contract representing sacred or spiritual text rendered
 * in the Shoonaya reading surfaces.
 */
export interface ReadableContent {
  /** The core textual payload */
  original: string;
  transliteration?: string;
  meaning?: string;

  /** Sourcing and origin */
  sourceLabel?: string;
  tradition?: string;
  
  /** Lingual specifics */
  language?: TextLanguage;
  script?: TextScript;

  /** Alignment with AI and internal pipelines */
  pipelineTags?: Partial<PramanaPipelineTags>;

  /** Capability flags instructing the UI surface on what features to expose */
  capabilities: {
    canOpenReader: boolean;
    canToggleLocalLanguage: boolean;
    canToggleTransliteration: boolean;
    canGenerateTTS: boolean;
    canShowMeaning: boolean;
    canShowExplain: boolean;
  };
}

export type ReadableCapabilities = ReadableContent['capabilities'];

/**
 * Creates default capability flags for a piece of ReadableContent,
 * safely downgrading features that lack required data.
 */
export function buildReadableCapabilities(
  content: Partial<ReadableContent>,
  overrides?: Partial<ReadableCapabilities>
): ReadableCapabilities {
  const contentType = content.pipelineTags?.content_type;
  const audioMode = content.pipelineTags?.audio_mode;
  const script = content.script ?? 'unknown';

  return {
    canOpenReader: !!content.original,
    canToggleLocalLanguage: !!content.meaning,
    canToggleTransliteration: !!content.transliteration && script !== 'latin',
    canGenerateTTS: !!content.original && audioMode !== 'none',
    canShowMeaning: !!content.meaning,
    canShowExplain:
      !!content.original &&
      (contentType === 'sacred_verse' || contentType === 'katha' || contentType === 'scripture'),
    ...overrides,
  };
}
