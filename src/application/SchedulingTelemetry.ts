export interface TimingSummary {
  samples: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
}

/** Bounded JS timing samples; does not measure audible output latency. */
export class SchedulingTelemetry {
  private values: number[] = [];
  constructor(private readonly capacity = 256) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError("Invalid capacity.");
  }

  record(milliseconds: number): void {
    if (!Number.isFinite(milliseconds) || milliseconds < 0) return;
    if (this.values.length >= this.capacity) this.values.shift();
    this.values.push(milliseconds);
  }

  get count(): number { return this.values.length; }

  snapshot(): TimingSummary | null {
    if (!this.values.length) return null;
    const sorted = [...this.values].sort((a, b) => a - b);
    const percentile = (pct: number) => sorted[Math.ceil(sorted.length * pct) - 1];
    return {
      samples: sorted.length,
      p50Ms: percentile(0.5),
      p95Ms: percentile(0.95),
      maxMs: sorted[sorted.length - 1]
    };
  }

  reset(): void { this.values = []; }
}
