// Extracted from src/app/api/native/home-summary/route.ts so a second
// route (calendar/upcoming) doesn't grow its own copy. Native parses the
// resulting header with parseServerTimingHeader (shoonaya-mobile/lib/telemetry.ts).
export class ServerTimingCollector {
  private stages: Array<{ name: string; dur: number; desc?: string }> = [];
  private startTime: number = performance.now();

  async measure<T>(name: string, desc: string, fn: () => PromiseLike<T> | T): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const dur = performance.now() - start;
      this.stages.push({ name, dur: Math.round(dur * 100) / 100, desc });
    }
  }

  record(name: string, dur: number, desc?: string) {
    this.stages.push({ name, dur: Math.round(dur * 100) / 100, desc });
  }

  toHeaderValue(): string {
    const totalDur = this.totalDurationMs();
    const parts = this.stages.map((s) => `${s.name};dur=${s.dur}${s.desc ? `;desc="${s.desc}"` : ''}`);
    parts.push(`total;dur=${totalDur};desc="Total"`);
    return parts.join(', ');
  }

  totalDurationMs(): number {
    return Math.round((performance.now() - this.startTime) * 100) / 100;
  }

  receipt() {
    return {
      totalMs: this.totalDurationMs(),
      stages: this.stages.map((stage) => ({ ...stage })),
    };
  }
}
