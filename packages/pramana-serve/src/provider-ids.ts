export const PRAMANA_PROVIDER_IDS = [
  "openai",
  "anthropic",
  "google",
  "azure-openai",
  "groq",
  "ollama",
  "custom"
] as const;

export type PramanaProviderId = (typeof PRAMANA_PROVIDER_IDS)[number];

export type PramanaRuntimeId =
  | "edge"
  | "node"
  | "worker"
  | "browser"
  | "test"
  | "custom";
