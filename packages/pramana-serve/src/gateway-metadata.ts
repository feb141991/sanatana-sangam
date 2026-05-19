import type { PramanaProviderId, PramanaRuntimeId } from "./provider-ids";

export interface PramanaGatewayMetadata {
  readonly requestId?: string;
  readonly traceId?: string;
  readonly provider: PramanaProviderId;
  readonly model: string;
  readonly runtime?: PramanaRuntimeId;
  readonly region?: string;
  readonly cacheHit?: boolean;
  readonly latencyMs?: number;
  readonly tags?: readonly string[];
  readonly metadata?: Record<string, string | number | boolean | null>;
}
