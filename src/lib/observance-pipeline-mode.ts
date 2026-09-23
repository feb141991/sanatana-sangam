export type ObservanceCategory = "festival" | "vrat" | "tithi";
export type ObservancePipelineMode = "legacy" | "schedule" | "disabled";

const VALID_MODES = new Set<ObservancePipelineMode>(["legacy", "schedule", "disabled"]);

/**
 * Returns the active pipeline delivery mode for a given observance category.
 *
 * Rules:
 * 1. Specific category override: OBSERVANCE_PIPELINE_MODE_FESTIVAL, OBSERVANCE_PIPELINE_MODE_VRAT, etc.
 * 2. Global fallback: OBSERVANCE_PIPELINE_MODE
 * 3. Default: "legacy" (safe default; preserves existing behavior until explicitly switched)
 */
export function getObservancePipelineMode(
  category: ObservanceCategory,
  env: Record<string, string | undefined> = process.env
): ObservancePipelineMode {
  const specificKey = "OBSERVANCE_PIPELINE_MODE_" + category.toUpperCase();
  const specificValue = env[specificKey]?.trim().toLowerCase();
  if (specificValue && VALID_MODES.has(specificValue as ObservancePipelineMode)) {
    return specificValue as ObservancePipelineMode;
  }

  const globalValue = env.OBSERVANCE_PIPELINE_MODE?.trim().toLowerCase();
  if (globalValue && VALID_MODES.has(globalValue as ObservancePipelineMode)) {
    return globalValue as ObservancePipelineMode;
  }

  return "legacy";
}
