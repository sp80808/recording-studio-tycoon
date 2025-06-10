import React, { useEffect, useRef } from 'react';
import { WaveformLayer } from '@/types/miniGame';

interface ComplexWaveformVisualizerProps {
  layers: WaveformLayer[];
  width: number;
  height: number;
  showTarget?: boolean;
  targetLayers?: WaveformLayer[];
  onMatch?: (accuracy: number) => void;
}

export const ComplexWaveformVisualizer: React.FC<ComplexWaveformVisualizerProps> = ({
  layers,
  width,
  height,
  showTarget = false,
  targetLayers = [],
  onMatch,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawWaveform = (
    ctx: CanvasRenderingContext2D,
    layer: WaveformLayer,
    color: string,
    isTarget: boolean
  ) => {
    const { type, frequency, amplitude, phase } = layer;
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
    ctx.lineWidth = isTarget ? 2 : 1;
    ctx.setLineDash(isTarget ? [5, 5] : []);
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawCombinedWaveform = (
    ctx: CanvasRenderingContext2D,
    layers: WaveformLayer[],
    color: string,
    isTarget: boolean
  ) => {
    const centerY = height / 2;
    const points: { x: number; y: number }[] = [];

    // Generate combined points
    for (let x = 0; x < width; x += 2) {
      let y = centerY;
      const normalizedX = (x / width) * Math.PI * 2;

      layers.forEach(layer => {
        if (!layer.enabled) return;

        const { type, frequency, amplitude, phase } = layer;
        const layerX = normalizedX * frequency + phase;

        switch (type) {
          case 'sine':
            y += Math.sin(layerX) * amplitude * (height / 4);
            break;
          case 'square':
            y += (Math.sin(layerX) > 0 ? 1 : -1) * amplitude * (height / 4);
            break;
          case 'triangle':
            y += (Math.abs((layerX % (Math.PI * 2)) - Math.PI) / Math.PI) * amplitude * (height / 4);
            break;
        }
      });

      points.push({ x, y });
    }

    // Draw the combined waveform
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = isTarget ? 3 : 2;
    ctx.setLineDash(isTarget ? [5, 5] : []);
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.stroke();
    ctx.setLineDash([]);
  };

  const calculateMatchAccuracy = (
    currentLayers: WaveformLayer[],
    targetLayers: WaveformLayer[]
  ): number => {
    let totalAccuracy = 0;
    let validLayers = 0;

    targetLayers.forEach(targetLayer => {
      const matchingLayer = currentLayers.find(
        layer => layer.type === targetLayer.type && layer.enabled
      );

      if (matchingLayer) {
        const frequencyAccuracy = Math.max(
          0,
          100 - Math.abs(matchingLayer.frequency - targetLayer.frequency) * 20
        );
        const amplitudeAccuracy = Math.max(
          0,
          100 - Math.abs(matchingLayer.amplitude - targetLayer.amplitude) * 20
        );
        const phaseAccuracy = Math.max(
          0,
          100 - Math.abs(matchingLayer.phase - targetLayer.phase) * 10
        );

        totalAccuracy += (frequencyAccuracy + amplitudeAccuracy + phaseAccuracy) / 3;
        validLayers++;
      }
    });

    return validLayers > 0 ? totalAccuracy / validLayers : 0;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw individual layers
    layers.forEach((layer, index) => {
      if (layer.enabled) {
        const hue = (index * 60) % 360;
        drawWaveform(ctx, layer, `hsla(${hue}, 70%, 50%, 0.5)`, false);
      }
    });

    // Draw target layers if provided
    if (showTarget && targetLayers.length > 0) {
      targetLayers.forEach((layer, index) => {
        if (layer.enabled) {
          const hue = (index * 60) % 360;
          drawWaveform(ctx, layer, `hsla(${hue}, 70%, 50%, 0.3)`, true);
        }
      });
    }

    // Draw combined waveform
    drawCombinedWaveform(ctx, layers, '#2196F3', false);
    if (showTarget && targetLayers.length > 0) {
      drawCombinedWaveform(ctx, targetLayers, '#4CAF50', true);
    }

    // Calculate and report accuracy if needed
    if (onMatch && showTarget && targetLayers.length > 0) {
      const accuracy = calculateMatchAccuracy(layers, targetLayers);
      onMatch(accuracy);
    }
  }, [layers, targetLayers, width, height, showTarget, onMatch]);

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