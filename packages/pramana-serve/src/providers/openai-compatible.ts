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

  return null;
}

export function summarizeOpenAICompatibleResponse(data: unknown): string {
  try {
    return JSON.stringify(data).slice(0, 500);
  } catch {
    return '[unserializable response payload]';
  }
}
