import { describe, expect, it } from "vitest";
import { encodeMidi } from "./midi";

describe("Standard MIDI File export", () => {
  it("writes MIDI format 0 header with one tempo track", () => {
    const bytes = encodeMidi([]);
    expect(Array.from(bytes.slice(0, 14))).toEqual([
      0x4d,0x54,0x68,0x64,0,0,0,6,0,0,0,1,1,0xe0
    ]);
    expect(String.fromCharCode(...bytes.slice(14, 18))).toBe("MTrk");
  });
  it("produces note-on and note-off bytes and an end-of-track marker", () => {
    const midi = encodeMidi([{ id:"n", code:"KeyQ", midi:60, atMs:0, durationMs:500 }]);
    const data = Array.from(midi);
    expect(data.join(",")).toContain("144,60,88");
    expect(data.join(",")).toContain("128,60,0");
    expect(data.slice(-4)).toEqual([0,255,47,0]);
  });
  it("rejects corrupt or unbounded events", () => {
    expect(() => encodeMidi([{id:"x",code:"KeyX",midi:NaN,atMs:0,durationMs:500}])).toThrow();
    expect(() => encodeMidi([{id:"x",code:"KeyX",midi:60,atMs:-1,durationMs:500}])).toThrow();
  });
});
