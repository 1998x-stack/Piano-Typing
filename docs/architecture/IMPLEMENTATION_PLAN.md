# Phased Implementation Plan

**Snapshot: 2026-11-18 — software implementation in PR #1, physical acceptance NOT RUN.**

## Delivery principles

Complete one testable vertical slice before expanding scope. Prefer pure domain algorithms, narrow browser adapters, local-first privacy, and independent tests. Work on a PR branch, keep raw evidence, and do not claim acoustic latency from JS timing alone.

## Phase 0 — Engineering baseline and reliability

| Deliverable | Status |
|---|---|
| Architecture, ADRs, domain/audio/UI boundaries | Implemented |
| React/TypeScript/Vite, Vitest, Playwright and GitHub Actions | Implemented |
| Committed package-lock and npm ci | Implemented |
| Focused native text input, IME composition support | Implemented; real physical IME matrix NOT RUN |
| Physical/character-based mapping for alternative layouts | Implemented; real AZERTY/Dvorak validation NOT RUN |
| Audio lifecycle and fake-context tests | Implemented |
| Hardware P50/P95 audible latency | NOT RUN — see DEVICE_AUDIO_ACCEPTANCE.md |
| Ten-minute physical audio soak | NOT RUN — see DEVICE_AUDIO_ACCEPTANCE.md |

## Phase 1 — Free Play and typing experience

- [x] Three browser-synthesized timbres, mute, volume, pause, clear.
- [x] Audio cap, gentle filter, and conservative voice gain.
- [x] Phrase chords, bass punctuation/word accents, rhythm-derived velocity.
- [x] Free Play, Typing Flow, gross WPM and target-based accuracy.
- [x] Canvas audio waveform and collapsible physical key visualization.
- [x] JS scheduling overhead diagnostic with bounded sample collection.
- [ ] Physical acoustic listening and clipping validation.
- [ ] Multi-browser accessibility audit.

## Phase 2 — Composition Studio and local data

- [x] Save, rename, delete, clear, replay, JSON import/export.
- [x] Standard MIDI File format 0 export.
- [x] IndexedDB composition store schema v2; validated legacy localStorage import, retention cap and fallback.
- [x] Buffered replay with ≤160 ms lookahead instead of scheduling every oscillator at once.
- [x] Original preset for replay; stop playback.
- [ ] Concurrency/recovery under forced quota and browser termination, and persistence fuzzing.

## Phase 3 — Musical customization

- [x] Major/minor pentatonic, major, natural minor and blues scale.
- [x] Custom semitone intervals, root note and persisted mapping preference.
- [x] Typed-character mapping for alternate layouts and committed IME code points.
- [x] Transposed accompaniment chord roots.
- [ ] Sampled acoustic piano assets only if independently licensed and listening tests justify bundle cost.
- [ ] Optional advanced arrangement, tempo and rhythm controls after user validation.

## Phase 4 — Release acceptance

Required before a physical-audio-verified release:

1. All required CI checks green on exact release commit.
2. 200 measured contacts on reference wired output with P50 ≤50 ms and P95 ≤80 ms, including methodology and raw evidence.
3. Ten-minute physical typing/audio soak, no lost text, stuck notes, clipping or unbounded resource growth.
4. Real QWERTY + non-QWERTY + Chinese Pinyin IME matrix on specified devices.
5. Safari and Firefox compatibility audit, keyboard accessibility, reduced motion and failure fallbacks.
6. Clear open issues for every failed or untested condition; explicitly label NOT RUN.

Source of truth: [release ledger](../verification/RELEASE_GATES.md) and [physical acceptance protocol](../verification/DEVICE_AUDIO_ACCEPTANCE.md).

## Developer quality gates

- Do not delete or weaken tests to obtain a green build.
- Keep domain logic pure; audio scheduling must be independent of React render.
- Preserve raw-text minimization during future storage/export migrations.
- A canceled or skipped CI run is not evidence of PASS.
- Record new pitfalls in GOTCHAS.md with reproducible steps and exact commit/run IDs.
