# Physical Device Audio & Input Acceptance

**Status: NOT RUN — requires a real keyboard, audio output and reference devices.**  
**Owner:** Release verification  
**Applies to:** MVP candidate derived from PR #1.

Automated CI verifies domain behavior, browser input and the Web Audio graph. It **cannot** establish key-contact-to-audible-output latency, listening quality, clipping, or OS/hardware compatibility. Do not publish PASS results for this document without independently collected measurements.

## 1. Test environments

Record at least:
- A Windows 11 desktop with wired headphones and a physical QWERTY keyboard.
- macOS with a wired output device and a physical keyboard.
- Chrome (latest stable), Firefox (latest stable), and Safari (latest stable on macOS).
- Bluetooth audio as a separately reported, non-gating comparison.
- Chinese Pinyin IME, English input, and one non-QWERTY software layout (AZERTY or Dvorak).

For each environment capture OS build, browser version, audio interface, sample rate, output buffer, keyboard model/layout, display refresh, commit SHA, and whether CPU throttling/battery saving was enabled.

## 2. Latency measurement protocol

### Required instrumentation

Preferred arrangement: a physical key-actuation contact sensor (or a calibrated logic signal from a mechanical actuator) and a microphone/line-in monitoring the speaker/headphone output, both recorded on the **same clock** with two channels of an audio interface or oscilloscope.

- Channel A: electrical key-contact timestamp.
- Channel B: acoustic/line-output onset timestamp.
- Use a recorded impulse or threshold algorithm checked manually for false detections.
- Repeat 200 isolated notes per browser/device combination at normal typing speeds, including 3 rapid-burst sequences.
- Report median (P50), P95, minimum, maximum, sample count, and any missed notes. Preserve raw WAV/CSV and analysis code.

Measurements that start at JavaScript keydown are **application-level** timings, not full physical audible latency. They can be reported separately, but may not replace the full protocol.

### Initial target gate

- Physical key-contact → audible note onset: P50 ≤ 50 ms; P95 ≤ 80 ms with wired reference output.
- Main-thread keydown → note scheduled overhead: P95 < 10 ms for a 200-note test, using the built-in JS diagnostic as an indicator.
- Note drops in the 200-note isolated test: 0.
- Report environment and methodology with every number. Targets are hypotheses pending physical validation, not guarantees.

Do not apply wired-reference targets to Bluetooth output without an explicit separate budget.

## 3. Ten-minute soak test

1. Open the product after clearing stale app data in a clean browser profile. Enable sound via the user gesture.
2. Type continuously for 10 minutes at variable rates of approximately 2–12 keys/sec; include punctuation, space, text corrections and occasional pauses.
3. Change each timbre at least twice, adjust volume, mute/unmute rapidly, switch between typing modes, and perform a short saved-composition replay.
4. Exercise 2000 captured-note limit; ensure text input remains usable after the recording cap.
5. Check for voice leaks, stuck or hanging notes, crashes, audible clicks, clipping, unhandled promise rejections, and significant memory growth after idle cleanup.
6. Hide/restore the browser tab and repeat. Verify clear and stop controls.
7. Capture performance profiles, tab memory before/after, audio device settings, screenshots and a short listening recording.

**PASS only when** no dropped text, no unrecoverable audio exceptions, no sustained stuck notes, no audible clipping at reference volume, and no unexplained unbounded memory growth are observed.

## 4. Physical keyboard / IME test matrix

| Case | Expected behavior |
|---|---|
| QWERTY, physical mapping | Identical KeyboardEvent.code maps to same note regardless of produced letter |
| AZERTY/Dvorak, character mapping | Identical typed character maps to same pitch, independent of code |
| Chinese Pinyin IME | Intermediate composition keydowns do not trigger notes; each committed character gets one melodic event |
| Chinese punctuation 。！？、， | Punctuation drives phrase accents; no double triggering |
| Backspace/Delete | Native correction works; no accidental musical character event |
| Ctrl/Cmd shortcuts | Browser/editor shortcuts remain usable and do not trigger notes |
| Rapid modifier changes | No stuck notes or duplicate IME commitment |
| Screen reader & reduced motion | Accessible controls, readable status, motion preference honored |

Browser-driven synthetic tests cover subsets of this matrix. The physical matrix remains **NOT RUN** until tested with the specified devices.

## 5. Evidence template

Create a versioned record at docs/verification/runs/YYYY-MM-DD-DEVICE.md:

- Commit SHA and environment identifiers
- Test operator and instrument model
- Raw CSV/WAV paths (do not commit sensitive recordings or huge binary files)
- Sample count, P50/P95, missed note count
- Ten-minute soak steps executed and observations
- Keyboard/IME matrix pass/fail
- Failures, reproduction steps, screenshots/logs
- Explicit PASS / FAIL / NOT RUN for each gate

A GitHub CI green check is insufficient to mark physical audio acceptance PASS.
