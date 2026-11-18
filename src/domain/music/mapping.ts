import type { AppSettings, ScaleId } from "../types";
import { getPhysicalKeyIndex } from "./pitch";

export const SCALES: Record<Exclude<ScaleId, "custom">, readonly number[]> = {
  "major-pentatonic": [0, 2, 4, 7, 9],
  "minor-pentatonic": [0, 3, 5, 7, 10],
  "major": [0, 2, 4, 5, 7, 9, 11],
  "natural-minor": [0, 2, 3, 5, 7, 8, 10],
  "blues": [0, 3, 5, 6, 7, 10]
};

const LETTERS = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "-=[]\\;',./\`";
const VALID_UNICODE_LIMIT = 0x10ffff;

export function parseCustomScale(input: string): number[] | null {
  if (!/^\s*\d+(?:\s*,\s*\d+){1,11}\s*$/.test(input)) return null;
  const steps = input.split(",").map((piece) => Number(piece.trim()));
  if (steps[0] !== 0 || steps.some((value, i) => !Number.isInteger(value)
    || value < 0 || value > 11 || (i > 0 && value <= steps[i - 1]))) return null;
  return steps;
}

export function resolveScale(settings: Pick<AppSettings, "scaleId" | "customScale">): readonly number[] {
  return settings.scaleId === "custom" ? settings.customScale : SCALES[settings.scaleId];
}

export function getCharacterIndex(key: string): number | null {
  if (key === " " || key === "Enter" || !key) return null;
  const chars = Array.from(key.normalize("NFC"));
  if (chars.length !== 1) return null;
  const normalized = chars[0].toLowerCase();
  const letterIndex = LETTERS.indexOf(normalized);
  if (letterIndex !== -1) return letterIndex;
  const digitIndex = DIGITS.indexOf(normalized);
  if (digitIndex !== -1) return 26 + digitIndex;
  const symbolIndex = SYMBOLS.indexOf(normalized);
  if (symbolIndex !== -1) return 36 + symbolIndex;
  const cp = normalized.codePointAt(0);
  if (cp === undefined || cp > VALID_UNICODE_LIMIT || cp < 32) return null;
  return 48 + (cp % 24);
}

export function mapKeyToMidi(
  code: string,
  key: string,
  settings: Pick<AppSettings, "mappingMode" | "scaleId" | "rootMidi" | "customScale">
): number | null {
  if (key === " " || key === "Enter") return null;
  const index = code === "IME" || settings.mappingMode === "character"
    ? getCharacterIndex(key) : getPhysicalKeyIndex(code);
  if (index === null) return null;
  const intervals = resolveScale(settings);
  if (!intervals.length) return null;
  const octave = Math.floor(index / 10) % 3;
  const degree = index % intervals.length;
  return Math.max(36, Math.min(96, settings.rootMidi + octave * 12 + intervals[degree]));
}
