import { useState } from "react";
import type { ChangeEvent } from "react";
import type { SavedComposition, SoundPreset } from "../domain/types";

const PRESET_LABELS: Record<SoundPreset, string> = {
  "felt-piano": "Felt Piano",
  "soft-electric": "Soft Electric",
  "ambient-pluck": "Ambient Pluck"
};

interface Props {
  compositions: SavedComposition[];
  onPlay: (composition: SavedComposition) => void;
  onRename: (id: string, title: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onExportJson: (composition: SavedComposition) => void;
  onExportMidi: (composition: SavedComposition) => void;
  onImport: (file: File) => Promise<void>;
  onClear: () => Promise<boolean>;
}

export default function CompositionStudio({
  compositions, onPlay, onRename, onDelete, onExportJson, onExportMidi, onImport, onClear
}: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [clearPending, setClearPending] = useState(false);
  const [busy, setBusy] = useState(false);

  async function saveTitle(id: string) {
    setBusy(true);
    try {
      if (await onRename(id, draft)) setEditing(null);
    } finally { setBusy(false); }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      if (await onDelete(id)) setDeleting(null);
    } finally { setBusy(false); }
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    setBusy(true);
    try { await onImport(file); }
    finally { event.currentTarget.value = ""; setBusy(false); }
  }

  return (
    <section className="composition-card" aria-label="Composition Studio">
      <div className="aside-heading">
        <div>
          <span className="section-kicker">COMPOSITION STUDIO</span>
          <h3>Recent compositions</h3>
        </div>
        <span className="library-count">{compositions.length}</span>
      </div>
      {compositions.length === 0 ? (
        <div className="empty-library">
          <span className="empty-note" aria-hidden="true">♫</span>
          <p>Your first composition<br />is waiting to happen.</p>
          <span>Save a session to keep it here.</span>
        </div>
      ) : (
        <ul className="composition-list">
          {compositions.map((composition) => (
            <li className="composition-entry" key={composition.id}>
              <div className="composition-title-row">
                <span className="composition-symbol" aria-hidden="true">♪</span>
                <div className="composition-info">
                  {editing === composition.id ? (
                    <div className="composition-rename">
                      <input
                        aria-label={"Rename composition " + composition.id}
                        value={draft}
                        maxLength={100}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") void saveTitle(composition.id);
                          if (event.key === "Escape") setEditing(null);
                        }}
                      />
                      <button type="button" disabled={busy || draft.trim().length === 0}
                        onClick={() => void saveTitle(composition.id)}>Save name</button>
                      <button type="button" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  ) : (
                    <strong>{composition.title}</strong>
                  )}
                  <small>{PRESET_LABELS[composition.preset]} · {composition.notes.length} notes</small>
                </div>
              </div>
              <div className="composition-actions">
                <button type="button" aria-label={"Play " + composition.title}
                  onClick={() => onPlay(composition)}>Play</button>
                <button type="button" aria-label={"Rename " + composition.title}
                  onClick={() => { setEditing(composition.id); setDraft(composition.title); }}>Rename</button>
                <button type="button" aria-label={"Export " + composition.title + " as MIDI"}
                  onClick={() => onExportMidi(composition)}>MIDI</button>
                <button type="button" aria-label={"Export " + composition.title + " as JSON"}
                  onClick={() => onExportJson(composition)}>JSON</button>
                <button type="button" aria-label={"Delete " + composition.title}
                  onClick={() => setDeleting(composition.id)}>Delete</button>
              </div>
              {deleting === composition.id && (
                <div className="composition-confirm" role="group" aria-label={"Delete confirmation for " + composition.title}>
                  <span>Delete this composition?</span>
                  <button type="button" disabled={busy} onClick={() => void remove(composition.id)}>Confirm delete</button>
                  <button type="button" onClick={() => setDeleting(null)}>Cancel</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="library-tools">
        <label className="import-label">
          Import JSON
          <input type="file" aria-label="Import composition JSON" accept=".json,application/json"
            disabled={busy} onChange={(event) => void importFile(event)} />
        </label>
        {compositions.length > 0 && (
          clearPending ? (
            <div className="clear-confirm">
              <span>Delete all saved compositions?</span>
              <button type="button" disabled={busy} onClick={() => {
                setBusy(true);
                void onClear().then((ok) => { if (ok) setClearPending(false); }).finally(() => setBusy(false));
              }}>Confirm clear library</button>
              <button type="button" onClick={() => setClearPending(false)}>Cancel</button>
            </div>
          ) : <button type="button" className="library-clear" onClick={() => setClearPending(true)}>Clear library</button>
        )}
      </div>
      <p className="privacy-note"><span aria-hidden="true">⌑</span> Saved on this device. Original text is never stored with compositions.</p>
    </section>
  );
}
