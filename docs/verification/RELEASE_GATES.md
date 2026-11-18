# Release Gate Ledger

Status meanings: **PASS** verified by a recorded run; **NOT RUN** no evidence; **BLOCKED** not yet measurable; **FAIL** measured failure.

| Gate | Current evidence | Status |
|---|---|---|
| Node.js 22 deterministic installation | Committed package-lock.json + npm ci in CI | Verify latest CI |
| TypeScript strict check | GitHub Actions CI | Verify latest CI |
| Domain and component regression | Vitest | Verify latest CI |
| Chromium typing, IME, custom mapping, composition migration | Playwright | Verify latest CI |
| Browser production bundle | Vite build in CI | Verify latest CI |
| Physical audible latency P50/P95 | Physical two-channel instrumentation required | NOT RUN |
| 10-minute real-device soak | Physical reference device required | NOT RUN |
| Non-QWERTY physical layout/IME matrix | Physical keyboard/software layout matrix | NOT RUN |
| Safari & Firefox cross-browser | Browser E2E matrix not yet provisioned | NOT RUN |
| Acoustic sound-quality listening and clipping | Listening panel / reference recordings required | NOT RUN |

Do not claim a production release until P0 physical gates pass or documented acceptance criteria are explicitly revised with evidence.
