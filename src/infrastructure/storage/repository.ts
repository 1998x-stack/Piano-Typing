import { getPhysicalKeyIndex } from "../../domain/music/pitch";
import type { AppSettings, SavedComposition, SoundPreset, NoteEvent, ScaleId, MappingMode } from "../../domain/types";

export const SETTINGS_KEY = "piano-typing.settings.v1";
export const COMPOSITIONS_KEY = "piano-typing.compositions.v1";
export const DEFAULT_SETTINGS: AppSettings = {
  mode: "free-play",
  preset: "felt-piano",
  volume: 0.62,
  muted: false,
  reducedMotion: false,
  mappingMode: "physical",
  scaleId: "major-pentatonic",
  rootMidi: 60,
  customScale: [0, 2, 4, 7, 9]
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const PRESETS: SoundPreset[] = ["felt-piano", "soft-electric", "ambient-pluck"];
export const MAX_COMPOSITIONS = 20;
export const MAX_NOTES = 2_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJson(storage: StorageLike, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) as unknown : null;
  } catch {
    return null;
  }
}

export function readSettings(storage: StorageLike = window.localStorage): AppSettings {
  const value = readJson(storage, SETTINGS_KEY);
  if (!isRecord(value)) return { ...DEFAULT_SETTINGS };

  const mode = value.mode === "typing-flow" ? "typing-flow" : "free-play";
  const preset = PRESETS.includes(value.preset as SoundPreset)
    ? value.preset as SoundPreset
    : DEFAULT_SETTINGS.preset;
  const volume = typeof value.volume === "number" && Number.isFinite(value.volume)
    ? Math.min(1, Math.max(0, value.volume))
    : DEFAULT_SETTINGS.volume;

  const scaleIds: ScaleId[] = ["major-pentatonic", "minor-pentatonic", "major", "natural-minor", "blues", "custom"];
  const scaleId = scaleIds.includes(value.scaleId as ScaleId) ? value.scaleId as ScaleId : DEFAULT_SETTINGS.scaleId;
  const mappingMode: MappingMode = value.mappingMode === "character" ? "character" : "physical";
  const rootMidi = Number.isInteger(value.rootMidi) && (value.rootMidi as number) >= 48 && (value.rootMidi as number) <= 72
    ? value.rootMidi as number : DEFAULT_SETTINGS.rootMidi;
  const rawScale = value.customScale;
  const customScale = Array.isArray(rawScale) && rawScale.length >= 2 && rawScale.length <= 12
    && rawScale[0] === 0 && rawScale.every((x, i) => Number.isInteger(x) && x >= 0 && x <= 11 && (i === 0 || x > rawScale[i - 1]))
    ? rawScale as number[] : DEFAULT_SETTINGS.customScale;

  return {
    mode,
    preset,
    volume,
    mappingMode,
    scaleId,
    rootMidi,
    customScale,
    muted: typeof value.muted === "boolean" ? value.muted : DEFAULT_SETTINGS.muted,
    reducedMotion: typeof value.reducedMotion === "boolean"
      ? value.reducedMotion
      : DEFAULT_SETTINGS.reducedMotion
  };
}

export function writeSettings(settings: AppSettings, storage: StorageLike = window.localStorage): boolean {
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

export function isNoteEvent(value: unknown): value is NoteEvent {
  if (!isRecord(value)) return false;
  return typeof value.id === "string"
    && value.id.length > 0 && value.id.length <= 120
    && typeof value.code === "string"
    && (value.code === "IME" || value.code === "Harmony" || getPhysicalKeyIndex(value.code) !== null)
    && typeof value.midi === "number"
    && Number.isInteger(value.midi)
    && value.midi >= 36
    && value.midi <= 96
    && typeof value.atMs === "number"
    && Number.isFinite(value.atMs)
    && value.atMs >= 0
    && value.atMs <= 3_600_000
    && typeof value.durationMs === "number"
    && Number.isFinite(value.durationMs)
    && value.durationMs >= 0
    && value.durationMs <= 10_000
    && (value.velocity === undefined || (typeof value.velocity === "number"
      && Number.isFinite(value.velocity) && value.velocity >= 0 && value.velocity <= 1));
}

export function isComposition(value: unknown): value is SavedComposition {
  if (!isRecord(value) || !Array.isArray(value.notes)) return false;
  if (value.notes.length > MAX_NOTES) return false;
  return typeof value.id === "string"
    && typeof value.title === "string"
    && value.title.length <= 100
    && typeof value.createdAt === "string"
    && typeof value.durationMs === "number"
    && Number.isFinite(value.durationMs)
    && value.durationMs >= 0
    && value.durationMs <= 3_600_000
    && PRESETS.includes(value.preset as SoundPreset)
    && value.notes.every(isNoteEvent);
}

export function readCompositions(storage: StorageLike = window.localStorage): SavedComposition[] {
  const value = readJson(storage, COMPOSITIONS_KEY);
  if (!Array.isArray(value)) return [];
  return value.filter(isComposition).slice(-MAX_COMPOSITIONS).reverse();
}

export function saveComposition(
  composition: SavedComposition,
  storage: StorageLike = window.localStorage
): boolean {
  if (!isComposition(composition)) return false;
  try {
    const current = readCompositions(storage).reverse().filter((item) => item.id !== composition.id);
    const next = [...current, composition].slice(-MAX_COMPOSITIONS);
    storage.setItem(COMPOSITIONS_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

export function clearCompositions(storage: StorageLike = window.localStorage): boolean {
  try {
    storage.removeItem(COMPOSITIONS_KEY);
    return true;
  } catch {
    return false;
  }
}
