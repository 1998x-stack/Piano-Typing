import { describe, expect, it } from "vitest";
import { getPhraseAccent, getPhraseChord, getWordBoundaryBass } from "./harmony";

describe("phrase harmony", () => {
  it("cycles through a deterministic four-chord progression", () => {
    expect(getPhraseChord(0)).toEqual([48, 55, 60, 64]);
    expect(getPhraseChord(1)).toEqual([53, 60, 65, 69]);
    expect(getPhraseChord(4)).toEqual(getPhraseChord(0));
  });

  it("returns a fresh chord array", () => {
    const first = getPhraseChord(0);
    first[0] = 12;
    expect(getPhraseChord(0)[0]).toBe(48);
  });

  it("uses the current chord root one octave lower at word boundaries", () => {
    expect(getWordBoundaryBass(0)).toBe(36);
    expect(getWordBoundaryBass(1)).toBe(41);
  });

  it("distinguishes phrase endings from lighter punctuation", () => {
    expect(getPhraseAccent(".")).toBe("full");
    expect(getPhraseAccent("Enter")).toBe("full");
    expect(getPhraseAccent(",")).toBe("soft");
    expect(getPhraseAccent("a")).toBeNull();
  });
});
