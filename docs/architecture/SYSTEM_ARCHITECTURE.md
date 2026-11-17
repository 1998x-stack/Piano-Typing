# System Architecture

**Status:** Proposed baseline  
**Version:** 1.0  
**Date:** 2026-11-17

## 1. Architectural goals

Piano Typing is a browser-first, local-first instrument for natural text input. Its core engineering problem is to translate physical keyboard events into pleasant, low-latency sound without making the input surface fragile or coupling the audio engine to the UI.

The architecture MUST:

1. Keep keyboard input, musical mapping, audio synthesis, typing analytics, persistence, and presentation as separate responsibilities.
2. Keep the audio path independent of React rendering and state updates.
3. Process keyboard events only while the dedicated typing surface owns focus.
4. Preserve stable key-to-pitch mapping within a selected mapping profile.
5. Work without an account, backend, analytics service, or network connection after the application is loaded.
6. Avoid persisting raw text by default.
7. Make audio failure non-fatal: typing must remain usable if audio is unavailable or blocked.

## 2. Product scope for the first release

### Included

- Free Play: arbitrary text input with immediate note feedback.
- Typing Flow: target text plus natural typing and lightweight accuracy/speed feedback.
- Three synthesized presets: Felt Piano, Soft Electric, and Ambient Pluck.
- Stable pentatonic key mapping.
- Phrase boundaries from spaces, punctuation, and pauses.
- Session note-event capture and local replay.
- Local settings and recent-session history.
- Mute, master volume, pause, clear, and replay controls.
- Responsive desktop-first interface with keyboard accessibility.

### Explicitly excluded from the first release

- User accounts, cloud sync, social sharing, leaderboards, and payments.
- Microphone access, MIDI input, and system-wide keyboard capture.
- AI-generated accompaniment or cloud inference.
- English vocabulary learning and spaced repetition.
- Imported audio samples until licensing and distribution rights are reviewed.
- Claims of professional typing assessment or medical/ergonomic benefit.

## 3. System context

The application is a static web client. It is hosted as static assets and executes entirely in the browser.

External runtime dependencies:
- Browser DOM and keyboard event model.
- Web Audio API.
- Browser storage (IndexedDB preferred for growing compositions; localStorage acceptable for small settings and bounded history).
- No required external API.

Build-time dependencies:
- Node.js 22.
- React and TypeScript.
- Vite.
- Vitest and Testing Library.
- GitHub Actions for validation and static hosting deployment.

## 4. Logical architecture

### Presentation layer

Owns layout, accessible controls, visual feedback, and user intent. React components may display state, but MUST NOT own oscillator nodes or schedule audio directly.

Current components:
- App: application shell, mode switching, sound controls, metrics, and composition list.
- TypingSurface: focused text input and keyboard event normalization.
- KeyboardVisualizer: collapsible QWERTY physical-key feedback.
- AudioVisualizer: canvas waveform driven by AudioEngine analyser samples.

Keep small presentation elements inside App until extraction improves testability or reduces complexity. Do not create empty component abstractions solely to mirror the architecture diagram.

### Application layer

Coordinates user actions and use cases:
- Start or pause a session.
- Handle a committed physical key event.
- Start audio after a user gesture.
- Save or replay a composition.
- Change sound preset, volume, and mapping profile.
- Compute and present typing metrics.

Application services orchestrate domain services and infrastructure adapters. They do not implement musical theory or browser storage details.

### Domain layer

Pure TypeScript logic with no React, DOM, or Web Audio imports:
- KeyboardCodeMapper: physical key code to stable scale degree and MIDI pitch.
- Scale and tuning definitions.
- Phrase segmentation.
- Typing metrics.
- Session and composition types.
- Session validation and bounded history rules.

Domain logic must be deterministic and unit-testable.

### Infrastructure layer

Browser-specific adapters:
- AudioEngine: AudioContext lifecycle, synthesis, voice management, master gain, and scheduling.
- SessionRepository: versioned local persistence.
- SettingsRepository: validated settings persistence.
- BrowserCapabilities: feature detection and graceful fallbacks.

