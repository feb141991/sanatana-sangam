type OpenAICompatibleContentPart =
  | string
  | {
      type?: string;
      text?: string;
      content?: string;
    };

type OpenAICompatibleResponse = {
  output_text?: string;
  choices?: Array<{
    text?: string;
    message?: {
      content?:
        | string
        | OpenAICompatibleContentPart[]
        | { text?: string; content?: string };
      reasoning_content?: string;
      refusal?: string;
    };
    finish_reason?: string;
  }>;
};

// ---------------------------------------------------------------------------
// Typed errors — thrown when a reasoning model emits no usable final answer
// ---------------------------------------------------------------------------

/**
 * Thrown when the model hit its max_tokens limit before producing a final
 * answer. The output was truncated mid-generation (finish_reason === 'length').
 */
export class PramanaOutputTruncatedError extends Error {
  readonly code = 'OUTPUT_TRUNCATED';
  constructor(providerId: string) {
    super(
      `[${providerId}] Output truncated: model hit max_tokens limit before generating a final answer. ` +
      `Consider increasing maxOutputTokens or reducing reasoningEffort.`
    );
    this.name = 'PramanaOutputTruncatedError';
  }
}

/**
 * Thrown when a reasoning model completed its chain-of-thought (finish_reason !== 'length')
 * but emitted no final-answer content. The chain-of-thought is in reasoning_content
 * and MUST NOT be returned to the user.
 */
export class PramanaNoFinalAnswerError extends Error {
  readonly code = 'NO_FINAL_ANSWER';
  constructor(providerId: string) {
    super(
      `[${providerId}] No final answer: model completed reasoning without generating a response. ` +
      `Retry with lower reasoningEffort or fall through to a non-reasoning provider.`
    );
    this.name = 'PramanaNoFinalAnswerError';
  }
}

// ---------------------------------------------------------------------------
// Content classifier — determines why content is absent
// ---------------------------------------------------------------------------

type MissingContentReason = 'truncated' | 'no_final_answer' | 'empty';

/**
 * Classifies why a response choice has no usable content.
 *
 * - 'truncated'      — finish_reason === 'length' (ran out of tokens)
 * - 'no_final_answer'— finish_reason !== 'length' AND reasoning_content present
 *                      (model reasoned but produced no answer)
 * - 'empty'          — no content and no reasoning context
 */
export function classifyMissingContent(
  choice:
    | {
        message?: { content?: unknown; reasoning_content?: string };
        finish_reason?: string;
      }
    | undefined
): MissingContentReason {
  if (choice?.finish_reason === 'length') {
    return 'truncated';
  }
  if (
    typeof choice?.message?.reasoning_content === 'string' &&
    choice.message.reasoning_content.trim()
  ) {
    return 'no_final_answer';
  }
  return 'empty';
}

// ---------------------------------------------------------------------------
// Content extractor
// ---------------------------------------------------------------------------

function extractFromContent(content: unknown): string | null {
  if (typeof content === 'string' && content.trim()) {
    return content;
  }

  if (Array.isArray(content)) {
    const joined = content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (typeof part?.text === 'string') return part.text;
        if (typeof part?.content === 'string') return part.content;
        return '';
      })
      .join('')
      .trim();

    if (joined) {
      return joined;
    }
  }

  if (content && typeof content === 'object' && !Array.isArray(content)) {
    const candidate = content as { text?: string; content?: string };
    if (typeof candidate.text === 'string' && candidate.text.trim()) {
      return candidate.text;
    }
    if (typeof candidate.content === 'string' && candidate.content.trim()) {
      return candidate.content;
    }
  }

  return null;
}

/**
 * Extracts the final assistant answer text from an OpenAI-compatible response.
 *
 * Returns the content string when present.
 * Returns null when content is absent — the caller must classify why
 * (truncated, no_final_answer, or empty) and throw an appropriate typed error.
 *
 * IMPORTANT: reasoning_content (chain-of-thought) is NEVER returned here,
 * even when content is missing. The thinking trace must not be shown to users.
 */
export function extractAssistantText(
  data: OpenAICompatibleResponse
): string | null {
  const choice = data.choices?.[0];
  const message = choice?.message;

  const contentText = extractFromContent(message?.content);
  if (contentText) {
    return contentText;
  }

  if (typeof choice?.text === 'string' && choice.text.trim()) {
    return choice.text;
  }

  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text;
  }

  // Content is absent. Do NOT fall back to reasoning_content.
  // The caller should use classifyMissingContent() to determine
  // whether to throw PramanaOutputTruncatedError or PramanaNoFinalAnswerError.
  return null;
}

export function summarizeOpenAICompatibleResponse(data: unknown): string {
  try {
    return JSON.stringify(data).slice(0, 500);
  } catch {
    return '[unserializable response payload]';
  }
}
