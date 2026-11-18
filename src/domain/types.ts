export type AppMode = "free-play" | "typing-flow";

export type MappingMode = "physical" | "character";

export type ScaleId = "major-pentatonic" | "minor-pentatonic" | "major" | "natural-minor" | "blues" | "custom";

export type SoundPreset = "felt-piano" | "soft-electric" | "ambient-pluck";

export type AudioStatus = "idle" | "ready" | "suspended" | "unavailable" | "error";

export interface AppSettings {
  mode: AppMode;
  preset: SoundPreset;
  volume: number;
  muted: boolean;
  reducedMotion: boolean;
  mappingMode: MappingMode;
  scaleId: ScaleId;
  rootMidi: number;
  customScale: number[];
}

export interface KeyInput {
  code: string;
  key: string;
  timestamp: number;
}

export interface NoteEvent {
  id: string;
  code: string;
  midi: number;
  atMs: number;
  durationMs: number;
}

export interface SavedComposition {
  id: string;
  title: string;
  createdAt: string;
  durationMs: number;
  preset: SoundPreset;
  notes: NoteEvent[];
  schemaVersion?: 2;
  mappingMode?: MappingMode;
  scaleId?: ScaleId;
  rootMidi?: number;
  customScale?: number[];
}

export interface TypingMetrics {
  accuracy: number | null;
  grossWpm: number;
  correctCharacters: number;
  incorrectCharacters: number;
  remainingCharacters: number;
}
