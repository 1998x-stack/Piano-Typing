export const PENTATONIC_SCALE = [0, 2, 4, 7, 9] as const;

const KEY_ROWS: string[][] = [
  ["KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP"],
  ["KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL"],
  ["KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM"]
];

const CODE_TO_INDEX = new Map<string, number>();

KEY_ROWS.forEach((row, rowIndex) => {
  row.forEach((code, keyIndex) => {
    CODE_TO_INDEX.set(code, rowIndex * 10 + keyIndex);
  });
});

[
  "Digit1", "Digit2", "Digit3", "Digit4", "Digit5",
  "Digit6", "Digit7", "Digit8", "Digit9", "Digit0"
].forEach((code, index) => CODE_TO_INDEX.set(code, index));

[
  "Minus", "Equal", "BracketLeft", "BracketRight", "Backslash",
  "Semicolon", "Quote", "Comma", "Period", "Slash", "Backquote"
].forEach((code, index) => CODE_TO_INDEX.set(code, 26 + index));


export function getPhysicalKeyIndex(code: string): number | null {
  return CODE_TO_INDEX.get(code) ?? null;
}

export function getMidiForCode(code: string, baseMidi = 60): number | null {
  const index = CODE_TO_INDEX.get(code);
  if (index === undefined) return null;

  const octave = Math.min(2, Math.floor(index / 10));
  const degree = index % PENTATONIC_SCALE.length;
  return baseMidi + octave * 12 + PENTATONIC_SCALE[degree];
}

export function midiToFrequency(midi: number): number {
  if (!Number.isFinite(midi)) {
    throw new RangeError("MIDI note must be a finite number.");
  }
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function isPrintableKey(key: string): boolean {
  return key === " " || Array.from(key).length === 1;
}

export function isModifierOnlyKey(key: string): boolean {
  return ["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab"].includes(key);
}
