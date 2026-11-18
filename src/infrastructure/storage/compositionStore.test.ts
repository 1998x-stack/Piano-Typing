import { describe, expect, it } from "vitest";
import { exportCompositionJson, importCompositionJson, normalizeComposition, CompositionStore } from "./compositionStore";
import { COMPOSITIONS_KEY } from "./repository";
import type { SavedComposition } from "../../domain/types";

const example: SavedComposition = {
  id: "comp-a", title: "A short idea", createdAt: "2026-11-18T00:00:00.000Z",
  durationMs: 1000, preset: "felt-piano",
  notes: [{ id:"note-a", code:"KeyA", midi:60, atMs:0, durationMs:400 }]
};

class MemoryStorage {
  data = new Map<string,string>();
  getItem(key:string):string|null { return this.data.get(key) ?? null; }
  setItem(key:string,value:string):void { this.data.set(key,value); }
  removeItem(key:string):void { this.data.delete(key); }
}

describe("CompositionStore schema and fallback", () => {
  it("upgrades a legacy composition to schema v2 while excluding source text", () => {
    const upgraded = normalizeComposition({ ...example, sourceText: "never save this" });
    expect(upgraded?.schemaVersion).toBe(2);
    expect(JSON.stringify(upgraded)).not.toContain("never save this");
  });
  it("rejects covert text inside a physical code, and bounds event timing", () => {
    expect(normalizeComposition({
      ...example,
      notes: [{ id:"note-a", code:"secret typing text", midi:60, atMs:0, durationMs:400 }]
    })).toBeNull();
    expect(normalizeComposition({
      ...example,
      notes: [{ id:"note-a", code:"KeyA", midi:60, atMs:3_600_001, durationMs:400 }]
    })).toBeNull();
  });
  it("repairs invalid optional musical metadata when migrating a legacy record", () => {
    const normalized = normalizeComposition({
      ...example, rootMidi: 200, scaleId: "future-scale", customScale: [0,12,8]
    });
    expect(normalized?.rootMidi).toBe(60);
    expect(normalized?.scaleId).toBe("major-pentatonic");
    expect(normalized?.customScale).toEqual([0,2,4,7,9]);
  });
  it("round-trips versioned JSON export and import", () => {
    const exported = exportCompositionJson(example);
    expect(importCompositionJson(exported)).toEqual(normalizeComposition(example));
    expect(() => importCompositionJson(JSON.stringify({ format: "PianoTypingComposition", schemaVersion: 99 }))).toThrow();
    expect(() => importCompositionJson("{")).toThrow();
  });
  it("supports fallback save, rename, delete and clear without IndexedDB", async () => {
    const storage = new MemoryStorage();
    const repo = new CompositionStore(storage, undefined);
    expect(await repo.save(example)).toBe(true);
    expect((await repo.list())[0].title).toBe("A short idea");
    expect(await repo.rename("comp-a", "New name")).toBe(true);
    expect((await repo.list())[0].title).toBe("New name");
    expect(await repo.delete("comp-a")).toBe(true);
    expect(await repo.list()).toHaveLength(0);
    expect(await repo.save(example)).toBe(true);
    expect(await repo.clear()).toBe(true);
    expect(storage.getItem(COMPOSITIONS_KEY)).toBeNull();
  });
  it("rejects malformed record without replacing valid saved work", async () => {
    const storage = new MemoryStorage();
    const repo = new CompositionStore(storage, undefined);
    expect(await repo.save(example)).toBe(true);
    expect(await repo.save({ ...example, title: "" })).toBe(false);
    expect((await repo.list())[0].title).toBe("A short idea");
  });
});
