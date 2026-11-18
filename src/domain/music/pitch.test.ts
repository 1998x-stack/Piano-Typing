import { describe, expect, it } from "vitest";
import { getMidiForCode, isPrintableKey, midiToFrequency } from "./pitch";

describe("physical key pitch mapping", () => {
  it("maps the same physical key to a stable MIDI pitch", () => {
    expect(getMidiForCode("KeyQ")).toBe(60);
    expect(getMidiForCode("KeyQ")).toBe(getMidiForCode("KeyQ"));
  });

  it("maps letters, punctuation, digits, and space into the supported MIDI range", () => {
    const codes = [
      "KeyQ", "KeyP", "KeyA", "KeyL", "KeyZ", "KeyM",
      "Digit1", "Digit0", "Comma", "Period", "Slash"
    ];
    codes.forEach((code) => {
      const midi = getMidiForCode(code);
      expect(midi).not.toBeNull();
      expect(midi as number).toBeGreaterThanOrEqual(36);
      expect(midi as number).toBeLessThanOrEqual(96);
    });
  });

  it("returns null for non-musical physical codes", () => {
    expect(getMidiForCode("ShiftLeft")).toBeNull();
    expect(getMidiForCode("Escape")).toBeNull();
    expect(getMidiForCode("Space")).toBeNull();
  });

  it("converts A4 to 440 Hz", () => {
    expect(midiToFrequency(69)).toBeCloseTo(440, 5);
  });

  it("rejects non-finite MIDI values", () => {
    expect(() => midiToFrequency(Number.NaN)).toThrow(RangeError);
  });
});

describe("printable key detection", () => {
  it("accepts letters, punctuation, and space", () => {
    expect(isPrintableKey("a")).toBe(true);
    expect(isPrintableKey(".")).toBe(true);
    expect(isPrintableKey(" ")).toBe(true);
  });

  it("rejects multi-character control keys", () => {
    expect(isPrintableKey("Enter")).toBe(false);
    expect(isPrintableKey("Shift")).toBe(false);
  });
});
