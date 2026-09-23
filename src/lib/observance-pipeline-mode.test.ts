import { describe, expect, it } from "vitest";
import { getObservancePipelineMode } from "./observance-pipeline-mode";

describe("observance-pipeline-mode", () => {
  it("defaults to legacy when no environment variables are set", () => {
    expect(getObservancePipelineMode("festival", {})).toBe("legacy");
    expect(getObservancePipelineMode("vrat", {})).toBe("legacy");
    expect(getObservancePipelineMode("tithi", {})).toBe("legacy");
  });

  it("respects global OBSERVANCE_PIPELINE_MODE setting", () => {
    expect(getObservancePipelineMode("festival", { OBSERVANCE_PIPELINE_MODE: "schedule" })).toBe("schedule");
    expect(getObservancePipelineMode("vrat", { OBSERVANCE_PIPELINE_MODE: "disabled" })).toBe("disabled");
  });

  it("prioritizes category-specific override over global setting", () => {
    const env = {
      OBSERVANCE_PIPELINE_MODE: "legacy",
      OBSERVANCE_PIPELINE_MODE_FESTIVAL: "schedule",
      OBSERVANCE_PIPELINE_MODE_VRAT: "disabled",
    };
    expect(getObservancePipelineMode("festival", env)).toBe("schedule");
    expect(getObservancePipelineMode("vrat", env)).toBe("disabled");
    expect(getObservancePipelineMode("tithi", env)).toBe("legacy");
  });

  it("falls back to legacy when mode string is invalid", () => {
    expect(getObservancePipelineMode("festival", { OBSERVANCE_PIPELINE_MODE: "invalid_mode" })).toBe("legacy");
    expect(getObservancePipelineMode("festival", { OBSERVANCE_PIPELINE_MODE_FESTIVAL: "xyz" })).toBe("legacy");
  });

  it("handles whitespace and case insensitivity", () => {
    expect(getObservancePipelineMode("festival", { OBSERVANCE_PIPELINE_MODE_FESTIVAL: " SCHEDULE " })).toBe("schedule");
    expect(getObservancePipelineMode("vrat", { OBSERVANCE_PIPELINE_MODE: " DISABLED " })).toBe("disabled");
  });
});
