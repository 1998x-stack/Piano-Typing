# Release Gate Ledger

Status meanings: **PASS** verified by a recorded run; **NOT RUN** no evidence; **BLOCKED** not yet measurable; **FAIL** measured failure.

| Gate | Current evidence | Status |
|---|---|---|
| Node.js 22 deterministic installation | Committed package-lock.json + npm ci — run 44236304259 | PASS |
| TypeScript strict check | Run 44236304259 | PASS |
| Domain and component regression | Run 44236304259: 56/56 tests | PASS |
| Chromium typing, IME, custom mapping, MIDI, and composition migration | Run 44236304259: 9/9 browser tests | PASS |
| Browser production bundle | Run 44236304259 | PASS |
| Physical audible latency P50/P95 | Physical two-channel instrumentation required | NOT RUN |
| 10-minute real-device soak | Physical reference device required | NOT RUN |
| Non-QWERTY physical layout/IME matrix | Physical keyboard/software layout matrix | NOT RUN |
| Safari & Firefox cross-browser | Browser E2E matrix not yet provisioned | NOT RUN |
| Acoustic sound-quality listening and clipping | Listening panel / reference recordings required | NOT RUN |

Do not claim a production release until P0 physical gates pass or documented acceptance criteria are explicitly revised with evidence.
