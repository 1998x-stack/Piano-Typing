# Piano Typing

**Turn every keystroke into a note.**

Piano Typing is a local-first, browser-based keyboard instrument. Type freely, practice a passage, hear harmonically mapped notes, and save short compositions for playback or MIDI export.

## Scope

Piano Typing focuses on typing-to-music and practice, not vocabulary drills or reaction games. Language-learning workflows are maintained separately in [Word Orchestra](https://github.com/1998x-stack/Word-Orchestra).

## Current functionality

- React + TypeScript + Vite, running entirely in the browser.
- Free Play and Typing Flow with native editable text, gross WPM, target-text accuracy, pause-aware session timing.
- Web Audio synthesized Felt Piano, Soft Electric and Ambient Pluck presets; master gain, mute, voice cap and gentle per-note filtering.
- Pentatonic, major, natural minor, blues and **custom scale** options with selectable root note.
- **Physical-key** and **character-based** mapping choices; Unicode characters committed by Chinese/other IMEs can become note events without triggering intermediate composition keydowns.
- Word-boundary bass, punctuation-triggered phrase chords, rhythm-sensitive velocity proxies, collapsible key map and live waveform.
- Composition Studio: local save, rename, delete, clear, JSON import/export, standards-based MIDI file export.
- IndexedDB compositions (schema v2), automatic migration of validated legacy localStorage compositions, bounded retention, and localStorage fallback when IndexedDB is unavailable.
- Bounded lookahead replay scheduler, stop control and original-instrument replay.
- JavaScript note-scheduling overhead telemetry. **This is not physical audible latency.**
- Vitest and Playwright browser tests with GitHub Actions.

The timbres are **piano-inspired synths**, not licensed acoustic piano sample libraries. Actual acoustic quality and full physical key-to-sound latency require device-based measurement.

## Run locally

Requirements: Node.js 22 and npm.

```sh
npm ci
npm run dev
```

To validate:

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

The dependency graph is pinned by the committed `package-lock.json`; CI uses `npm ci` and Ubuntu 24.04 for Playwright 1.52 compatibility.

## Privacy and storage

No account, backend, microphone permission, analytics endpoint, or remote text upload is needed. Keyboard events are handled only by the focused in-app typing surface. Saving a composition stores **note metadata (pitch, timing, physical code or reserved IME indicator, preset, mapping)**, not the typed source text. Data remains in this browser profile; use the Composition Studio library controls to remove it or download a backup.

IndexedDB may be cleared by the browser or user. JSON export provides an explicit portable backup. Import rejects unsupported schemas and oversized files.

## Engineering documentation

- [System architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)
- [Audio engine](docs/architecture/AUDIO_ENGINE.md)
- [Storage and migration](docs/architecture/DATA_MODEL.md)
- [Security and privacy](docs/architecture/SECURITY_AND_PRIVACY.md)
- [Phased implementation plan](docs/architecture/IMPLEMENTATION_PLAN.md)
- [Test strategy](docs/architecture/TEST_STRATEGY.md)
- [Gotchas and CI evidence](docs/architecture/GOTCHAS.md)
- [Physical audio/IME acceptance protocol](docs/verification/DEVICE_AUDIO_ACCEPTANCE.md)
- [Release gate ledger](docs/verification/RELEASE_GATES.md)
- [Product design specification](docs/Piano-Typing-Product-Design.md)

## Release status

The software work is being validated on the open implementation PR. Automated tests do **not** establish wired-device P50/P95 audible latency, long-duration listening quality, or real physical keyboard compatibility. Those P0 gates are currently **NOT RUN** and must be verified before advertising the release as physically validated.

## License

A code license and any future audio-sample rights must be settled before wider distribution. Current instruments use oscillator synthesis, not bundled recordings.
