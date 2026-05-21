import type { PramanaPipelineTags } from './pipeline-tags';

/**
 * Pipeline tag validation and normalization.
 * Ensures incoming tags from UI are safe and well-formed.
 */

export type ValidatedTags = Partial<PramanaPipelineTags>;

export interface ValidationResult {
  isValid: boolean;
  tags: ValidatedTags;
  warnings: string[];
  errors: string[];
}

/**
 * Validates and normalizes incoming pipeline tags from the UI.
 * Returns safe tags + any validation messages for logging.
 */
export function validatePipelineTags(
  incoming: unknown,
  options?: {
    allowPartial?: boolean;
    context?: string;
  }
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const tags: ValidatedTags = {};

  if (!incoming || typeof incoming !== 'object') {
    warnings.push('No tags provided; using defaults');
    return { isValid: true, tags, warnings, errors };
  }

  const incoming_obj = incoming as Record<string, unknown>;

  // Validate content_type
  if (incoming_obj.content_type) {
    const validValues = ['scripture', 'commentary', 'chat', 'ui_text', 'sacred_verse', 'katha', 'instruction', 'stotram', 'mantra', 'prayer'];
    if (validValues.includes(String(incoming_obj.content_type))) {
      tags.content_type = String(incoming_obj.content_type) as any;
    } else {
      errors.push(`Invalid content_type: "${incoming_obj.content_type}"`);
    }
  }

  // Validate response_mode
  if (incoming_obj.response_mode) {
    const validValues = ['deterministic', 'conversational', 'extractive'];
    if (validValues.includes(String(incoming_obj.response_mode))) {
      tags.response_mode = String(incoming_obj.response_mode) as any;
    } else {
      errors.push(`Invalid response_mode: "${incoming_obj.response_mode}"`);
    }
  }

  // Validate audio_mode
  if (incoming_obj.audio_mode) {
    const validValues = ['pandit', 'akash', 'standard', 'story', 'meditative', 'recitation', 'prerecorded', 'none'];
    if (validValues.includes(String(incoming_obj.audio_mode))) {
      tags.audio_mode = String(incoming_obj.audio_mode) as any;
    } else {
      errors.push(`Invalid audio_mode: "${incoming_obj.audio_mode}"`);
    }
  }

  // Validate tradition
  if (incoming_obj.tradition) {
    const validValues = ['hindu', 'buddhist', 'jain', 'sikh', 'generic'];
    if (validValues.includes(String(incoming_obj.tradition))) {
      tags.tradition = String(incoming_obj.tradition) as any;
    } else {
      errors.push(`Invalid tradition: "${incoming_obj.tradition}"`);
    }
  }

  // Validate script
  if (incoming_obj.script) {
    const validValues = ['devanagari', 'gurmukhi', 'iast', 'latin'];
    if (validValues.includes(String(incoming_obj.script))) {
      tags.script = String(incoming_obj.script) as any;
    } else {
      errors.push(`Invalid script: "${incoming_obj.script}"`);
    }
  }

  // Validate delivery_intent
  if (incoming_obj.delivery_intent) {
    const validValues = ['live_user', 'background_precompute', 'recitation'];
    if (validValues.includes(String(incoming_obj.delivery_intent))) {
      tags.delivery_intent = String(incoming_obj.delivery_intent) as any;
    } else {
      errors.push(`Invalid delivery_intent: "${incoming_obj.delivery_intent}"`);
    }
  }

  const isValid = errors.length === 0;
  return { isValid, tags, warnings, errors };
}

/**
 * Get default tags based on content context.
 * Useful for filling in missing tags based on request body or heuristics.
 */
