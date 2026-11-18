import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, readCompositions, readSettings, saveComposition, writeSettings } from "./repository";
import type { SavedComposition } from "../../domain/types";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

describe("local repositories", () => {
  it("returns defaults when settings are malformed", () => {
    const storage = new MemoryStorage();
    storage.setItem("piano-typing.settings.v1", "{broken");
    expect(readSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });

  it("clamps settings and ignores unknown presets", () => {
    const storage = new MemoryStorage();
    storage.setItem("piano-typing.settings.v1", JSON.stringify({
      mode: "typing-flow",
      preset: "unknown",
      volume: 4,
      muted: true
    }));
    const settings = readSettings(storage);
    expect(settings.mode).toBe("typing-flow");
    expect(settings.preset).toBe("felt-piano");
    expect(settings.volume).toBe(1);
    expect(settings.muted).toBe(true);
  });

  it("writes and reads settings", () => {
    const storage = new MemoryStorage();
    expect(writeSettings({ ...DEFAULT_SETTINGS, muted: true }, storage)).toBe(true);
    expect(readSettings(storage).muted).toBe(true);
  });

  it("rejects malformed composition events", () => {
    const storage = new MemoryStorage();
    storage.setItem("piano-typing.compositions.v1", JSON.stringify([{ id: "bad", notes: [{ midi: 120 }] }]));
    expect(readCompositions(storage)).toEqual([]);
  });

  it("retains the newest 20 compositions in newest-first read order", () => {
    const storage = new MemoryStorage();
    for (let index = 0; index < 21; index += 1) {
      const composition: SavedComposition = {
        id: "composition-" + index,
        title: "Composition " + index,
        createdAt: "2026-11-17T10:00:00.000Z",
        durationMs: 500,
        preset: "felt-piano",
        notes: []
      };
      expect(saveComposition(composition, storage)).toBe(true);
    }
    const recent = readCompositions(storage);
    expect(recent).toHaveLength(20);
    expect(recent[0].id).toBe("composition-20");
    expect(recent[19].id).toBe("composition-1");
  });

  it("saves a valid composition without storing source text", () => {
    const storage = new MemoryStorage();
    const composition: SavedComposition = {
      id: "composition-1",
      title: "Morning notes",
      createdAt: "2026-11-17T10:00:00.000Z",
      durationMs: 1_200,
      preset: "felt-piano",
      notes: [{ id: "note-1", code: "KeyQ", midi: 60, atMs: 0, durationMs: 420 }]
    };
    expect(saveComposition(composition, storage)).toBe(true);
    expect(readCompositions(storage)).toEqual([composition]);
    expect(storage.getItem("piano-typing.compositions.v1")).not.toContain("sourceText");
  });
});
