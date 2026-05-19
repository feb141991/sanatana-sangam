import type { AIChatInput, MeaningGenerateInput, PathshalaExplainInput, Policy } from './contracts';
import type { RequestMetadata } from './types';

export function assertRequestScope(meta: RequestMetadata<string>) {
  if (!meta.scope.length) {
    throw new Error('AI policy violation: request scope is missing');
  }
}

export function validatePathshalaExplainInput(input: PathshalaExplainInput) {
  if (!input.translation && !input.sanskrit && !input.originalText && !input.transliteration) {
    throw new Error('Verse content required');
  }
}

export function validateMeaningGenerateInput(input: MeaningGenerateInput) {
  if (!input.entryId || !input.sourceMeaning) {
    throw new Error('entryId and sourceMeaning are required');
  }
}

export function validateAIChatInput(input: AIChatInput) {
  if (!input.message?.trim()) {
    throw new Error('Message is required');
  }
}

export async function runPolicies<TInput, TTask extends string>(
  policies: Array<Policy<TInput, TTask>>,
  input: TInput,
  meta: RequestMetadata<TTask>,
) {
  for (const policy of policies) {
    await policy.evaluate(input, meta);
  }
}

export const scopePolicy: Policy<unknown, string> = {
  name: 'scope-required',
  evaluate(_input, meta) {
    assertRequestScope(meta);
  },
};