export function getDefaultTags(context?: {
  text?: string;
  contentType?: string;
  audioMode?: string;
}): ValidatedTags {
  const defaults: ValidatedTags = {
    content_type: 'scripture',
    audio_mode: 'standard',
    tradition: 'hindu',
    script: 'devanagari',
    delivery_intent: 'live_user',
  };

  // Simple script detection fallback
  if (context?.text) {
    if (/[ऀ-ॿ]/.test(context.text)) {
      defaults.script = 'devanagari';
    } else if (/[਀-੿]/.test(context.text)) {
      defaults.script = 'gurmukhi';
    } else {
      defaults.script = 'latin';
    }
  }

  if (context?.contentType) {
    const validated = validatePipelineTags({ content_type: context.contentType });
    if (validated.tags.content_type) {
      defaults.content_type = validated.tags.content_type;
    }
  }

  if (context?.audioMode) {
    const validated = validatePipelineTags({ audio_mode: context.audioMode });
    if (validated.tags.audio_mode) {
      defaults.audio_mode = validated.tags.audio_mode;
    }
  }

  return defaults;
}

/**
 * Merge provided tags with defaults, preferring provided values.
 */
export function mergeTags(provided: ValidatedTags, defaults: ValidatedTags): ValidatedTags {
  return { ...defaults, ...provided };
}

/**
 * Converts validated pipeline tags into lightweight prompt guidance so routes
 * that do not yet have dedicated tag-aware adapters still apply the intent.
 */
export function buildPipelinePromptHint(tags: ValidatedTags): string {
  const hints: string[] = [];

  switch (tags.content_type) {
    case 'ui_text':
      hints.push('Return concise, polished UI-facing copy suitable for direct product display.');
      break;
    case 'instruction':
      hints.push('Prefer practical, actionable instruction over abstract exposition.');
      break;
    case 'stotram':
    case 'mantra':
    case 'prayer':
    case 'sacred_verse':
      hints.push('Preserve devotional tone and avoid flattening sacred phrasing into generic prose.');
      break;
    case 'chat':
      hints.push('Keep the response conversational and grounded.');
      break;
  }

  switch (tags.response_mode) {
    case 'deterministic':
      hints.push('Prefer stable, literal output. Avoid decorative flourishes, invented details, or extra framing.');
      break;
    case 'extractive':
      hints.push('Stay close to the source material and keep interpretation restrained.');
      break;
    case 'conversational':
      hints.push('Use natural conversational phrasing without losing precision.');
      break;
  }

  switch (tags.script) {
    case 'devanagari':
      hints.push('If Indic text is needed, use Devanagari script.');
      break;
    case 'gurmukhi':
      hints.push('If Indic text is needed, use Gurmukhi script.');
      break;
    case 'latin':
      hints.push('Use Latin script unless source quoting requires otherwise.');
      break;
  }

  if (hints.length === 0) return '';
  return `Pipeline guidance:\n- ${hints.join('\n- ')}`;
}

/**
 * Extract script from tags or text if tags are missing.
 * Used for voice profile selection (TTS).
 */
export function resolveScript(
  tags: ValidatedTags | undefined,
  text: string
): 'devanagari' | 'gurmukhi' | 'iast' | 'latin' {
  if (tags?.script) {
    return tags.script as any;
  }

  if (/[ऀ-ॿ]/.test(text)) {
    return 'devanagari';
  }
  if (/[਀-੿]/.test(text)) {
    return 'gurmukhi';
  }

  return 'latin';
}

/**
 * Check if a content_type should allow explain requests.
 */
export function canExplain(contentType?: string): boolean {
  if (!contentType) return false;
  const explainableTypes = ['sacred_verse', 'katha', 'scripture', 'commentary', 'stotram', 'prayer', 'mantra', 'instruction'];
  return explainableTypes.includes(contentType);
}

/**
 * Check if audio_mode allows TTS generation.
 */
export function canGenerateTTS(audioMode?: string): boolean {
  if (!audioMode) return false;
  if (audioMode === 'none' || audioMode === 'prerecorded') return false;
  // Other modes allow TTS generation: pandit, akash, standard, story, meditative, recitation
  return true;
}

/**
 * Log validation warnings/errors for observability.
 */
export function logValidationResult(result: ValidationResult, context = 'pipeline_tag_validation') {
  if (result.warnings.length > 0) {
    console.warn(`[${context}] Warnings:`, result.warnings);
  }
  if (result.errors.length > 0) {
    console.error(`[${context}] Errors:`, result.errors);
  }
}
