# Audio Engine Design

**Status:** Proposed baseline

## 1. Responsibilities

AudioEngine is a browser infrastructure service. It owns:
- AudioContext creation and resume/suspend handling.
- Master gain and mute state.
- Preset-specific timbre configuration.
- Note scheduling and voice lifecycle.
- Polyphony limit and voice stealing.
- Note synthesis for saved composition events supplied by a separate bounded PlaybackScheduler.
- Disposal and device/context error recovery.

It does not own keyboard events, text, typing metrics, or React state.

## 2. Public contract

The application should depend on a narrow interface:

- initializeFromUserGesture(): Promise<void>
- playNote(note with optional preset and velocity, delayMs?): boolean
- playChord(midiNotes, durationMs, delayMs): void
- readWaveform(target: Uint8Array): boolean
- setPreset(preset): void
- setVolume(value): void
- setMuted(muted): void
- stopAllVoices(): void
- getStatus(): AudioStatus
- dispose(): void

The production implementation uses Web Audio API. Tests use a fake implementation. Raw AudioNodes never leave the infrastructure module. The UI requests waveform samples through a caller-provided Uint8Array buffer.

## 3. Audio graph

AudioContext destination  
← AnalyserNode  
← gentle DynamicsCompressorNode  
← master GainNode

Each voice:
- Fundamental oscillator.
- One or two quiet harmonic oscillators for timbral character.
- Per-voice envelope GainNode.
- Per-voice low-pass BiquadFilterNode with cutoff modulated by velocity.
- All partials feed the per-voice envelope, then master gain.

Word boundaries schedule a restrained bass pulse from the current chord root. Phrase-ending punctuation schedules a chord from a deterministic progression. Accompaniment events are separate from key pitches and must not remap physical keys. The initial instrument is synthesized, not sampled. This avoids shipping unlicensed recordings and keeps the first build self-contained. It is a piano-inspired synth, not a claim of acoustic-piano realism.

## 4. Note scheduling

- Schedule against AudioContext.currentTime, never with setTimeout as the audio clock. Replay is streamed by a 25ms timer into a 160ms lookahead window, then note onsets are scheduled against AudioContext.currentTime. This bounds the number of future oscillator allocations rather than scheduling all 2,000 events immediately.
- UI event time uses performance.now() or a session-relative monotonic clock.
- Convert MIDI pitch to frequency using A4 = 440 Hz and equal temperament.
- Use short attack, exponential decay, and a quiet release to avoid clicks.
- Clamp velocity, note duration, and frequency to safe ranges.
- Never create unbounded voices. Enforce a fixed polyphony limit and release the oldest active voice when necessary.
- Rapid note events must not allocate React state or trigger layout work before scheduling.

## 5. Presets

Felt Piano:
- Rounded transient, moderate upper harmonics, short-to-medium decay.
- Default preset; restrained volume.

Soft Electric:
- Smoother attack and softer high harmonics.
- Slightly longer sustain.

Ambient Pluck:
- Faster attack, shorter decay, gentle modulation if supported.
- Low-density ambience; no continuous drone by default.

Preset configuration must be data, not conditional logic spread across components.

## 6. Lifecycle and browser policy

- AudioContext MUST be created or resumed from a user gesture.
- The app should provide a clear Enable Sound action.
- If the browser suspends the context, the next explicit user action may attempt resume.
- On page visibility loss, stop or release active voices and suspend expensive ambience.
- On unmount, stop voices, disconnect nodes, and close the context where appropriate.
- If AudioContext is unavailable, show a clear status and keep typing functional.
- Do not request microphone permission.

## 7. Volume and clipping

- Master volume is clamped to [0, 1], with a conservative default.
- Mute is implemented at master gain; it must not stop typing metrics or event capture.
- Use compressor/limiter-like protection and conservative voice gain.
- Summed polyphony must not exceed safe headroom.
- No audio asset may be added without a documented license and redistribution permission.

## 8. Latency measurement

AudioContext.baseLatency is informative but not end-to-end latency. The project must distinguish:
- Event-to-schedule application overhead.
- Browser render quantum and output buffering.
- Operating-system/device output latency.
- Physical acoustic output latency.

Use the bounded SchedulingTelemetry P50/P95 values for JavaScript scheduling overhead. Use a loopback or microphone measurement on a reference device for audible latency. Do not claim the 50 ms target is met based on JS telemetry or baseLatency. The wired-reference two-channel measurement protocol is at docs/verification/DEVICE_AUDIO_ACCEPTANCE.md.

## 9. Failure modes

| Failure | Expected behavior |
|---|---|
| AudioContext missing | disable sound controls, preserve typing |
| resume rejected | show Enable Sound retry |
| context suspended | attempt resume on next user gesture |
| voice limit reached | steal/release oldest voice safely |
| tab hidden | release voices and suspend ambience |
| output device lost | keep app alive and surface recoverable status |
| dispose called twice | no-op; never throw |
