import React, { useEffect, useRef } from 'react';
import { EQBand } from '@/types/miniGame';

interface EQVisualizerProps {
  bands: EQBand[];
  width: number;
  height: number;
  showTarget?: boolean;
  targetBands?: EQBand[];
  className?: string;
}

export const EQVisualizer: React.FC<EQVisualizerProps> = ({
  bands,
  width,
  height,
  showTarget = false,
  targetBands = [],
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const calculateFrequencyResponse = (
    frequency: number,
    bands: EQBand[]
  ): number => {
    let response = 0;

    bands.forEach(band => {
      if (!band.enabled) return;

      const { type, frequency: f0, gain, q } = band;
      const f = frequency;
      const w0 = 2 * Math.PI * f0;
      const w = 2 * Math.PI * f;
      const alpha = Math.sin(w0) / (2 * q);

      let peakResponse: number;
      let notchResponse: number;
      let lowShelfResponse: number;
      let highShelfResponse: number;

      switch (type) {
        case 'peak':
          peakResponse =
            gain /
            Math.sqrt(
              Math.pow(1 - Math.pow(w / w0, 2), 2) +
                Math.pow(2 * alpha * (w / w0), 2)
            );
          response += peakResponse;
          break;

        case 'notch':
          notchResponse =
            gain *
            Math.sqrt(
              Math.pow(1 - Math.pow(w / w0, 2), 2) +
                Math.pow(2 * alpha * (w / w0), 2)
            );
          response += notchResponse;
          break;

        case 'lowShelf':
          lowShelfResponse =
            gain *
            (1 +
              (w / w0) /
                Math.sqrt(1 + Math.pow(w / w0, 2)) *
                Math.sqrt(1 + Math.pow(w / w0, 2)));
          response += lowShelfResponse;
          break;

        case 'highShelf':
          highShelfResponse =
            gain *
            (1 +
              (w0 / w) /
                Math.sqrt(1 + Math.pow(w0 / w, 2)) *
                Math.sqrt(1 + Math.pow(w0 / w, 2)));
          response += highShelfResponse;
          break;
      }
    });

    return response;
  };

  const drawFrequencyResponse = (
    ctx: CanvasRenderingContext2D,
    bands: EQBand[],
    color: string,
    isTarget: boolean
  ) => {
    const points: { x: number; y: number }[] = [];
    const minFreq = 20;
    const maxFreq = 20000;
    const centerY = height / 2;

    // Generate points using logarithmic scale for frequency
    for (let x = 0; x < width; x++) {
      const normalizedX = x / width;
      const frequency = minFreq * Math.pow(maxFreq / minFreq, normalizedX);
      const response = calculateFrequencyResponse(frequency, bands);
      const y = centerY - (response * height) / 24; // Scale to fit in view

      points.push({ x, y });
    }

    // Draw the frequency response
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = isTarget ? 2 : 1;
    ctx.setLineDash(isTarget ? [5, 5] : []);
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawFrequencyLabels = (ctx: CanvasRenderingContext2D) => {
    const frequencies = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    const minFreq = 20;
    const maxFreq = 20000;

    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';

    frequencies.forEach(freq => {
      const x =
        (Math.log(freq) - Math.log(minFreq)) /
        (Math.log(maxFreq) - Math.log(minFreq)) *
        width;
      ctx.fillText(freq.toString(), x, height - 5);
    });
  };

  const drawGainLabels = (ctx: CanvasRenderingContext2D) => {
    const gains = [-12, -6, 0, 6, 12];
    const centerY = height / 2;

    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';

    gains.forEach(gain => {
      const y = centerY - (gain * height) / 24;
      ctx.fillText(gain.toString(), 30, y + 3);
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 0.5;

    // Horizontal lines
    for (let y = 0; y < height; y += height / 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical lines
    const frequencies = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    const minFreq = 20;
    const maxFreq = 20000;

    frequencies.forEach(freq => {
      const x =
        (Math.log(freq) - Math.log(minFreq)) /
        (Math.log(maxFreq) - Math.log(minFreq)) *
        width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    });

    // Draw frequency response
    drawFrequencyResponse(ctx, bands, '#2196F3', false);
    if (showTarget && targetBands.length > 0) {
      drawFrequencyResponse(ctx, targetBands, '#4CAF50', true);
    }

    // Draw labels
    drawFrequencyLabels(ctx);
    drawGainLabels(ctx);
  }, [bands, targetBands, width, height, showTarget]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: '#fff',
      }}
    />
  );
}; 