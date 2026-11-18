import type { NoteEvent } from "../types";

/**
 * Standard MIDI File format 0 (one track).
 * Uses a fixed 120 BPM tempo and 480 ticks per quarter note.
 * Events are ordered by absolute tick; note-off precedes note-on at equal ticks.
 */
const TICKS_PER_QUARTER = 480;
const TICKS_PER_MS = (TICKS_PER_QUARTER * 120) / 60_000;

function be16(number: number): number[] {
  return [(number >> 8) & 0xff, number & 0xff];
}
function be32(number: number): number[] {
  return [(number >>> 24) & 0xff, (number >>> 16) & 0xff, (number >>> 8) & 0xff, number & 0xff];
}
function varLen(number: number): number[] {
  let n = Math.max(0, Math.floor(number));
  const bytes = [n & 0x7f];
  while ((n >>= 7) > 0) bytes.unshift((n & 0x7f) | 0x80);
  return bytes;
}
interface MidiEvent { tick: number; order: number; bytes: number[] }

export function encodeMidi(notes: readonly NoteEvent[]): Uint8Array {
  if (notes.length > 2_000) throw new RangeError("Too many MIDI events.");
  const events: MidiEvent[] = [{ tick: 0, order: -1, bytes: [0xff, 0x51, 0x03, 0x07, 0xa1, 0x20] }];
  for (const note of notes) {
    if (!Number.isInteger(note.midi) || note.midi < 0 || note.midi > 127
      || !Number.isFinite(note.atMs) || note.atMs < 0 || note.atMs > 3_600_000
      || !Number.isFinite(note.durationMs) || note.durationMs < 0 || note.durationMs > 10_000) {
      throw new RangeError("Invalid note data for MIDI export.");
    }
    const start = Math.round(note.atMs * TICKS_PER_MS);
    const end = start + Math.max(1, Math.round(note.durationMs * TICKS_PER_MS));
    events.push({ tick: start, order: 1, bytes: [0x90, note.midi, 88] });
    events.push({ tick: end, order: 0, bytes: [0x80, note.midi, 0] });
  }
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const track: number[] = [];
  let previous = 0;
  for (const event of events) {
    track.push(...varLen(event.tick - previous), ...event.bytes);
    previous = event.tick;
  }
  track.push(0, 0xff, 0x2f, 0);
  return Uint8Array.from([
    0x4d, 0x54, 0x68, 0x64, ...be32(6), ...be16(0), ...be16(1), ...be16(TICKS_PER_QUARTER),
    0x4d, 0x54, 0x72, 0x6b, ...be32(track.length), ...track
  ]);
}
