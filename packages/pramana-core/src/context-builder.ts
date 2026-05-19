import type { ContextBuilder } from './contracts';
import type { JsonObject, PromptSpec } from './types';

export type PromptEnvelope<TContext extends JsonObject = JsonObject> = {
  prompt: PromptSpec;
  context?: TContext;
};

export function createStaticPromptBuilder<TInput, TContext extends JsonObject = JsonObject>(
  buildPrompt: (input: TInput, context?: TContext) => PromptSpec,
  contextBuilder?: ContextBuilder<TInput, TContext>,
) {
  return async function build(input: TInput): Promise<PromptEnvelope<TContext>> {
    const context = contextBuilder ? await contextBuilder.build(input) : undefined;
    return {
      prompt: buildPrompt(input, context),
      context,
    };
  };
}

export function joinPromptSections(sections: Array<string | null | undefined>) {
  return sections
    .map((section) => section?.trim())
    .filter((section): section is string => Boolean(section))
    .join('\n\n');
}
