import type { PramanaProviderId, PramanaRuntimeId } from "./provider-ids";

export interface PramanaTokenUsage {
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly totalTokens?: number;
}

export interface PramanaGenerationMessage {
  readonly role: "system" | "user" | "assistant" | "tool";
  readonly content: string;
  readonly name?: string;
}

export interface PramanaGenerationResult<TStructured = unknown> {
  readonly id?: string;
  readonly provider: PramanaProviderId;
  readonly model: string;
  readonly runtime?: PramanaRuntimeId;
  readonly text: string;
  readonly finishReason?: "stop" | "length" | "tool-call" | "content-filter" | "error" | "unknown";
  readonly usage?: PramanaTokenUsage;
  readonly messages?: readonly PramanaGenerationMessage[];
  readonly structured?: TStructured;
  readonly metadata?: Record<string, string | number | boolean | null>;
}
