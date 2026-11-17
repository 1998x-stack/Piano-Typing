import type { AudioStatus, SoundPreset } from "../../domain/types";
import { midiToFrequency } from "../../domain/music/pitch";

interface PresetConfig {
  attackSeconds: number;
  decaySeconds: number;
  sustain: number;
  peak: number;
  partials: number[];
  waveform: OscillatorType;
  durationMs: number;
}

interface ActiveVoice {
  envelope: GainNode;
  oscillators: OscillatorNode[];
  startedAt: number;
  stopAt: number;
  released: boolean;
}

export interface PlayNoteOptions {
  midi: number;
  velocity?: number;
  durationMs?: number;
}

const PRESETS: Record<SoundPreset, PresetConfig> = {
  "felt-piano": {
    attackSeconds: 0.008,
    decaySeconds: 0.18,
    sustain: 0.2,
    peak: 0.16,
    partials: [1, 0.22, 0.055],
    waveform: "sine",
    durationMs: 520
  },
  "soft-electric": {
    attackSeconds: 0.018,
    decaySeconds: 0.24,
    sustain: 0.34,
    peak: 0.13,
    partials: [1, 0.32, 0.11],
    waveform: "triangle",
    durationMs: 680
  },
  "ambient-pluck": {
    attackSeconds: 0.004,
    decaySeconds: 0.12,
    sustain: 0.08,
    peak: 0.14,
    partials: [1, 0.14, 0.025],
    waveform: "sine",
    durationMs: 420
  }
};

const MAX_VOICES = 24;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private voices: ActiveVoice[] = [];
  private preset: SoundPreset = "felt-piano";
  private volume = 0.62;
  private muted = false;
  private status: AudioStatus = "idle";

  async initializeFromUserGesture(): Promise<void> {
    if (typeof window === "undefined" || typeof window.AudioContext === "undefined") {
      this.status = "unavailable";
      throw new Error("Web Audio API is not available in this browser.");
    }

    if (!this.context) {
      const context = new window.AudioContext();
      const masterGain = context.createGain();
      const compressor = context.createDynamicsCompressor();
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;

      compressor.threshold.setValueAtTime(-18, context.currentTime);
      compressor.knee.setValueAtTime(18, context.currentTime);
      compressor.ratio.setValueAtTime(8, context.currentTime);
      compressor.attack.setValueAtTime(0.004, context.currentTime);
      compressor.release.setValueAtTime(0.18, context.currentTime);

      masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, context.currentTime);
      masterGain.connect(compressor);
      compressor.connect(analyser);
      analyser.connect(context.destination);

      this.context = context;
      this.masterGain = masterGain;
      this.analyser = analyser;
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    this.status = this.context.state === "running" ? "ready" : "suspended";
    if (this.status !== "ready") {
      throw new Error("Audio is not running. Try enabling sound again.");
    }
  }

  playNote(options: PlayNoteOptions, delayMs = 0): boolean {
    const context = this.context;
    const masterGain = this.masterGain;
    if (!context || !masterGain || context.state !== "running" || this.muted) return false;

    const preset = PRESETS[this.preset];
    const midi = clamp(options.midi, 36, 96);
    const velocity = clamp(options.velocity ?? 0.82, 0.05, 1);
    const durationMs = clamp(options.durationMs ?? preset.durationMs, 120, 1_800);
    const startAt = context.currentTime + clamp(delayMs, 0, 3_600_000) / 1_000;
    const durationSeconds = durationMs / 1_000;
    const stopAt = startAt + durationSeconds;

    this.pruneVoices(startAt);
    if (this.voices.length >= MAX_VOICES) {
      const oldestVoice = this.voices.shift();
      this.releaseVoice(oldestVoice, startAt);
    }

    const envelope = context.createGain();
    const peak = preset.peak * velocity;
    const decayAt = startAt + Math.min(preset.decaySeconds, durationSeconds * 0.55);
    envelope.gain.setValueAtTime(0.0001, startAt);
    envelope.gain.linearRampToValueAtTime(peak, startAt + preset.attackSeconds);
    envelope.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, peak * preset.sustain),
      Math.max(startAt + preset.attackSeconds + 0.01, decayAt)
    );
    envelope.gain.exponentialRampToValueAtTime(0.0001, stopAt);
    envelope.connect(masterGain);

    const frequency = midiToFrequency(midi);
    const oscillators: OscillatorNode[] = [];
    const voice: ActiveVoice = {
      envelope,
      oscillators,
      startedAt: startAt,
      stopAt,
      released: false
    };

    preset.partials.forEach((partialLevel, index) => {
      const oscillator = context.createOscillator();
      const partialGain = context.createGain();
      oscillator.type = preset.waveform;
      oscillator.frequency.setValueAtTime(frequency * (index + 1), startAt);
      partialGain.gain.setValueAtTime(partialLevel, startAt);
      oscillator.connect(partialGain);
      partialGain.connect(envelope);
      oscillator.start(startAt);
      oscillator.stop(stopAt + 0.025);
      oscillator.onended = () => {
        oscillator.disconnect();
        partialGain.disconnect();
        if (index === preset.partials.length - 1) {
          envelope.disconnect();
          this.voices = this.voices.filter((item) => item !== voice);
        }
      };
      oscillators.push(oscillator);
    });

    this.voices.push(voice);
    return true;
  }

  readWaveform(target: Uint8Array): boolean {
    if (!this.analyser || !this.context || this.context.state !== "running") return false;
    this.analyser.getByteTimeDomainData(target);
    return true;
  }

  playChord(midiNotes: number[], durationMs = 720, delayMs = 0): void {
    midiNotes.slice(0, 4).forEach((midi, index) => {
      this.playNote({ midi, velocity: 0.36, durationMs }, delayMs + index * 9);
    });
  }

  setPreset(preset: SoundPreset): void {
    this.preset = preset;
  }

  setVolume(volume: number): void {
    this.volume = clamp(volume, 0, 1);
    this.applyMasterGain();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyMasterGain();
  }

  getStatus(): AudioStatus {
    if (this.context?.state === "suspended" && this.status === "ready") {
      return "suspended";
    }
    return this.status;
  }

  getActiveVoiceCount(): number {
    return this.voices.length;
  }

  suspend(): void {
    if (this.context?.state === "running") {
      this.releaseAllVoices(this.context.currentTime);
      void this.context.suspend();
      this.status = "suspended";
    }
  }

  dispose(): void {
    const context = this.context;
    if (context) {
      this.releaseAllVoices(context.currentTime);
      void context.close();
    }
    this.context = null;
    this.masterGain = null;
    this.analyser = null;
    this.voices = [];
    this.status = "idle";
  }

  private applyMasterGain(): void {
    if (!this.context || !this.masterGain) return;
    const target = this.muted ? 0 : this.volume;
    this.masterGain.gain.setTargetAtTime(target, this.context.currentTime, 0.012);
  }

  private pruneVoices(now: number): void {
    this.voices = this.voices.filter((voice) => voice.stopAt > now || voice.released);
  }

  private releaseVoice(voice: ActiveVoice | undefined, now: number): void {
    if (!voice || voice.released) return;
    voice.released = true;
    voice.envelope.gain.cancelScheduledValues(now);
    voice.envelope.gain.setTargetAtTime(0.0001, now, 0.012);
    voice.oscillators.forEach((oscillator) => {
      try {
        oscillator.stop(now + 0.06);
      } catch {
        // Oscillator may already be scheduled to stop.
      }
    });
  }

  private releaseAllVoices(now: number): void {
    this.voices.forEach((voice) => this.releaseVoice(voice, now));
  }
}
