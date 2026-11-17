# Piano Typing

**Turn every keystroke into a note.**

Piano Typing is a keyboard-to-music experience: type naturally, hear immediate musical feedback, and turn ordinary text input into a playable composition.

## Product boundary

Piano Typing is the free-play and typing-practice product. It prioritizes:
- Immediate, low-latency sound for valid keyboard input.
- Stable key-to-pitch mapping and harmony-aware accompaniment.
- Natural text input, correction, and keyboard-layout support.
- Personal compositions and measurable typing improvement.

It is **not** a reaction-time game and does not attempt to teach English vocabulary. Language-learning workflows belong to the separate [Word Orchestra](https://github.com/1998x-stack/Word-Orchestra) product.

## Product design documents

- [Product design — Word](docs/Piano-Typing-Product-Design.docx)
- [Product design — PDF](docs/Piano-Typing-Product-Design.pdf)

The specification covers product strategy, user experience, sound and composition engine, input handling, metrics, privacy, MVP acceptance criteria, experiments, and phased roadmap.

## Status

Product specification bootstrap. The repository was empty at initialization; implementation status and test evidence will be added as engineering work begins.

## Design principles

1. Real typing over artificial reaction challenges.
2. Music as positive feedback, never punishment.
3. Stable and understandable key-to-note mapping.
4. User control over sound, motion, pacing, and saved text.
5. Progress measured by typing quality and voluntary practice—not streak pressure.

## License

To be decided before distributing code or bundled audio assets.