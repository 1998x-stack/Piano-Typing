# Data Model and Persistence — v2

## 1. Data boundaries

**Local-first.** No account, server, telemetry upload or backend is required. Browser storage is untrusted and may fail or be evicted. Source text is ephemeral by default.

## 2. AppSettings

Stored under \`piano-typing.settings.v1\` in localStorage, with value validation and defaults:
- mode: free-play | typing-flow
- preset: felt-piano | soft-electric | ambient-pluck
- volume: [0,1]
- muted, reducedMotion: booleans
- mappingMode: physical | character
- scaleId: major-pentatonic | minor-pentatonic | major | natural-minor | blues | custom
- rootMidi: valid note between 48 and 72
- customScale: ascending semitone offsets, beginning with 0 and ending at ≤11, 2–12 values

Settings are normalized at read time; corrupt JSON and unknown values revert to safe defaults.

## 3. NoteEvent

- id: local unique identifier.
- code: physical KeyboardEvent.code; \`IME\` for committed IME characters; \`Harmony\` for generated bass/chord notes.
- midi: integer [36,96].
- atMs: monotonic session offset, excluding pause time.
- durationMs: bounded non-negative duration.
- velocity: optional number [0,1], a musical accent **proxy inferred from timing**, not finger pressure.

No original \`key\` or typed text is serialized. A sequence of physical codes and timings is still behavioral metadata; the interface discloses that fact.

## 4. SavedComposition

Schema v2 fields:
- schemaVersion: 2
- id, title (1–100 chars), createdAt ISO time
- durationMs, preset
- mappingMode, scaleId, rootMidi, customScale
- notes: bounded NoteEvent[], max 2,000

Older v1 records without schemaVersion are accepted through the migration adapter and **normalized** to the v2 allowlist, which drops unknown fields such as sourceText. Future unknown schema versions are rejected, not overwritten.

## 5. Storage layout

- localStorage \`piano-typing.settings.v1\` for small settings.
- IndexedDB \`piano-typing\` version 2, object store \`compositions\` keyed by \`id\`.
- Legacy localStorage \`piano-typing.compositions.v1\` is read once and imported transactionally into IndexedDB. It is removed **only after the IDB transaction commits**.
- If IndexedDB cannot be opened, a bounded localStorage repository remains available.
- New saves are limited to the 20 most recent compositions; record size and import text are bounded.
- Explicit rename, delete and clear commands are available.

Transaction failure is recoverable; never clear legacy data before a successful migration.

## 6. Portable formats

- **JSON:** envelope \`format: PianoTypingComposition\`, \`schemaVersion: 2\`, \`composition\` allowlisted v2 record. Import validates type, schema, size and note data before a new local ID is assigned.
- **MIDI:** Standard MIDI File format 0, one track at fixed 120 BPM / 480 PPQ, note-on/off and end-of-track. It contains only musical events. This is a transport format, not a byte-for-byte JSON backup.

## 7. Retention, deletion, and limits

- At most 20 persisted compositions, 2,000 note events each, 1 MB imported file.
- No automatic cloud backup.
- Clear library removes saved compositions; browser settings remain unless the profile is reset.
- Session summary persistence, conflict resolution across tabs, and advanced history analytics are not implemented in this milestone.
