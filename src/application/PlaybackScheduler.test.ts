import { afterEach, describe, expect, it, vi } from "vitest";
import type { NoteEvent } from "../domain/types";
import { PlaybackScheduler } from "./PlaybackScheduler";

const notes: NoteEvent[] = [
  { id:"n1", code:"KeyA", midi:60, atMs:0, durationMs:300 },
  { id:"n2", code:"KeyS", midi:62, atMs:500, durationMs:300 },
  { id:"n3", code:"KeyD", midi:64, atMs:2_000, durationMs:300 }
];

afterEach(() => vi.useRealTimers());

describe("PlaybackScheduler", () => {
  it("schedules only a short lookahead, preserving original relative timing", () => {
    vi.useFakeTimers();
    let now = 0;
    const output = vi.fn();
    const done = vi.fn();
    const scheduler = new PlaybackScheduler(output, () => now);
    scheduler.start(notes, "felt-piano", done);
    expect(output).toHaveBeenCalledTimes(1);
    now = 400;
    vi.advanceTimersByTime(400);
    expect(output).toHaveBeenCalledTimes(2);
    expect(output.mock.calls[1][1]).toBeGreaterThanOrEqual(0);
    now = 1_950;
    vi.advanceTimersByTime(1_550);
    expect(output).toHaveBeenCalledTimes(3);
    expect(done).toHaveBeenCalledOnce();
    expect(scheduler.isPlaying).toBe(false);
  });
  it("cancels future events when stopped", () => {
    vi.useFakeTimers();
    let now = 0;
    const output = vi.fn();
    const scheduler = new PlaybackScheduler(output, () => now);
    scheduler.start(notes, "soft-electric");
    scheduler.stop();
    now = 2000;
    vi.advanceTimersByTime(2200);
    expect(output).toHaveBeenCalledTimes(1);
  });
  it("rejects unbounded compositions", () => {
    const scheduler = new PlaybackScheduler(() => {});
    expect(() => scheduler.start(Array.from({length:2001},(_,i)=>({...notes[0],id:String(i)})), "felt-piano")).toThrow();
  });
});
