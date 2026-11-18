export type PhraseAccent = "soft" | "full";

const PROGRESSION: number[][] = [
  [48, 55, 60, 64],
  [53, 60, 65, 69],
  [55, 62, 67, 71],
  [57, 64, 69, 72]
];

export function getPhraseChord(phraseIndex: number, rootMidi = 60): number[] {
  const safeIndex = Number.isFinite(phraseIndex)
    ? Math.max(0, Math.floor(phraseIndex))
    : 0;
  const shift = Math.max(-24, Math.min(12, Math.round(rootMidi) - 60));
  return PROGRESSION[safeIndex % PROGRESSION.length].map((note) => Math.max(36, Math.min(96, note + shift)));
}

export function getWordBoundaryBass(phraseIndex: number, rootMidi = 60): number {
  return Math.max(36, getPhraseChord(phraseIndex, rootMidi)[0] - 12);
}

export function getPhraseAccent(key: string): PhraseAccent | null {
  if ([".", "?", "!", "Enter", "。", "！", "？"].includes(key)) return "full";
  if ([",", ";", ":", "，", "；", "：", "、"].includes(key)) return "soft";
  return null;
}
