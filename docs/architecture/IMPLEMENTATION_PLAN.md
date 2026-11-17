# Implementation Plan

**Delivery strategy:** vertical slices, evidence before expansion.

## Current delivery snapshot — 2026-11-17

### Engineering foundation
- [x] Architecture documents and ADRs.
- [x] React + TypeScript + Vite application scaffold.
- [x] Domain pitch mapping, harmony progression, and typing metrics.
- [x] Web Audio synthesis service with three presets, mute/volume, bounded voices, explicit initialization, and fake-context unit coverage.
- [x] Local settings and bounded composition persistence.
- [x] Vitest unit/component tests and Playwright Chromium E2E in CI.
- [x] CI typecheck, test, browser E2E, and production build pass.

### First product vertical slice
- [x] Free Play and Typing Flow.
- [x] Keyboard-to-note feedback and three synthesized timbres.
- [x] Word-boundary bass pulses and punctuation chord accents.
- [x] Collapsible keyboard visualizer and active-key feedback.
- [x] Save and replay compositions locally without saving source text.
- [x] Basic WPM and target-text accuracy display.

### Not yet release-verified
- [ ] Real-device 10-minute audio soak test.
- [ ] Physical keydown-to-audible-output latency measurement.
- [ ] IME and non-QWERTY layout verification in real browsers.
- [x] AnalyserNode waveform visualization.
- [ ] Richer accompaniment and additional arrangement controls.
- [ ] Package lockfile and npm ci.
- [ ] Composition rename/delete/export and storage migration.
- [ ] Cross-browser accessibility and performance audit.

The current code is a tested first product slice. Do not mark the MVP release complete until the remaining physical-device and reliability gates are evidenced.

## Phase 0 — Architecture and engineering foundation

Deliver:
- Architecture decision records and system design.
- React + TypeScript + Vite project scaffold.
- CI for typecheck, tests, and production build.
- Domain pitch mapper and pure typing metrics.
- AudioEngine interface and first synthesized preset.
- Minimal accessible app shell.

Exit gate:
- CI green.
- Unit tests cover pitch mapping, frequency conversion, and typing metrics.
- Typing remains functional if AudioContext is unavailable.
- Audio is only enabled after a user gesture.
- No global keyboard listener.

## Phase 1 — Usable Free Play MVP

Deliver:
- Free Play typing surface.
- Three synthesized presets.
- Mute, volume, pause, and clear controls.
- Session note-event buffer.
- Composition replay.
- Versioned local settings and bounded composition history.
- Responsive visual design.

Exit gate:
- Manual 10-minute typing soak test.
- No unbounded voice growth or unhandled promise rejection.
- Mute works immediately.
- Replay preserves event order and relative timing.
- Storage corruption and quota errors are non-fatal.
- Keyboard focus and IME regression checks pass.

## Phase 2 — Typing Flow and feedback

Deliver:
- Target text practice.
- Accuracy and WPM with documented definitions.
- Session summaries and personal baseline.
- Virtual keyboard visualization and optional weak-key analysis.
- Keyboard layout abstraction.

Exit gate:
- Metrics match hand-calculated fixtures.
- Free Play never displays misleading accuracy.
- Text input remains native and supports IME.

## Phase 3 — Composition studio

Deliver:
- Saved composition library.
- Rename/delete.
- Export event JSON and MIDI if implementation and licensing review pass.
- User-defined scales and mapping profiles.
- More expressive accompaniment.

Exit gate:
- Export/import round-trip tests.
- Versioned schema migration.
- Audio performance profiling on reference hardware.

## Phase 4 — Product hardening

Deliver:
- PWA/offline support if user research supports it.
- Cross-browser test matrix.
- Accessibility audit.
- Performance and latency report.
- Release documentation and license review.

## Execution rules

1. Work on a feature branch; do not push unreviewed implementation directly to main.
2. Reproduce before fixing defects.
3. Add a failing test before changing behavior when practical.
4. Do not delete or weaken tests to make CI green.
5. Record every unverified assumption in GOTCHAS.md.
6. Mark tests NOT RUN when they were not executed.
7. Keep commits small and phase-scoped.
8. Do not claim audible latency targets without physical measurement.
