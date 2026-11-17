import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AudioEngine } from "./AudioEngine";

class FakeAudioParam {
  setValueAtTime(_value: number, _time: number): void {}
  linearRampToValueAtTime(_value: number, _time: number): void {}
  exponentialRampToValueAtTime(_value: number, _time: number): void {}
  setTargetAtTime(_value: number, _time: number, _constant: number): void {}
  cancelScheduledValues(_time: number): void {}
}

class FakeNode {
  connect(_destination: unknown): void {}
  disconnect(): void {}
}

class FakeGainNode extends FakeNode {
  gain = new FakeAudioParam();
}

class FakeCompressorNode extends FakeNode {
  threshold = new FakeAudioParam();
  knee = new FakeAudioParam();
  ratio = new FakeAudioParam();
  attack = new FakeAudioParam();
  release = new FakeAudioParam();
}

class FakeAnalyserNode extends FakeNode {
  fftSize = 0;
  smoothingTimeConstant = 0;
  getByteTimeDomainData(array: Uint8Array): void { array.fill(128); }
}

class FakeOscillatorNode extends FakeNode {
  static startTimes: number[] = [];
  frequency = new FakeAudioParam();
  type: OscillatorType = "sine";
  onended: (() => void) | null = null;
  start(when = 0): void { FakeOscillatorNode.startTimes.push(when); }
  stop(_when?: number): void {}
}

class FakeAudioContext {
  state: AudioContextState = "suspended";
  currentTime = 1;
  destination = new FakeNode();

  createGain(): GainNode {
    return new FakeGainNode() as unknown as GainNode;
  }

  createDynamicsCompressor(): DynamicsCompressorNode {
    return new FakeCompressorNode() as unknown as DynamicsCompressorNode;
  }

  createAnalyser(): AnalyserNode {
    return new FakeAnalyserNode() as unknown as AnalyserNode;
  }

  createOscillator(): OscillatorNode {
    return new FakeOscillatorNode() as unknown as OscillatorNode;
  }

  async resume(): Promise<void> {
    this.state = "running";
  }

  async suspend(): Promise<void> {
    this.state = "suspended";
  }

  async close(): Promise<void> {
    this.state = "closed";
  }
}

const originalAudioContext = window.AudioContext;

beforeEach(() => {
  FakeOscillatorNode.startTimes = [];
  Object.defineProperty(window, "AudioContext", {
    configurable: true,
    writable: true,
    value: FakeAudioContext as unknown as typeof AudioContext
  });
});

afterEach(() => {
  Object.defineProperty(window, "AudioContext", {
    configurable: true,
    writable: true,
    value: originalAudioContext
  });
});

describe("AudioEngine", () => {
  it("requires explicit initialization before scheduling notes", async () => {
    const engine = new AudioEngine();
    expect(engine.playNote({ midi: 60 })).toBe(false);

    await engine.initializeFromUserGesture();

    expect(engine.getStatus()).toBe("ready");
    expect(engine.playNote({ midi: 60 })).toBe(true);
    expect(engine.getActiveVoiceCount()).toBe(1);
    engine.dispose();
  });

  it("provides waveform samples without exposing AudioNodes", async () => {
    const engine = new AudioEngine();
    const samples = new Uint8Array(16);
    expect(engine.readWaveform(samples)).toBe(false);
    await engine.initializeFromUserGesture();
    expect(engine.readWaveform(samples)).toBe(true);
    expect(Array.from(samples).every((sample) => sample === 128)).toBe(true);
    engine.dispose();
    expect(engine.readWaveform(samples)).toBe(false);
  });

  it("schedules chord tones through the same bounded voice path", async () => {
    const engine = new AudioEngine();
    await engine.initializeFromUserGesture();

    engine.playChord([48, 55, 60, 64], 800);

    expect(engine.getActiveVoiceCount()).toBe(4);
    engine.dispose();
  });

  it("enforces the polyphony limit when notes arrive rapidly", async () => {
    const engine = new AudioEngine();
    await engine.initializeFromUserGesture();

    for (let index = 0; index < 40; index += 1) {
      engine.playNote({ midi: 60 + (index % 12) });
    }

    expect(engine.getActiveVoiceCount()).toBe(24);
    engine.dispose();
    expect(engine.getActiveVoiceCount()).toBe(0);
  });

  it("supports replay offsets longer than one minute", async () => {
    const engine = new AudioEngine();
    await engine.initializeFromUserGesture();
    engine.playNote({ midi: 60 }, 120_000);
    expect(FakeOscillatorNode.startTimes[0]).toBe(121);
    engine.dispose();
  });

  it("does not schedule voices while muted", async () => {
    const engine = new AudioEngine();
    await engine.initializeFromUserGesture();
    engine.setMuted(true);

    expect(engine.playNote({ midi: 60 })).toBe(false);
    expect(engine.getActiveVoiceCount()).toBe(0);
    engine.dispose();
  });
});
