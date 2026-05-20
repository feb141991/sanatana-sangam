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
    const validValues = ['scripture', 'commentary', 'chat', 'ui_text', 'sacred_verse', 'katha', 'instruction'];
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
    const validValues = ['pandit', 'akash', 'standard', 'story', 'meditative', 'none'];
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
    const validValues = ['live_user', 'background_precompute'];
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

  return defaults;
}

/**
 * Merge provided tags with defaults, preferring provided values.
 */
export function mergeTags(provided: ValidatedTags, defaults: ValidatedTags): ValidatedTags {
  return { ...defaults, ...provided };
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
  const explainableTypes = ['sacred_verse', 'katha', 'scripture', 'commentary'];
  return explainableTypes.includes(contentType);
}

/**
 * Check if audio_mode allows TTS generation.
 */
export function canGenerateTTS(audioMode?: string): boolean {
  if (!audioMode) return false;
  if (audioMode === 'none') return false;
  // All other modes allow TTS: pandit, akash, standard, story, meditative
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
