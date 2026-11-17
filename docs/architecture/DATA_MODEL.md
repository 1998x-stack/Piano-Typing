# Data Model and Persistence

**Status:** Proposed baseline

## 1. Principles

- Local-first and privacy-preserving by default.
- Version every persisted record.
- Validate data at read boundaries.
- Keep saved data bounded.
- Never persist raw text merely because the user typed it.
- Store composition events rather than a copy of the source document.

## 2. Domain types

### AppSettings

- schemaVersion: integer
- mode: free-play | typing-flow
- preset: felt-piano | soft-electric | ambient-pluck
- volume: number in [0, 1]
- muted: boolean
- mapping: stable-pentatonic
- reducedMotion: boolean

### NoteEvent

- id: stable unique identifier
- code: physical KeyboardEvent.code for key-origin notes; the reserved value Harmony identifies word-boundary bass and phrase-chord accompaniment notes
- midi: integer in [36, 96]
- atMs: non-negative monotonic offset from session start
- durationMs: bounded duration
- velocity: normalized proxy, not physical key pressure

The browser keyboard event model does not expose real mechanical key pressure. Velocity is a musical accent proxy derived from timing or a fixed default and must never be described as measured finger force.

### Composition

- schemaVersion
- id
- title
- createdAt: ISO timestamp
- durationMs
- preset
- mapping
- notes: bounded NoteEvent[]
- sourceTextIncluded: false by default

### SessionSummary

- schemaVersion
- id
- startedAt
- durationMs
- mode
- keystrokes
- correctedCharacters
- accuracy: nullable when no target text exists
- grossWpm
- notesPlayed
- compositionId: optional

## 3. Storage layout

Small settings may use localStorage with a versioned key:
- piano-typing.settings.v1

Composition history may begin in localStorage only with strict size limits. Before adding long sessions, move to IndexedDB:
- piano-typing.compositions.v1
- piano-typing.sessions.v1

Repository interfaces should hide the backing store so localStorage can be replaced by IndexedDB without changing domain code.

## 4. Retention and limits

Initial limits:
- 30 recent session summaries.
- 20 saved compositions.
- 2,000 note events per composition.
- 100 characters for a composition title.
- 1 MB maximum serialized record size.

When limits are reached, evict oldest history first. Never silently truncate the current in-memory composition; ask the user to save a shorter version or export it.

## 5. Validation and migration

- Validate schemaVersion before use.
- Reject NaN, Infinity, negative timestamps, unknown presets, invalid MIDI, oversized arrays, and malformed IDs.
- Unknown future schema versions must not be overwritten.
- Migrations must be pure functions with fixture tests.
- Storage read/write exceptions are recoverable and must not block typing.

## 6. Privacy

Raw text is ephemeral by default. Saved composition events reveal timing and physical key codes, so users must be told that saving a composition stores note-event metadata. No analytics endpoint is included in the first release.
