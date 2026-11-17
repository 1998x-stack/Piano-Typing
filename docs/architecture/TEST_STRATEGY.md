# Test Strategy

## 1. Test pyramid

### Unit tests

Pure domain logic:
- Physical key code mapping.
- MIDI-to-frequency conversion.
- Scale degree and octave boundaries.
- Typing accuracy and WPM definitions.
- Session event ordering and bounds.
- AudioEngine initialization, analyser samples, chord scheduling, mute, voice cap, and long replay offsets with a fake AudioContext.
- Persistence validation, retention ordering, and migration.

### Component tests

- TypingSurface ignores repeated and composing key events.
- Input remains editable when audio is unavailable.
- Mute, volume, mode, and clear controls expose correct accessible names.
- Audio failures are shown without crashing the app.
- Free Play does not display a target-based accuracy score.

### Integration tests

- Keydown -> mapper -> AudioEngine adapter.
- Session events -> replay scheduler.
- Settings -> repository -> UI hydration.
- Corrupt storage -> safe default state.

### Browser E2E

- Application loads.
- User explicitly enables sound.
- User can type, switch modes, mute, change preset, and clear.
- No keyboard capture occurs outside the focused surface.
- Core typing remains usable with audio initialization forced to fail.

## 2. Test rules

- Prefer deterministic fake clocks and fake AudioEngine adapters.
- Do not assert exact real-time audio output in jsdom.
- Do not mock domain logic in domain unit tests.
- Avoid snapshot-only tests for important behavior.
- Test IME composition and focus boundaries explicitly.
- Test storage corruption and quota errors.
- Keep fixtures small and readable.

## 3. CI release gate

Every pull request must pass:
- dependency installation,
- TypeScript typecheck,
- unit and component tests,
- production build.

Playwright Chromium E2E is part of CI and is required for the MVP release. Physical audio output, real device latency, and long-duration soak testing remain manual acceptance checks.
