import type { PramanaProviderId, PramanaRuntimeId } from "./provider-ids";

export interface PramanaModelCapabilityFlags {
  readonly streaming?: boolean;
  readonly toolCalls?: boolean;
  readonly jsonMode?: boolean;
  readonly vision?: boolean;
  readonly embeddings?: boolean;
}

export interface PramanaModelRoute {
  readonly model: string;
  readonly provider: PramanaProviderId;
  readonly runtime?: PramanaRuntimeId;
  readonly priority?: number;
  readonly maxInputTokens?: number;
  readonly maxOutputTokens?: number;
  readonly capabilities?: PramanaModelCapabilityFlags;
  readonly metadata?: Record<string, string | number | boolean | null>;
}

export interface PramanaRouteSelectionPolicy {
  readonly strategy?: "primary" | "fallback" | "lowest-latency" | "cost-aware" | "custom";
  readonly preferredRuntime?: PramanaRuntimeId;
  readonly tags?: readonly string[];
}

export interface PramanaModelRoutingConfig {
  readonly defaultRoute?: string;
  readonly routes: Readonly<Record<string, PramanaModelRoute>>;
  readonly policy?: PramanaRouteSelectionPolicy;
}
