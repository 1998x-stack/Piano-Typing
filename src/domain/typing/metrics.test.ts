import { describe, expect, it } from "vitest";
import { calculateTypingMetrics } from "./metrics";

describe("calculateTypingMetrics", () => {
  it("does not invent accuracy for free play", () => {
    const metrics = calculateTypingMetrics({
      typedText: "hello world",
      elapsedMs: 60_000
    });
    expect(metrics.accuracy).toBeNull();
    expect(metrics.grossWpm).toBe(2);
  });

  it("calculates character accuracy against target text", () => {
    const metrics = calculateTypingMetrics({
      typedText: "hellx",
      targetText: "hello",
      elapsedMs: 30_000
    });
    expect(metrics.accuracy).toBe(80);
    expect(metrics.correctCharacters).toBe(4);
    expect(metrics.incorrectCharacters).toBe(1);
    expect(metrics.remainingCharacters).toBe(0);
  });

  it("handles an empty input and invalid elapsed time", () => {
    const metrics = calculateTypingMetrics({
      typedText: "",
      targetText: "hello",
      elapsedMs: Number.NaN
    });
    expect(metrics.accuracy).toBe(0);
    expect(metrics.grossWpm).toBe(0);
    expect(metrics.remainingCharacters).toBe(5);
  });
});
