import React, { useEffect, useRef } from 'react';
import { WaveformProps } from '@/types/miniGame';

interface WaveformVisualizerProps {
  target: WaveformProps;
  current: WaveformProps;
  width: number;
  height: number;
  onMatch?: (accuracy: number) => void;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  target,
  current,
  width,
  height,
  onMatch,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawWaveform = (
    ctx: CanvasRenderingContext2D,
    props: WaveformProps,
    color: string,
    isTarget: boolean
  ) => {
    const { type, frequency, amplitude, phase } = props;
    const centerY = height / 2;
    const points: { x: number; y: number }[] = [];

    // Generate points based on waveform type
    for (let x = 0; x < width; x += 2) {
      let y = centerY;
      const normalizedX = (x / width) * Math.PI * 2 * frequency + phase;

      switch (type) {
        case 'sine':
          y = centerY + Math.sin(normalizedX) * amplitude * (height / 4);
          break;
        case 'square':
          y = centerY + (Math.sin(normalizedX) > 0 ? 1 : -1) * amplitude * (height / 4);
          break;
        case 'triangle':
          y = centerY + (Math.abs((normalizedX % (Math.PI * 2)) - Math.PI) / Math.PI) * amplitude * (height / 4);
          break;
        default:
          y = centerY;
      }

      points.push({ x, y });
    }

    // Draw the waveform
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.stroke();

    // Calculate match accuracy if both waveforms are drawn
    if (isTarget && onMatch) {
      const accuracy = calculateMatchAccuracy(points, target, current);
      onMatch(accuracy);
    }
  };

  const calculateMatchAccuracy = (
    points: { x: number; y: number }[],
    target: WaveformProps,
    current: WaveformProps
  ): number => {
    let totalDiff = 0;
    const maxDiff = height;

    for (let x = 0; x < width; x += 2) {
      const normalizedX = (x / width) * Math.PI * 2;
      const targetY = calculateY(normalizedX, target);
      const currentY = calculateY(normalizedX, current);
      totalDiff += Math.abs(targetY - currentY);
    }

    const averageDiff = totalDiff / (width / 2);
    const accuracy = Math.max(0, 100 - (averageDiff / maxDiff) * 100);
    return Math.round(accuracy);
  };

  const calculateY = (x: number, props: WaveformProps): number => {
    const { type, frequency, amplitude, phase } = props;
    const normalizedX = x * frequency + phase;
    const centerY = height / 2;

    switch (type) {
      case 'sine':
        return centerY + Math.sin(normalizedX) * amplitude * (height / 4);
      case 'square':
        return centerY + (Math.sin(normalizedX) > 0 ? 1 : -1) * amplitude * (height / 4);
      case 'triangle':
        return centerY + (Math.abs((normalizedX % (Math.PI * 2)) - Math.PI) / Math.PI) * amplitude * (height / 4);
      default:
        return centerY;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw target waveform
    drawWaveform(ctx, target, '#4CAF50', false);

    // Draw current waveform
    drawWaveform(ctx, current, '#2196F3', true);
  }, [target, current, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: '#f5f5f5',
      }}
    />
  );
}; 