import { useState } from "react";
import type { AppSettings, MappingMode, ScaleId } from "../domain/types";
import { parseCustomScale } from "../domain/music/mapping";

interface Props {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
}

const ROOTS = [
  [48, "C3"], [50, "D3"], [53, "F3"], [55, "G3"], [57, "A3"],
  [60, "C4"], [62, "D4"], [65, "F4"], [67, "G4"], [69, "A4"], [72, "C5"]
] as const;

export default function MusicSettings({ settings, onChange }: Props) {
  const [draft, setDraft] = useState(settings.customScale.join(", "));
  const parsed = parseCustomScale(draft);

  return (
    <section className="music-settings" aria-label="Music mapping settings">
      <div className="music-settings-heading">
        <span className="section-kicker">MUSICAL MAPPING</span>
        <span>Choose a scale or design your own</span>
      </div>
      <div className="music-settings-grid">
        <label>
          Keyboard mapping
          <select value={settings.mappingMode}
            onChange={(event) => onChange({ mappingMode: event.target.value as MappingMode })}>
            <option value="physical">Physical keys</option>
            <option value="character">Typed characters</option>
          </select>
        </label>
        <label>
          Scale
          <select aria-label="Scale" value={settings.scaleId}
            onChange={(event) => onChange({ scaleId: event.target.value as ScaleId })}>
            <option value="major-pentatonic">Major pentatonic</option>
            <option value="minor-pentatonic">Minor pentatonic</option>
            <option value="major">Major</option>
            <option value="natural-minor">Natural minor</option>
            <option value="blues">Blues</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label>
          Root note
          <select aria-label="Root note" value={settings.rootMidi}
            onChange={(event) => onChange({ rootMidi: Number(event.target.value) })}>
            {ROOTS.map(([midi, label]) =>
              <option key={midi} value={midi}>{label}</option>)}
          </select>
        </label>
      </div>
      {settings.scaleId === "custom" && (
        <div className="custom-scale">
          <label htmlFor="custom-scale-intervals">Scale intervals (semitones)</label>
          <input id="custom-scale-intervals" value={draft} onChange={(event) => setDraft(event.target.value)}
            aria-invalid={parsed === null}
            aria-describedby="scale-guidance" placeholder="0, 2, 4, 7, 9" />
          <button type="button" disabled={!parsed} onClick={() => {
            if (parsed) onChange({ customScale: parsed });
          }}>Apply scale</button>
          <small id="scale-guidance">Start at 0. Enter 2–12 ascending values from 0 to 11.</small>
        </div>
      )}
      <label className="motion-toggle">
        <input type="checkbox" checked={settings.reducedMotion}
          onChange={(event) => onChange({ reducedMotion: event.target.checked })} />
        Reduce motion
      </label>
    </section>
  );
}
