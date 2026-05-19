import type { AIRequestMetadata, MeaningGenerateInput, PathshalaExplainInput } from '@/lib/ai/contracts';

export function assertAiRequestAllowed(meta: AIRequestMetadata) {
  if (!meta.scope.length) {
    throw new Error('AI policy violation: request scope is missing');
  }
}

export function validatePathshalaExplainInput(input: PathshalaExplainInput) {
  if (!input.translation && !input.sanskrit && !input.transliteration) {
    throw new Error('Verse content required');
  }
}

export function validateMeaningGenerateInput(input: MeaningGenerateInput) {
  if (!input.entryId || !input.sourceMeaning) {
    throw new Error('entryId and sourceMeaning are required');
  }
}
