import { describe, expect, it } from "vitest";
import { SchedulingTelemetry } from "./SchedulingTelemetry";

describe("scheduling telemetry", () => {
  it("calculates bounded nearest-rank percentiles", () => {
    const monitor = new SchedulingTelemetry(4);
    [1, 2, 3, 4, 99].forEach((v) => monitor.record(v));
    expect(monitor.snapshot()).toEqual({ samples:4, p50Ms:3, p95Ms:99, maxMs:99 });
    monitor.reset();
    expect(monitor.snapshot()).toBeNull();
  });
  it("ignores malformed timing measurements", () => {
    const monitor = new SchedulingTelemetry();
    monitor.record(Number.NaN);
    monitor.record(-10);
    monitor.record(2.5);
    expect(monitor.snapshot()?.p50Ms).toBe(2.5);
  });
});
