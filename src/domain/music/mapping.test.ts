import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../../infrastructure/storage/repository";
import { getCharacterIndex, mapKeyToMidi, parseCustomScale, resolveScale } from "./mapping";

describe("user-configurable pitch mapping", () => {
  it("keeps physical codes stable across QWERTY and AZERTY labels", () => {
    expect(mapKeyToMidi("KeyQ", "q", DEFAULT_SETTINGS))
      .toBe(mapKeyToMidi("KeyQ", "a", DEFAULT_SETTINGS));
  });
  it("uses characters across keyboard layouts in character mode", () => {
    const settings = { ...DEFAULT_SETTINGS, mappingMode: "character" as const };
    expect(mapKeyToMidi("KeyQ", "a", settings)).toBe(mapKeyToMidi("KeyA", "a", settings));
    expect(mapKeyToMidi("KeyQ", "a", settings)).not.toBe(mapKeyToMidi("KeyQ", "q", settings));
  });
  it("supports committed Chinese characters from an IME", () => {
    expect(getCharacterIndex("中")).not.toBeNull();
    expect(mapKeyToMidi("IME", "中", DEFAULT_SETTINGS)).toBeGreaterThanOrEqual(36);
    expect(mapKeyToMidi("IME", "文", DEFAULT_SETTINGS)).toBeGreaterThanOrEqual(36);
  });
  it("validates custom scales and applies transposition", () => {
    expect(parseCustomScale("0, 2, 3, 7, 10")).toEqual([0,2,3,7,10]);
    expect(parseCustomScale("0, 2, 2")).toBeNull();
    expect(parseCustomScale("2, 4, 7")).toBeNull();
    expect(parseCustomScale("0, 12")).toBeNull();
    const settings = { ...DEFAULT_SETTINGS, scaleId: "custom" as const, customScale: [0, 3, 7], rootMidi: 65 };
    expect(resolveScale(settings)).toEqual([0,3,7]);
    expect(mapKeyToMidi("KeyQ", "q", settings)).toBe(65);
  });
});
