import { useEffect, useMemo, useRef, useState } from "react";
import TypingSurface from "./components/TypingSurface";
import KeyboardVisualizer from "./components/KeyboardVisualizer";
import AudioVisualizer from "./components/AudioVisualizer";
import { mapKeyToMidi } from "./domain/music/mapping";
import MusicSettings from "./components/MusicSettings";
import CompositionStudio from "./components/CompositionStudio";
import { encodeMidi } from "./domain/export/midi";
import { CompositionStore, exportCompositionJson, importCompositionJson } from "./infrastructure/storage/compositionStore";
import { getPhraseAccent, getPhraseChord, getWordBoundaryBass } from "./domain/music/harmony";
import { calculateTypingMetrics } from "./domain/typing/metrics";
import type {
  AppMode,
  AppSettings,
  AudioStatus,
  KeyInput,
  NoteEvent,
  SavedComposition,
  SoundPreset
} from "./domain/types";
import { AudioEngine } from "./infrastructure/audio/AudioEngine";
import { DEFAULT_SETTINGS, readSettings, writeSettings } from "./infrastructure/storage/repository";

const TARGET_TEXT = "The quiet morning begins with a single note.";
const MAX_SESSION_NOTES = 2_000;

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "pt-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
}

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes + ":" + String(seconds).padStart(2, "0");
}

function getBrowserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function downloadFile(name: string, bytes: BlobPart[], mimeType: string): void {
  const objectUrl = URL.createObjectURL(new Blob(bytes, { type: mimeType }));
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = name.replace(/[^a-z0-9._-]/gi, "-").slice(0, 90);
  anchor.click();
  // Delay revocation until the browser has begun the download.
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
}