The AudioEngine is exposed through a narrow interface. The UI must not receive raw AudioNodes.

## 5. Runtime data flow

1. The user focuses the dedicated typing surface.
2. A keydown event is inspected by the input adapter.
3. Modifier-only, repeated, composing, and non-printable events are ignored by the note path.
4. A printable physical key code is passed to KeyboardCodeMapper.
5. The application emits a small immutable note event containing code, MIDI pitch, velocity proxy, and monotonic session offset. Raw document text is not included.
6. The AudioEngine schedules the note against AudioContext.currentTime and exposes analyser samples through a narrow readWaveform method for the live visualizer. Word boundaries may additionally schedule a low bass pulse, while phrase-ending punctuation schedules a chord accent from a deterministic progression.
7. A compact visual event is published to the UI. Rendering is throttled or batched; it is never part of the audio scheduling path.
8. Typing metrics consume committed text changes separately from note events.
9. When the user explicitly saves a composition, the note-event sequence and user-provided title are persisted. Raw typed text remains excluded unless the user explicitly opts in.

## 6. Module boundaries

| Module | Owns | Must not own |
|---|---|---|
| input | focused-surface keyboard event normalization | audio nodes, persistence |
| music | physical key mapping, scales, pitch math | DOM, React |
| audio | sound generation, timing, voices, mute/volume | text input, UI layout |
| typing | accuracy, WPM, consistency calculations | note synthesis |
| session | session lifecycle and composition events | browser APIs |
| storage | schema validation, migrations, retention | product decisions |
| UI | rendering and user controls | real-time audio scheduling |

## 7. State ownership

- React state: visible settings, mode, current text, current session summary, audio status, recent compositions.
- Refs or application service state: monotonic start time, event buffers, pending animation frame IDs.
- AudioEngine private state: AudioContext, master gain, active voices, preset configuration, audio lifecycle.
- Persistent storage: settings and explicitly saved composition metadata/events.
- Ephemeral only: raw typing text in Free Play unless the user deliberately saves it.

Do not put per-keystroke note events into a large React state array. Keep a bounded in-memory event buffer and publish only the latest visual event or a throttled batch.

## 8. Error handling

Audio initialization can fail because of browser policy, missing APIs, device changes, or context suspension. The app MUST show a recoverable audio status and continue to accept text.

Storage failures MUST not crash the typing surface. The app should display a non-blocking warning and retain the current in-memory session.

Malformed persisted data MUST be discarded or migrated safely. Never blindly trust localStorage JSON.

## 9. Deployment shape

The first release is a static SPA:
- Build: Vite produces static assets.
- Hosting: GitHub Pages or any static host.
- No server-side secrets or user data.
- SPA fallback is required for non-root routes only if routes are introduced.
- Production build must not contain source maps with private source content unless intentionally enabled.

## 10. Quality attributes and measurable budgets

| Attribute | Initial target | Measurement |
|---|---:|---|
| keydown-to-scheduled-note | < 10 ms application overhead | performance marks around mapping and scheduling |
| audible key-to-sound | median ≤ 50 ms, P95 ≤ 80 ms on reference setup | external loopback/audio measurement; browser metrics are not sufficient |
| active voices | ≤ 24 by default | AudioEngine voice counter |
| saved sessions | latest 30, bounded | repository retention test |
| saved composition events | cap per composition and validate | repository schema tests |
| input reliability | no dropped text due to audio errors | component and E2E tests |
| offline operation | all core features after first load | network-disabled browser test |

Latency targets are engineering goals, not universal guarantees. Bluetooth devices and operating-system audio buffers may exceed them.

## 11. Evolution path

- Phase 0: architecture, static app shell, input-to-note vertical slice, synthesized sound, tests.
- Phase 1: Free Play and Typing Flow, session replay, settings, local persistence.
- Phase 2: richer accompaniment, key/bigram analytics, configurable keyboard layouts.
- Phase 3: composition library, MIDI/event export, custom scales and presets.
- Future shared package: extract music and audio modules only after their public contracts stabilize; do not prematurely create a monorepo or shared package.
