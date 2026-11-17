export type PhraseAccent = "soft" | "full";

const PROGRESSION: number[][] = [
  [48, 55, 60, 64],
  [53, 60, 65, 69],
  [55, 62, 67, 71],
  [57, 64, 69, 72]
];

export function getPhraseChord(phraseIndex: number): number[] {
  const safeIndex = Number.isFinite(phraseIndex)
    ? Math.max(0, Math.floor(phraseIndex))
    : 0;
  return PROGRESSION[safeIndex % PROGRESSION.length].slice();
}

export function getWordBoundaryBass(phraseIndex: number): number {
  return Math.max(36, getPhraseChord(phraseIndex)[0] - 12);
}

export function getPhraseAccent(key: string): PhraseAccent | null {
  if ([".", "?", "!", "Enter"].includes(key)) return "full";
  if ([",", ";", ":"].includes(key)) return "soft";
  return null;
}
