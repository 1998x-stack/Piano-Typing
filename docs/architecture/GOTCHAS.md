# Engineering Gotchas

This file is a durable handoff log for verified issues and important implementation constraints.

## Known constraints

1. Web Audio autoplay policy: AudioContext may start suspended. Initialize or resume only from a user gesture and show a retry action.
2. AudioContext.baseLatency is not end-to-end audible latency. Physical output buffering and device latency remain outside that value.
3. KeyboardEvent.code represents physical key position; KeyboardEvent.key represents the produced character. Keep both concepts separate for non-QWERTY layouts.
4. IME composition must not be interpreted as ordinary printable key presses. Check isComposing and legacy keyCode 229 where available.
5. Browser keyboard events do not expose actual key pressure. Do not present a synthetic velocity proxy as measured pressure.
6. A React state update per key may introduce rendering work into a latency-sensitive interaction. Keep audio scheduling outside React state and batch visual updates.
7. localStorage can throw because of quota, privacy settings, or browser policy. Storage failure must not block typing.
8. Do not store raw typed text in saved compositions unless the user explicitly opts in.
9. Bluetooth audio output may exceed the latency budget even when application scheduling is efficient.
10. Generated or bundled instrument samples require explicit redistribution rights. The first implementation should use synthesis until licensing is reviewed.
11. Keep the audio compressor as a local graph node; do not retain unused AudioNode fields merely to document the graph. The strict TypeScript configuration treats unused private fields as build failures.
12. A package lock was initially absent. It was resolved and committed by a one-time GitHub Actions job on 2026-11-18; CI now uses npm ci. Never handcraft lockfile hashes.
13. Vitest does not expose afterEach globally by default in this configuration. Import afterEach and call Testing Library cleanup explicitly, otherwise mounted React trees leak between tests and produce false duplicate-element failures.
14. jsdom/user-event may not emit the same physical KeyboardEvent.code as a real keyboard for punctuation. Test physical-code mapping directly in domain tests; use browser E2E for end-to-end punctuation behavior.
15. GitHub ubuntu-latest moved to Ubuntu 26.04 while the pinned Playwright 1.52 browser installer does not support that image. Pin browser E2E to ubuntu-24.04 until the Playwright version is deliberately upgraded and verified.
16. Keep PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 during npm install and install Chromium in an explicit CI step. This separates dependency installation from browser provisioning and makes the supported browser/runtime pair visible.
17. readCompositions returns newest-first for the UI, while the serialized history is stored oldest-first. Reverse the read result before appending a new composition; otherwise retention trimming can evict recent work instead of old work.
18. Composition replay offsets can exceed one minute. Do not clamp scheduled note offsets to 60 seconds; the current bounded scheduler accepts up to one hour, while product session limits remain separately enforced.
19. Session duration must exclude paused intervals. Use a monotonic clock and accumulate pause duration; wall-clock time between session start and save is not active play time.
20. Replaying a saved composition must use its stored sound preset for the scheduled events, then restore the user's current preset for subsequent live typing.
21. Keep the AnalyserNode inside AudioEngine. UI components should request samples into a reusable Uint8Array rather than receive or manipulate AudioNodes.
22. In native IMEs, keydown events during composition are not reliable text events. Suppress interim keydowns and map final Unicode code points on compositionend. Physical browser/IME parity is not established by synthetic CI.
23. Directly scheduling every event in a multi-minute composition creates too many oscillator nodes and can break polyphony. Use a bounded lookahead scheduler, preserve original preset per event, and provide a stop control.
24. IndexedDB schema migrations must commit before deleting legacy localStorage data; allowlisted normalization must drop unknown properties, particularly raw source text.
25. Synthetic typing velocity is an accent proxy from timing, not measured mechanical key force. Different audio devices have radically different audible latency.
26. Code coverage, fake AudioContext tests and browser UI E2E do not establish physical key-contact-to-sound latency or acoustic clipping. Those release gates remain NOT RUN.
27. Playwright locator exact accessible names should not rely on nested labels whose select option text can be folded into the accessible name. Give key select controls explicit aria-label attributes.
28. Playwright dispatchEvent with a generic event initializer does not necessarily create a native CompositionEvent with a data property; use new CompositionEvent in page.evaluate for IME E2E tests.
29. Imported note events must allow only known physical KeyboardEvent.code names or reserved IME/Harmony markers. Otherwise arbitrary strings could be smuggled into composition metadata despite the no-source-text design.
30. Do not accept non-finite, out-of-bounds note timing or invalid custom-scale metadata in versioned composition imports.

## Verification log

| Date | Area | Evidence | Status |
|---|---|---|---|
| 2026-11-17 | Initial architecture | Repository inspected; no application code or test suite present | BASELINE |
| 2026-11-17 | First CI run | Run 44094939933 failed at TypeScript check: unused private AudioEngine.compressor field; tests/build were skipped | FIX REQUIRED |
| 2026-11-17 | Second CI run | Run 44095159008 repeated the same unused-field failure | FIX REQUIRED |
| 2026-11-17 | Third CI run | Run 44095423416 passed typecheck; component tests exposed missing Testing Library cleanup between tests | FIXED |
| 2026-11-17 | Fourth CI run | Run 44095595793 failed again at typecheck because the compressor field was still present in the committed AudioEngine source | FIXED IN FOLLOW-UP |
| 2026-11-17 | Architecture baseline validation | Run 44096038103 passed TypeScript typecheck, unit/component tests, and production build on commit 275a39c | PASS |
| 2026-11-17 | Harmony integration test | Run 44096989333 exposed a test assumption: jsdom did not supply a mapped physical code for the period key; the punctuation-triggered chord was present. The assertion now checks the chord note count, and physical punctuation mapping has a direct unit test | FIXED |
| 2026-11-17 | Current validation | Run 44097213919 passed TypeScript typecheck, 24 unit/component tests, and production build on commit 685a925 | PASS |
| 2026-11-17 | Browser E2E environment | Run 44097756646 passed typecheck and 24 unit/component tests; Playwright browser installation failed because ubuntu-latest resolved to unsupported Ubuntu 26.04 for Playwright 1.52 | FIXED BY PINNING UBUNTU 24.04 |
| 2026-11-17 | Full CI + browser E2E | Run 44098628154 passed typecheck, 26 unit/component tests, Playwright Chromium install, 5 browser E2E tests, and production build on commit 0f202e1 | PASS |
| 2026-11-17 | Composition retention | Added a 21-composition regression test to prove that only the newest 20 are retained and reads remain newest-first | PASS |
| 2026-11-17 | Current full validation | Run 44099124926 passed typecheck, 27 unit/component tests, Playwright Chromium install, 5 browser E2E tests, and production build on commit d065a52 | PASS |
| 2026-11-17 | Audio and session hardening | Added fake-AudioContext tests for initialization, chord scheduling, mute, polyphony, and long replay offsets; added pause/resume session coverage | PASS |
| 2026-11-17 | Latest full CI | Run 44102221767 passed typecheck, 34 unit/component tests, Playwright Chromium install, 5 browser E2E tests, and production build on commit 5600cf4 | PASS |
| 2026-11-18 | Extended browser E2E | CI run 44235869055: TypeScript and unit tests PASS, Chromium 7/9 PASS; two failures were exact Scale locator and generic rather than native CompositionEvent test data | FIXED |
| 2026-11-18 | Expanded CI validation | Run 44236304259: npm ci, strict typecheck, 56/56 unit/component tests, 9/9 Chromium E2E tests, production build | PASS |
