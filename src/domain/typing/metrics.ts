import type { TypingMetrics } from "../types";

export interface TypingMetricsInput {
  typedText: string;
  targetText?: string;
  elapsedMs: number;
}

export function calculateTypingMetrics({
  typedText,
  targetText,
  elapsedMs
}: TypingMetricsInput): TypingMetrics {
  const safeElapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  const minutes = safeElapsed / 60_000;
  const grossWpm = minutes > 0 ? Math.round((typedText.length / 5) / minutes) : 0;

  if (!targetText) {
    return {
      accuracy: null,
      grossWpm,
      correctCharacters: 0,
      incorrectCharacters: 0,
      remainingCharacters: 0
    };
  }

  const comparedLength = Math.min(typedText.length, targetText.length);
  let correctCharacters = 0;

  for (let index = 0; index < comparedLength; index += 1) {
    if (typedText[index] === targetText[index]) correctCharacters += 1;
  }

  const incorrectCharacters = Math.max(0, typedText.length - correctCharacters);
  const accuracy = typedText.length > 0
    ? Math.round((correctCharacters / typedText.length) * 100)
    : 0;

  return {
    accuracy,
    grossWpm,
    correctCharacters,
    incorrectCharacters,
    remainingCharacters: Math.max(0, targetText.length - typedText.length)
  };
}