export default function App() {
  const storageRef = useRef<Storage | null>(null);
  if (storageRef.current === null) storageRef.current = getBrowserStorage();

  const audioEngineRef = useRef<AudioEngine | null>(null);
  if (audioEngineRef.current === null) audioEngineRef.current = new AudioEngine();
  const audioEngine = audioEngineRef.current;
  const compositionStoreRef = useRef<CompositionStore | null>(null);
  if (!compositionStoreRef.current) compositionStoreRef.current = new CompositionStore(storageRef.current);
  const compositionStore = compositionStoreRef.current;

  const [settings, setSettings] = useState<AppSettings>(() =>
    storageRef.current ? readSettings(storageRef.current) : { ...DEFAULT_SETTINGS }
  );
  const [mode, setMode] = useState<AppMode>(settings.mode);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>("idle");
  const [audioError, setAudioError] = useState("");
  const [activeCode, setActiveCode] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(true);
  const [text, setText] = useState("");
  const [keystrokes, setKeystrokes] = useState(0);
  const [notesCaptured, setNotesCaptured] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [paused, setPaused] = useState(false);
  const [notice, setNotice] = useState("");
  const [compositions, setCompositions] = useState<SavedComposition[]>([]);

  const startedAtRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number | null>(null);
  const accumulatedPauseMsRef = useRef(0);
  const noteEventsRef = useRef<NoteEvent[]>([]);
  const phraseIndexRef = useRef(0);
  const limitNoticeShownRef = useRef(false);

  useEffect(() => {
    audioEngine.setPreset(settings.preset);
    audioEngine.setVolume(settings.volume);
    audioEngine.setMuted(settings.muted);
    document.documentElement.dataset.reducedMotion = settings.reducedMotion ? "true" : "false";
  }, [audioEngine, settings]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (startedAtRef.current !== null) {
        const effectiveNow = pausedAtRef.current ?? performance.now();
        setElapsedMs(Math.max(0, effectiveNow - startedAtRef.current - accumulatedPauseMsRef.current));
      }
    }, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        audioEngine.suspend();
        setAudioStatus(audioEngine.getStatus());
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [audioEngine]);

  useEffect(() => () => audioEngine.dispose(), [audioEngine]);

  useEffect(() => {
    let active = true;
    void compositionStore.list().then((items) => {
      if (active) setCompositions(items);
    }).catch(() => {
      if (active) setNotice("Saved compositions could not be loaded.");
    });
    return () => { active = false; };
  }, [compositionStore]);

  const metrics = useMemo(() => calculateTypingMetrics({
    typedText: text,
    targetText: mode === "typing-flow" ? TARGET_TEXT : undefined,
    elapsedMs
  }), [text, mode, elapsedMs]);

  function updateSettings(patch: Partial<AppSettings>): void {
    const next = { ...settings, ...patch };
    setSettings(next);
    if (storageRef.current) {
      const stored = writeSettings(next, storageRef.current);
      if (!stored) setNotice("Settings could not be saved in this browser.");
    }
  }

  function changeMode(nextMode: AppMode): void {
    setMode(nextMode);
    updateSettings({ mode: nextMode });
    setNotice(nextMode === "free-play"
      ? "Free Play is ready. Type anything and let the notes unfold."
      : "Typing Flow is ready. Follow the sentence at your own pace.");
  }

  function handleKeyInput(input: KeyInput): void {
    if (paused) return;
    if (startedAtRef.current === null) {
      startedAtRef.current = input.timestamp;
      pausedAtRef.current = null;
      accumulatedPauseMsRef.current = 0;
    }
    setKeystrokes((count) => count + 1);

    const midi = mapKeyToMidi(input.code, input.key, settings);
    if (midi !== null) {
      setActiveCode(input.code);
      if (noteEventsRef.current.length < MAX_SESSION_NOTES) {
        const note: NoteEvent = {
          id: createId(),
          code: input.code,
          midi,
          atMs: Math.max(0, input.timestamp - startedAtRef.current),
          durationMs: 520
        };
        noteEventsRef.current.push(note);
        audioEngine.playNote({ midi, durationMs: note.durationMs });
      } else if (!limitNoticeShownRef.current) {
        setNotice("This session reached the 2,000-note capture limit. You can still keep typing.");
        limitNoticeShownRef.current = true;
      }
    }

    if (input.key === " ") {
      const bassMidi = getWordBoundaryBass(phraseIndexRef.current, settings.rootMidi);
      if (noteEventsRef.current.length < MAX_SESSION_NOTES) {
        noteEventsRef.current.push({
          id: createId(),
          code: "Harmony",
          midi: bassMidi,
          atMs: Math.max(0, input.timestamp - startedAtRef.current),
          durationMs: 360
        });
        audioEngine.playNote({ midi: bassMidi, velocity: 0.3, durationMs: 360 });
      }
    }

    const accent = getPhraseAccent(input.key);
    if (accent !== null) {
      const chord = getPhraseChord(phraseIndexRef.current, settings.rootMidi);
      const chordDuration = accent === "full" ? 860 : 460;
      const chordAtMs = Math.max(0, input.timestamp - startedAtRef.current);
      chord.forEach((chordMidi, index) => {
        if (noteEventsRef.current.length >= MAX_SESSION_NOTES) return;
        noteEventsRef.current.push({
          id: createId(),
          code: "Harmony",
          midi: chordMidi,
          atMs: chordAtMs + index * 9,
          durationMs: chordDuration
        });
      });
      setNotesCaptured(noteEventsRef.current.length);
      audioEngine.playChord(chord, chordDuration, accent === "soft" ? 35 : 0);
      if (accent === "full") phraseIndexRef.current += 1;
    } else {
      setNotesCaptured(noteEventsRef.current.length);
    }
  }
  function handleTextChange(nextText: string): void {
    setText(nextText);
    if (startedAtRef.current === null && nextText.length > 0) {
      startedAtRef.current = performance.now();
      pausedAtRef.current = null;
      accumulatedPauseMsRef.current = 0;
    }
  }

  async function enableSound(): Promise<boolean> {
    try {
      await audioEngine.initializeFromUserGesture();
      audioEngine.setPreset(settings.preset);
      audioEngine.setVolume(settings.volume);
      audioEngine.setMuted(settings.muted);
      setAudioStatus("ready");
      setAudioError("");
      setNotice("Sound is ready. Your next keystroke will play a note.");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Audio could not be started.";
      setAudioStatus(audioEngine.getStatus() === "unavailable" ? "unavailable" : "error");
      setAudioError(message);
      return false;
    }
  }

  async function replayNotes(notes: NoteEvent[], preset: SoundPreset = settings.preset): Promise<void> {
    if (notes.length === 0) {
      setNotice("Type a few notes before replaying a composition.");
      return;
    }
    const ready = await enableSound();
    if (!ready) return;
    audioEngine.setPreset(preset);
    const firstAt = notes[0].atMs;
    notes.forEach((note) => {
      audioEngine.playNote(
        { midi: note.midi, durationMs: note.durationMs },
        Math.max(0, note.atMs - firstAt)
      );
    });
    audioEngine.setPreset(settings.preset);
  }

  async function refreshCompositions(): Promise<void> {
    setCompositions(await compositionStore.list());
  }

  async function saveCurrentComposition(): Promise<void> {
    const notes = noteEventsRef.current.slice(0, MAX_SESSION_NOTES);
    if (notes.length === 0) {
      setNotice("Play a few notes before saving a composition.");
      return;
    }

    const composition: SavedComposition = {
      schemaVersion: 2,
      id: createId(),
      title: "Untitled composition",
      createdAt: new Date().toISOString(),
      durationMs: startedAtRef.current === null
        ? elapsedMs
        : Math.max(0, (pausedAtRef.current ?? performance.now()) - startedAtRef.current - accumulatedPauseMsRef.current),
      preset: settings.preset,
      mappingMode: settings.mappingMode,
      scaleId: settings.scaleId,
      rootMidi: settings.rootMidi,
      customScale: settings.customScale,
      notes
    };

    if (!await compositionStore.save(composition)) {
      setNotice("This browser could not save the composition. Your current session is still available.");
      return;
    }
    await refreshCompositions();
    setNotice("Composition saved locally. Your original text was not stored.");
  }

  async function renameComposition(id: string, title: string): Promise<boolean> {
    const saved = await compositionStore.rename(id, title);
    if (saved) {
      await refreshCompositions();
      setNotice("Composition renamed.");
    } else setNotice("Unable to rename composition. Please enter 1–100 characters.");
    return saved;
  }

  async function deleteComposition(id: string): Promise<boolean> {
    const saved = await compositionStore.delete(id);
    if (saved) {
      await refreshCompositions();
      setNotice("Composition deleted.");
    } else setNotice("Unable to delete composition.");
    return saved;
  }

  async function clearLibrary(): Promise<boolean> {
    const saved = await compositionStore.clear();
    if (saved) {
      await refreshCompositions();
      setNotice("Saved compositions have been cleared from this device.");
    } else setNotice("Unable to clear the composition library.");
    return saved;
  }

  function exportComposition(composition: SavedComposition, format: "json" | "midi"): void {
    try {
      const filename = composition.title || "composition";
      if (format === "json") {
        downloadFile(filename + ".json", [exportCompositionJson(composition)], "application/json");
      } else {
        downloadFile(filename + ".mid", [new Uint8Array(encodeMidi(composition.notes))], "audio/midi");
      }
      setNotice("Composition exported as " + format.toUpperCase() + ".");
    } catch {
      setNotice("The composition could not be exported.");
    }
  }

  async function importComposition(file: File): Promise<void> {
    try {
      if (file.size > 1_000_000) throw new Error("File exceeds 1 MB.");
      const imported = importCompositionJson(await file.text());
      const saved = await compositionStore.save({
        ...imported, id: createId(), createdAt: new Date().toISOString()
      });
      if (!saved) throw new Error("Storage failed.");
      await refreshCompositions();
      setNotice("Composition imported. Original text remains private.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Composition import failed.");
    }
  }

  function togglePause(): void {
    if (!paused) {
      pausedAtRef.current = performance.now();
      if (startedAtRef.current !== null) {
        setElapsedMs(Math.max(0, pausedAtRef.current - startedAtRef.current - accumulatedPauseMsRef.current));
      }
      setPaused(true);
      return;
    }
    if (pausedAtRef.current !== null) {
      accumulatedPauseMsRef.current += performance.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }
    setPaused(false);
  }

  function clearSession(): void {
    setText("");
    setKeystrokes(0);
    setNotesCaptured(0);
    setElapsedMs(0);
    startedAtRef.current = null;
    pausedAtRef.current = null;
    accumulatedPauseMsRef.current = 0;
    noteEventsRef.current = [];
    phraseIndexRef.current = 0;
    setActiveCode("");
    limitNoticeShownRef.current = false;
    setPaused(false);
    setNotice("A fresh session is ready.");
  }

  function toggleMute(): void {
    updateSettings({ muted: !settings.muted });
  }

  const audioLabel = audioStatus === "ready"
    ? "Sound ready"
    : audioStatus === "unavailable"
      ? "Audio unavailable"
      : audioStatus === "error"
        ? "Sound needs attention"
        : "Sound not enabled";

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Piano Typing home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span className="brand-name">piano<span>typing</span></span>
        </a>
        <nav className="mode-nav" aria-label="Practice mode">
          <button
            className={mode === "free-play" ? "nav-tab active" : "nav-tab"}
            onClick={() => changeMode("free-play")}
            type="button"
          >
            Free Play
          </button>
          <button
            className={mode === "typing-flow" ? "nav-tab active" : "nav-tab"}
            onClick={() => changeMode("typing-flow")}
            type="button"
          >
            Typing Flow
          </button>
        </nav>
        <div className="topbar-meta">
          <span className={audioStatus === "ready" ? "audio-indicator ready" : "audio-indicator"}>
            <span className="status-dot" />
            {audioLabel}
          </span>
        </div>
      </header>

      <section className="intro">
        <div className="eyebrow"><span className="eyebrow-line" /> A QUIETER WAY TO PRACTICE</div>
        <h1>Let your hands<br /><em>make music.</em></h1>
        <p>
          Every keystroke becomes a note. Find a rhythm in your own words,
          and let the ordinary act of typing turn into something you can hear.
        </p>
      </section>

      <section className="studio-layout" aria-label="Typing music studio">
        <div className="studio-main">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">THE STUDIO</span>
              <h2>{mode === "free-play" ? "Your keyboard, your instrument." : "Follow the line. Find the melody."}</h2>
            </div>
            <span className="session-chip"><span className="live-dot" /> SESSION {paused ? "PAUSED" : "LIVE"}</span>
          </div>

          <div className="typing-card">
            <div className="typing-card-top">
              <div className="prompt-label">
                <span className="prompt-icon">♪</span>
                {mode === "free-play" ? "FREE EXPRESSION" : "TODAY'S PASSAGE"}
              </div>
              <span className="keyboard-hint">CLICK INSIDE TO BEGIN</span>
            </div>

            {mode === "typing-flow" && (
              <div className="target-passage">
                <span className="target-label">TYPE THIS PASSAGE</span>
                <p>{TARGET_TEXT}</p>
              </div>
            )}

            <TypingSurface
              value={text}
              onChange={handleTextChange}
              onKeyInput={handleKeyInput}
              disabled={paused}
              placeholder={mode === "free-play"
                ? "Start typing. Your keyboard is the instrument…"
                : "Type the passage here…"}
            />

            <div className="typing-card-footer">
              <span>{text.length.toLocaleString()} characters</span>
              <span>{paused ? "Paused — resume when you're ready" : "No timer. No pressure. Just play."}</span>
            </div>
          </div>

          <KeyboardVisualizer
            activeCode={activeCode}
            open={keyboardOpen}
            onToggle={() => setKeyboardOpen((value) => !value)}
          />

          <div className="sound-row">
            <div className="sound-select">
              <label htmlFor="sound-preset">INSTRUMENT</label>
              <select
                id="sound-preset"
                value={settings.preset}
                onChange={(event) => updateSettings({ preset: event.currentTarget.value as SoundPreset })}
              >
                <option value="felt-piano">Felt Piano</option>
                <option value="soft-electric">Soft Electric</option>
                <option value="ambient-pluck">Ambient Pluck</option>
              </select>
            </div>
            <div className="volume-control">
              <label htmlFor="master-volume">VOLUME</label>
              <input
                id="master-volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.volume}
                onChange={(event) => updateSettings({ volume: Number(event.currentTarget.value) })}
              />
              <span>{Math.round(settings.volume * 100)}%</span>
            </div>
            <button
              className={settings.muted ? "quiet-button selected" : "quiet-button"}
              type="button"
              onClick={toggleMute}
              aria-label={settings.muted ? "Unmute sound" : "Mute sound"}
              title={settings.muted ? "Unmute sound" : "Mute sound"}
            >
              <span aria-hidden="true">{settings.muted ? "◌" : "◖"}</span>
              {settings.muted ? "Muted" : "Sound on"}
            </button>
          </div>

          {audioStatus === "ready" && <AudioVisualizer engine={audioEngine} reducedMotion={settings.reducedMotion} />}

          <MusicSettings settings={settings} onChange={updateSettings} />

          <div className="action-row">
            <button className="primary-button" type="button" onClick={() => void enableSound()}>
              <span aria-hidden="true">♫</span>
              {audioStatus === "ready" ? "Sound enabled" : "Enable sound"}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={togglePause}
              disabled={text.length === 0 && keystrokes === 0}
            >
              {paused ? "Resume session" : "Pause session"}
            </button>
            <button className="text-button" type="button" onClick={clearSession}>Clear session</button>
            <span className="action-spacer" />
            <button className="secondary-button" type="button" onClick={() => void replayNotes(noteEventsRef.current)}>
              <span aria-hidden="true">↻</span> Replay
            </button>
            <button
              className="secondary-button save-button"
              type="button"
              onClick={() => void saveCurrentComposition()}
              disabled={noteEventsRef.current.length === 0}
            >
              Save composition
            </button>
          </div>

          {audioError && <p className="inline-error" role="alert">{audioError}</p>}
          {notice && <p className="notice-line" role="status">{notice}</p>}
        </div>

        <aside className="studio-aside">
          <section className="metrics-card">
            <div className="aside-heading">
              <span className="section-kicker">YOUR SESSION</span>
              <span className="session-time">{formatDuration(elapsedMs)}</span>
            </div>
            <div className="metric-primary">
              <span className="metric-value" data-testid="keystroke-count">{keystrokes.toLocaleString()}</span>
              <span className="metric-label">KEYSTROKES</span>
            </div>
            <div className="metric-grid">
              <div className="metric-cell">
                <strong>{metrics.grossWpm}</strong>
                <span>GROSS WPM</span>
              </div>
              <div className="metric-cell">
                <strong>{metrics.accuracy === null ? "—" : metrics.accuracy + "%"}</strong>
                <span>ACCURACY</span>
              </div>
              <div className="metric-cell">
                <strong data-testid="notes-count">{notesCaptured.toLocaleString()}</strong>
                <span>NOTES CAPTURED</span>
              </div>
              <div className="metric-cell">
                <strong>{formatDuration(elapsedMs)}</strong>
                <span>PLAY TIME</span>
              </div>
            </div>
            <p className="metric-footnote">
              {mode === "free-play"
                ? "Accuracy is measured only in Typing Flow, where a target passage exists."
                : "Accuracy compares each typed character with the target passage."}
            </p>
          </section>

          <CompositionStudio
            compositions={compositions}
            onPlay={(composition) => void replayNotes(composition.notes, composition.preset)}
            onRename={renameComposition}
            onDelete={deleteComposition}
            onExportJson={(composition) => exportComposition(composition, "json")}
            onExportMidi={(composition) => exportComposition(composition, "midi")}
            onImport={importComposition}
            onClear={clearLibrary}
          />
        </aside>
      </section>

      <footer className="page-footer">
        <span>PIANO TYPING <span className="footer-divider">/</span> A SMALL INSTRUMENT FOR EVERYDAY WORDS</span>
        <span>TAKE YOUR TIME. FIND YOUR SOUND.</span>
      </footer>
    </main>
  );
}
