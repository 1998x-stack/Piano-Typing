# Piano Typing

**Turn every keystroke into a note.**

Piano Typing is a calm, browser-based keyboard-to-music experience. Type naturally, hear immediate musical feedback, and turn ordinary text input into a composition you can replay.

## Product boundary

Piano Typing is the free-play and typing-practice product. It prioritizes:
- Immediate, low-latency sound for valid keyboard input.
- Stable physical-key-to-pitch mapping and harmony-aware accompaniment.
- Natural text input, correction, and keyboard-layout support.
- Personal compositions and measurable typing improvement.

It is not a reaction-time game and does not attempt to teach English vocabulary. Language-learning workflows belong to the separate [Word Orchestra](https://github.com/1998x-stack/Word-Orchestra) product.

## Current implementation

The repository now contains the engineering architecture and the first web application vertical slice:
- React + TypeScript + Vite.
- Web Audio API synthesis with three timbre presets.
- Stable pentatonic key-to-pitch mapping, word-boundary bass pulses, and punctuation-triggered chord accents.
- Free Play and Typing Flow modes.
- Collapsible on-screen keyboard with last-key feedback.
- Live AnalyserNode waveform visualization when sound is enabled.
- Session metrics and local composition storage.
- Unit, component, and Playwright Chromium browser tests.

The current synthesized instruments are piano-inspired electronic timbres, not acoustic piano sample libraries.

## Quick start

Requirements: Node.js 22 or later and npm.

    npm install
    npm run dev

Validation:

    npm run typecheck
    npm test
    npm run test:e2e
    npm run build

## Architecture

Read [the engineering architecture index](docs/architecture/README.md), then:
- [System architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)
- [Audio engine](docs/architecture/AUDIO_ENGINE.md)
- [Data model](docs/architecture/DATA_MODEL.md)
- [Privacy baseline](docs/architecture/SECURITY_AND_PRIVACY.md)
- [Implementation plan](docs/architecture/IMPLEMENTATION_PLAN.md)
- [Test strategy](docs/architecture/TEST_STRATEGY.md)
- [Engineering gotchas](docs/architecture/GOTCHAS.md)

The product-level requirements remain in [the product design specification](docs/Piano-Typing-Product-Design.md).

## Privacy

The first release is local-first. Keyboard events are handled only while the in-app typing area is focused. Saved compositions contain note-event metadata and do not include the original text. No account, analytics service, or backend is required.

## Status

Architecture baseline and first implementation vertical slice. The next gates are CI verification, local browser soak testing, and hardening of audio lifecycle, persistence, and IME behavior.

## License

To be decided before distributing code or bundled audio assets.
