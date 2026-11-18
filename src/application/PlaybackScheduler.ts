import type { NoteEvent, SoundPreset } from "../domain/types";

type AudioCallback = (note: NoteEvent, delayMs: number, preset: SoundPreset) => void;

/**
 * Streams a bounded lookahead window to Web Audio instead of instantiating
 * up to 2,000 oscillators up front. Actual audio timing remains scheduled on
 * AudioContext.currentTime by AudioEngine.
 */
export class PlaybackScheduler {
  private timer: number | null = null;
  private index = 0;
  private startedAt = 0;
  private originAt = 0;
  private events: NoteEvent[] = [];
  private preset: SoundPreset = "felt-piano";
  private onFinish: (() => void) | null = null;

  constructor(
    private readonly play: AudioCallback,
    private readonly clock: () => number = () => performance.now(),
    private readonly lookaheadMs = 160,
    private readonly intervalMs = 25
  ) {}

  start(notes: readonly NoteEvent[], preset: SoundPreset, onFinish?: () => void): void {
    this.stop();
    if (notes.length === 0) { onFinish?.(); return; }
    if (notes.length > 2_000) throw new RangeError("Cannot replay more than 2,000 note events.");
    this.events = [...notes].sort((a, b) => a.atMs - b.atMs);
    this.originAt = this.events[0].atMs;
    this.startedAt = this.clock();
    this.preset = preset;
    this.index = 0;
    this.onFinish = onFinish ?? null;
    this.tick();
    if (this.index < this.events.length) {
      this.timer = window.setInterval(() => this.tick(), this.intervalMs);
    }
  }

  get isPlaying(): boolean {
    return this.timer !== null || this.index < this.events.length;
  }

  stop(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.events = [];
    this.index = 0;
    this.onFinish = null;
  }

  private tick(): void {
    const elapsed = Math.max(0, this.clock() - this.startedAt);
    while (this.index < this.events.length) {
      const note = this.events[this.index];
      const remainingMs = note.atMs - this.originAt - elapsed;
      if (remainingMs > this.lookaheadMs) break;
      this.play(note, Math.max(0, remainingMs), this.preset);
      this.index += 1;
    }
    if (this.index === this.events.length) {
      const finish = this.onFinish;
      this.stop();
      finish?.();
    }
  }
}
