import { useEffect, useRef } from "react";
import type { AudioEngine } from "../infrastructure/audio/AudioEngine";

interface AudioVisualizerProps {
  engine: AudioEngine;
  reducedMotion: boolean;
}

export default function AudioVisualizer({ engine, reducedMotion }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const samples = new Uint8Array(128);
    const prefersReducedMotion = reducedMotion || (
      typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
    let frameId = 0;

    const draw = () => {
      engine.readWaveform(samples);
      const width = canvas.width;
      const height = canvas.height;
      context.clearRect(0, 0, width, height);
      context.beginPath();

      samples.forEach((sample, index) => {
        const x = (index / (samples.length - 1)) * width;
        const normalized = (sample - 128) / 128;
        const y = height / 2 + normalized * height * 0.42;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });

      context.strokeStyle = "#54786d";
      context.lineWidth = 2;
      context.lineJoin = "round";
      context.stroke();
      if (!prefersReducedMotion) frameId = window.requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (frameId !== 0) window.cancelAnimationFrame(frameId);
    };
  }, [engine, reducedMotion]);

  return (
    <section className="audio-visualizer" aria-label="Live audio waveform">
      <div className="visualizer-heading">
        <span className="section-kicker">LIVE SOUND</span>
        <span className="visualizer-status"><span /> AUDIO WAVEFORM</span>
      </div>
      <canvas
        ref={canvasRef}
        className="waveform-canvas"
        width={640}
        height={88}
        role="img"
        aria-label="Live audio waveform visualization"
      />
    </section>
  );
}
