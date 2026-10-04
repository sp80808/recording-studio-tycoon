/**
 * @fileoverview Tape Splicing Minigame - Analog Era (1960s-1970s)
 * @version 0.4.0
 * @author Recording Studio Tycoon Development Team
 * 
 * Era-specific minigame simulating analog tape editing on a physical splicing block.
 * Players cut unwanted clicks/pops/hums at 45° angles, peel away bad tape scraps,
 * and apply adhesive splicing tape to restore clean, seamless playback.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Scissors, 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  Disc, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Bandage, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { gameAudio } from '@/utils/audioSystem';
import { triggerProjectCompleteJuice } from '@/utils/confettiJuice';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import { tc } from '@/i18n/content';

interface TapeSplicingGameProps {
  onComplete: (score: number, success?: boolean) => void;
  onClose: () => void;
  minigameId?: string;
}

interface DefectZone {
  id: number;
  name: string;
  type: 'pop' | 'hum' | 'cough';
  start: number; // in pixels (0 - 800)
  end: number;
  inCut: boolean;
  outCut: boolean;
  spliced: boolean;
  tolerance: number;
}

// Interactive Web Audio Tape Synthesizer & Defect Generator
class TapeSynthEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private defectGain: GainNode | null = null;
  private stepInterval: NodeJS.Timeout | null = null;
  private currentStep = 0;
  private activeDefectType: 'pop' | 'hum' | 'cough' | null = null;

  // Funky 70s analog bassline notes (Hz)
  private bassline = [110, 110, 130.81, 146.83, 110, 164.81, 146.83, 123.47];

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.defectGain = this.ctx.createGain();
      this.defectGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.defectGain.connect(this.masterGain);
    } catch {
      // Audio fallback
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  startGroove() {
    this.init();
    this.resume();
    if (!this.ctx || this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;

    this.stepInterval = setInterval(() => {
      this.playGrooveStep();
    }, 180);
  }

  stopGroove() {
    this.isPlaying = false;
    if (this.stepInterval) {
      clearInterval(this.stepInterval);
      this.stepInterval = null;
    }
  }

  private playGrooveStep() {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const freq = this.bassline[this.currentStep % this.bassline.length];
    this.currentStep++;

    // Analog punchy bass synthesizer note
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const env = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 0.16);

    env.gain.setValueAtTime(0.3, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(filter);
    filter.connect(env);
    env.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + 0.18);

    // Warm vintage vinyl tape hiss / hi-hat tick
    if (this.currentStep % 2 === 0) {
      this.playTapeHissTick(now);
    }
  }

  private playTapeHissTick(time: number) {
    if (!this.ctx || !this.musicGain) return;
    const bufferSize = this.ctx.sampleRate * 0.03;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(5000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.035);
  }

  setDefectSound(defectType: 'pop' | 'hum' | 'cough' | null) {
    this.init();
    if (this.activeDefectType === defectType) return;
    this.activeDefectType = defectType;

    if (!defectType || !this.ctx || !this.defectGain) return;
    const now = this.ctx.currentTime;

    if (defectType === 'pop') {
      // Harsh impulse click
      const popOsc = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();
      popOsc.type = 'square';
      popOsc.frequency.setValueAtTime(220, now);
      popOsc.frequency.exponentialRampToValueAtTime(40, now + 0.06);
      popGain.gain.setValueAtTime(0.6, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      popOsc.connect(popGain);
      popGain.connect(this.defectGain);
      popOsc.start(now);
      popOsc.stop(now + 0.07);
    } else if (defectType === 'hum') {
      // 60Hz ground buzz
      const humOsc = this.ctx.createOscillator();
      const humGain = this.ctx.createGain();
      humOsc.type = 'sawtooth';
      humOsc.frequency.setValueAtTime(60, now);
      humGain.gain.setValueAtTime(0.35, now);
      humGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      humOsc.connect(humGain);
      humGain.connect(this.defectGain);
      humOsc.start(now);
      humOsc.stop(now + 0.2);
    } else if (defectType === 'cough') {
      // Low bandpass noise burst
      const bufSize = this.ctx.sampleRate * 0.12;
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const output = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.4;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(350, now);
      filter.Q.setValueAtTime(3, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.defectGain);
      noise.start(now);
      noise.stop(now + 0.13);
    }
  }

  playRazorSliceSound() {
    this.init();
    this.resume();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Metallic high-frequency slice / snip
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.07);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  playSpliceSnapSound() {
    this.init();
    this.resume();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Punchy tactile plastic snap + magnetic adhesive lock
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'square';
    snapOsc.frequency.setValueAtTime(950, now);
    snapOsc.frequency.exponentialRampToValueAtTime(80, now + 0.09);

    snapGain.gain.setValueAtTime(0.6, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    snapOsc.connect(snapGain);
    snapGain.connect(this.ctx.destination);

    snapOsc.start(now);
    snapOsc.stop(now + 0.11);
  }

  dispose() {
    this.stopGroove();
    if (this.ctx) {
      try {
        void this.ctx.close();
      } catch {
        // Safe ignore
      }
      this.ctx = null;
    }
  }
}

export const TapeSplicingGame: React.FC<TapeSplicingGameProps> = ({ onComplete, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadX, setPlayheadX] = useState(0);
  const [selectedTool, setSelectedTool] = useState<'cut' | 'splice'>('cut');
  const [feedback, setFeedback] = useState<string>('');
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [snapTarget, setSnapTarget] = useState<{ defectId: number; edge: 'in' | 'out'; x: number } | null>(null);
  const [reelAngle, setReelAngle] = useState(0);

  // 3 distinct analog tape defect sections across the 800px tape
  const [defects, setDefects] = useState<DefectZone[]>([
    { id: 1, name: 'Loud Mic Pop', type: 'pop', start: 180, end: 230, inCut: false, outCut: false, spliced: false, tolerance: 14 },
    { id: 2, name: '60Hz Ground Hum', type: 'hum', start: 400, end: 460, inCut: false, outCut: false, spliced: false, tolerance: 14 },
    { id: 3, name: 'Vocal Cough', type: 'cough', start: 600, end: 660, inCut: false, outCut: false, spliced: false, tolerance: 14 },
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const synthRef = useRef<TapeSynthEngine>(new TapeSynthEngine());

  // Count cuts made & defects repaired
  const totalCutsMade = defects.reduce((acc, d) => acc + (d.inCut ? 1 : 0) + (d.outCut ? 1 : 0), 0);
  const cutsRemaining = Math.max(0, 6 - totalCutsMade);
  const defectsSpliced = defects.filter(d => d.spliced).length;
  const progressPercent = Math.round((defectsSpliced / defects.length) * 100);

  // Initialize synth engine cleanup
  useEffect(() => {
    const synth = synthRef.current;
    return () => {
      synth.dispose();
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Real-time tape transport playback loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying) {
        setPlayheadX(prev => {
          const next = prev + dt * 110; // ~110px per second across tape
          if (next >= 800) {
            return 0; // Loop playback
          }
          return next;
        });

        setReelAngle(a => (a + dt * 240) % 360);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Audio trigger when playhead crosses defects
  useEffect(() => {
    if (!isPlaying) {
      synthRef.current.setDefectSound(null);
      return;
    }

    const currentDefect = defects.find(
      d => !d.spliced && playheadX >= d.start - 8 && playheadX <= d.end + 8
    );

    if (currentDefect) {
      synthRef.current.setDefectSound(currentDefect.type);
    } else {
      synthRef.current.setDefectSound(null);
    }
  }, [playheadX, isPlaying, defects]);

  // Handle Play/Pause
  const handlePlayPause = useCallback(() => {
    void gameAudio.playGearSwitch();
    setIsPlaying(prev => {
      const next = !prev;
      if (next) {
        synthRef.current.startGroove();
      } else {
        synthRef.current.stopGroove();
      }
      return next;
    });
  }, []);

  // Spacebar toggle playback shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlePlayPause]);

  // Canvas drawing routine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Brushed Aluminum Splicing Block background
    const blockGrad = ctx.createLinearGradient(0, 0, 0, height);
    blockGrad.addColorStop(0, '#1c1917');
    blockGrad.addColorStop(0.12, '#292524');
    blockGrad.addColorStop(0.5, '#44403c');
    blockGrad.addColorStop(0.88, '#292524');
    blockGrad.addColorStop(1, '#1c1917');
    ctx.fillStyle = blockGrad;
    ctx.fillRect(0, 0, width, height);

    // Block bevel border
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Engraved ruler measurement ticks along top and bottom
    ctx.fillStyle = '#a8a29e';
    for (let x = 20; x < width; x += 20) {
      const isMajor = x % 100 === 0;
      const tickH = isMajor ? 10 : 5;
      ctx.fillRect(x, 2, 1, tickH);
      ctx.fillRect(x, height - tickH - 2, 1, tickH);

      if (isMajor) {
        ctx.font = '9px monospace';
        ctx.fillStyle = '#78716c';
        ctx.fillText(`${x / 100}s`, x - 6, 22);
      }
    }

    // 2. The 1/4" Analog Tape ribbon (warm mahogany brown with satin finish)
    const tapeY = 32;
    const tapeH = height - 64;
    const tapeGrad = ctx.createLinearGradient(0, tapeY, 0, tapeY + tapeH);
    tapeGrad.addColorStop(0, '#542611');
    tapeGrad.addColorStop(0.15, '#853e1b');
    tapeGrad.addColorStop(0.5, '#994a20');
    tapeGrad.addColorStop(0.85, '#733415');
    tapeGrad.addColorStop(1, '#431d0b');
    ctx.fillStyle = tapeGrad;
    ctx.fillRect(0, tapeY, width, tapeH);

    // Tape guide borders
    ctx.strokeStyle = '#381a09';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, tapeY, width, tapeH);

    // Subtle magnetic oxide horizontal tape micro-texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let ty = tapeY + 6; ty < tapeY + tapeH; ty += 6) {
      ctx.fillRect(0, ty, width, 1);
    }

    // 3. Draw Analog Waveform
    const midY = tapeY + tapeH / 2;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.lineWidth = 2.5;

    for (let x = 0; x < width; x++) {
      // Find if we are currently in an active defect
      const activeDefect = defects.find(d => x >= d.start && x <= d.end);
      let amplitude = 0;

      if (activeDefect && !activeDefect.spliced) {
        if (activeDefect.type === 'pop') {
          // Sharp irregular spike
          const distToCenter = Math.abs(x - (activeDefect.start + activeDefect.end) / 2);
          amplitude = Math.sin(x * 0.4) * Math.max(0, 1 - distToCenter / 25) * 32;
        } else if (activeDefect.type === 'hum') {
          // Fast buzz oscillation
          amplitude = Math.sin(x * 0.9) * 18 + (Math.random() - 0.5) * 6;
        } else {
          // Erratic cough burst
          amplitude = Math.sin(x * 0.15) * 22 + (Math.sin(x * 0.3) * 12);
        }
      } else {
        // Clean melodic groove waveform
        amplitude = Math.sin(x * 0.05) * 14 + Math.sin(x * 0.12) * 8 + Math.cos(x * 0.02) * 6;
      }

      const y = midY + amplitude;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Fluorescent phosphor core on top of waveform
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.85)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x++) {
      const activeDefect = defects.find(d => x >= d.start && x <= d.end);
      let amplitude = 0;
      if (activeDefect && !activeDefect.spliced) {
        if (activeDefect.type === 'pop') amplitude = Math.sin(x * 0.4) * 28;
        else if (activeDefect.type === 'hum') amplitude = Math.sin(x * 0.9) * 16;
        else amplitude = Math.sin(x * 0.15) * 20;
      } else {
        amplitude = Math.sin(x * 0.05) * 14 + Math.sin(x * 0.12) * 8 + Math.cos(x * 0.02) * 6;
      }
      const y = midY + amplitude;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 4. Render Defect Zones & Splicing Marks
    defects.forEach(defect => {
      const { start, end, inCut, outCut, spliced, name } = defect;
      const zoneW = end - start;

      if (!spliced) {
        // Warning striped highlight over defective tape section
        ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
        ctx.fillRect(start, tapeY, zoneW, tapeH);

        // Caution diagonal hash marks
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1.5;
        for (let hx = start; hx < end + tapeH; hx += 14) {
          ctx.beginPath();
          ctx.moveTo(hx, tapeY);
          ctx.lineTo(hx - 20, tapeY + tapeH);
          ctx.stroke();
        }

        // Defect banner above the tape
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`⚠️ ${name}`, start + zoneW / 2, tapeY - 8);

        // --- IN CUT LINE (45° angle) ---
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(start + 12, tapeY);
        ctx.lineTo(start - 12, tapeY + tapeH);
        if (inCut) {
          // Clean slice made
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#22c55e';
          ctx.shadowBlur = 8;
        } else {
          // Guide line
          ctx.strokeStyle = '#f87171';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
        }
        ctx.stroke();
        ctx.restore();

        // --- OUT CUT LINE (45° angle) ---
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(end + 12, tapeY);
        ctx.lineTo(end - 12, tapeY + tapeH);
        if (outCut) {
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#22c55e';
          ctx.shadowBlur = 8;
        } else {
          ctx.strokeStyle = '#f87171';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
        }
        ctx.stroke();
        ctx.restore();

        // If both IN and OUT are cut, draw "READY TO SPLICE" badge over the center
        if (inCut && outCut) {
          const badgeX = start + zoneW / 2;
          const badgeY = tapeY + tapeH / 2;
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.roundRect(badgeX - 44, badgeY - 14, 88, 28, 6);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#000000';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🩹 SPLICE TAPE', badgeX, badgeY + 4);
        }
      } else {
        // --- SPLICED JOINT: Studio Cyan Adhesive Splicing Tape Ribbon ---
        const spliceX = start + zoneW / 2;

        ctx.save();
        // Cyan-white adhesive splicing strip across the cut joint at 45°
        ctx.fillStyle = 'rgba(6, 182, 212, 0.88)';
        ctx.beginPath();
        ctx.moveTo(spliceX - 8 + 14, tapeY);
        ctx.lineTo(spliceX + 10 + 14, tapeY);
        ctx.lineTo(spliceX + 10 - 14, tapeY + tapeH);
        ctx.lineTo(spliceX - 8 - 14, tapeY + tapeH);
        ctx.closePath();
        ctx.fill();

        // Splicing tape border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Joint center slice seam
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(spliceX + 14, tapeY);
        ctx.lineTo(spliceX - 14, tapeY + tapeH);
        ctx.stroke();
        ctx.restore();

        // Green Success Badge above joint
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✓ SPLICED', spliceX, tapeY - 8);
      }
    });

    // 5. Razor Blade Cursor & Magnetic Snap Guide
    if (hoverX !== null) {
      const curX = snapTarget ? snapTarget.x : hoverX;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(curX + 12, tapeY - 4);
      ctx.lineTo(curX - 12, tapeY + tapeH + 4);

      if (snapTarget) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
      }
      ctx.stroke();

      // Blade silhouette indicator at the top
      ctx.fillStyle = snapTarget ? '#38bdf8' : '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(curX + 12, tapeY - 10);
      ctx.lineTo(curX + 6, tapeY - 2);
      ctx.lineTo(curX + 18, tapeY - 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // 6. Playhead Indicator (illuminated golden needle)
    ctx.save();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(playheadX, 4);
    ctx.lineTo(playheadX, height - 4);
    ctx.stroke();

    // Playhead head icon
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(playheadX - 6, 2);
    ctx.lineTo(playheadX + 6, 2);
    ctx.lineTo(playheadX, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

  }, [defects, hoverX, snapTarget, playheadX]);

  // Mouse hover tracking & magnetic snap to In/Out boundaries
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    setHoverX(x);

    // Check for magnetic snap near IN or OUT cut of any unspliced defect
    let foundSnap: { defectId: number; edge: 'in' | 'out'; x: number } | null = null;
    for (const d of defects) {
      if (d.spliced) continue;
      if (!d.inCut && Math.abs(x - d.start) <= d.tolerance) {
        foundSnap = { defectId: d.id, edge: 'in', x: d.start };
        break;
      }
      if (!d.outCut && Math.abs(x - d.end) <= d.tolerance) {
        foundSnap = { defectId: d.id, edge: 'out', x: d.end };
        break;
      }
    }
    setSnapTarget(foundSnap);
  };

  const handleMouseLeave = () => {
    setHoverX(null);
    setSnapTarget(null);
  };

  // Perform a razor cut or tape splice on canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 800;

    // Check if player clicked directly on a severed section's "SPLICE TAPE" badge
    const severedDefect = defects.find(
      d => !d.spliced && d.inCut && d.outCut && x >= d.start - 10 && x <= d.end + 10
    );

    if (severedDefect || selectedTool === 'splice') {
      const target = severedDefect || defects.find(d => !d.spliced && d.inCut && d.outCut);
      if (target) {
        performSplice(target.id);
        return;
      }
    }

    // Otherwise, perform Razor Cut
    if (selectedTool === 'cut' || !severedDefect) {
      performCut(x);
    }
  };

  const performCut = (clickX: number) => {
    synthRef.current.playRazorSliceSound();
    void gameAudio.playTactileClick();

    let cutSuccess = false;
    let accuracyPoints = 0;

    setDefects(prevDefects =>
      prevDefects.map(d => {
        if (d.spliced) return d;

        // Check IN cut boundary
        const distIn = Math.abs(clickX - d.start);
        if (!d.inCut && distIn <= d.tolerance * 1.5) {
          cutSuccess = true;
          const precision = Math.max(0.5, 1 - distIn / (d.tolerance * 1.5));
          accuracyPoints = Math.round(precision * 60);
          return { ...d, inCut: true };
        }

        // Check OUT cut boundary
        const distOut = Math.abs(clickX - d.end);
        if (!d.outCut && distOut <= d.tolerance * 1.5) {
          cutSuccess = true;
          const precision = Math.max(0.5, 1 - distOut / (d.tolerance * 1.5));
          accuracyPoints = Math.round(precision * 60);
          return { ...d, outCut: true };
        }

        // Forgiving assist: if inside the defect, slice the uncut edge
        if (clickX >= d.start && clickX <= d.end) {
          if (!d.inCut) {
            cutSuccess = true;
            accuracyPoints = 40;
            return { ...d, inCut: true };
          }
          if (!d.outCut) {
            cutSuccess = true;
            accuracyPoints = 40;
            return { ...d, outCut: true };
          }
        }

        return d;
      })
    );

    if (cutSuccess) {
      void gameAudio.playGoodHit();
      const points = accuracyPoints * combo;
      setScore(s => s + points);
      setCombo(c => Math.min(3, c + 0.5));
      setFeedback(tc('mg.TapeSplicingGame.cut_perfect', 'Perfect cut! +{{points}} points', { points }));
    } else {
      setFeedback(tc('mg.TapeSplicingGame.cut_missed', 'Cut missed the target area'));
    }

    setTimeout(() => setFeedback(''), 1800);
  };

  const performSplice = (defectId: number) => {
    synthRef.current.playSpliceSnapSound();
    void gameAudio.playGearSwitch();

    setDefects(prev =>
      prev.map(d => (d.id === defectId ? { ...d, spliced: true } : d))
    );

    const splicePoints = 120 * combo;
    setScore(s => s + splicePoints);
    setCombo(c => Math.min(3, c + 0.5));
    setFeedback(`✨ Defect removed & spliced! +${splicePoints} pts`);

    // Check if this was the last defect
    const remaining = defects.filter(d => d.id !== defectId && !d.spliced).length;
    if (remaining === 0) {
      void gameAudio.playSuccess();
      triggerProjectCompleteJuice();
    }

    setTimeout(() => setFeedback(''), 2200);
  };

  // Quick Action: Slice both sides of active defect
  const handleQuickCutDefect = (defectId: number) => {
    synthRef.current.playRazorSliceSound();
    void gameAudio.playTactileClick();

    setDefects(prev =>
      prev.map(d => (d.id === defectId ? { ...d, inCut: true, outCut: true } : d))
    );
    setScore(s => s + 50);
    setFeedback('✂️ Both boundaries sliced cleanly!');
    setTimeout(() => setFeedback(''), 1800);
  };

  const handleReset = () => {
    void gameAudio.playTactileClick();
    synthRef.current.stopGroove();
    setDefects([
      { id: 1, name: 'Loud Mic Pop', type: 'pop', start: 180, end: 230, inCut: false, outCut: false, spliced: false, tolerance: 14 },
      { id: 2, name: '60Hz Ground Hum', type: 'hum', start: 400, end: 460, inCut: false, outCut: false, spliced: false, tolerance: 14 },
      { id: 3, name: 'Vocal Cough', type: 'cough', start: 600, end: 660, inCut: false, outCut: false, spliced: false, tolerance: 14 },
    ]);
    setPlayheadX(0);
    setIsPlaying(false);
    setScore(0);
    setCombo(1);
    setFeedback('');
  };

  const handleComplete = () => {
    // Generous completion calculation
    const timeBonus = timeLeft * 3;
    const finalScore = score + (defectsSpliced === 3 ? 150 : 0) + timeBonus;
    const isSuccess = defectsSpliced >= 2 || finalScore >= 200;

    if (isSuccess) {
      void gameAudio.playSuccess();
      triggerProjectCompleteJuice();
    }
    onComplete(finalScore, isSuccess);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-stone-900 text-white border-stone-700 shadow-2xl">
      <MinigameChrome
        title={tc('mg.TapeSplicingGame.title', '🎞️ Tape Splicing Studio')}
        score={score}
        timeLeft={timeLeft}
        accent="yellow"
      >
        <CardContent className="space-y-4 pt-1">
          {/* Objective Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-stone-800/80 p-3 rounded-lg border border-stone-700">
            <div>
              <p className="text-amber-200 text-sm font-medium">
                {tc('mg.TapeSplicingGame.instructions', 'Cut and remove the red highlighted problem sections from the analog tape.')}
              </p>
              <p className="text-stone-400 text-xs mt-0.5">
                1. Slice IN & OUT points (✂️) → 2. Discard scrap & apply Splicing Tape (🩹) → 3. Listen to clean master (🎧)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-amber-600/70 text-amber-300 font-mono text-xs bg-amber-950/40">
                <Scissors className="w-3 h-3 mr-1 text-amber-400" />
                {tc('mg.TapeSplicingGame.cuts_remaining', 'Cuts remaining: {{n}}', { n: cutsRemaining })}
              </Badge>
              {combo > 1 && (
                <Badge className="bg-yellow-500 text-black font-bold text-xs animate-pulse">
                  {combo.toFixed(1)}x COMBO
                </Badge>
              )}
            </div>
          </div>

          {/* Analog Tape Transport Deck & Reels */}
          <div className="flex items-center justify-between px-6 py-2 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 rounded-lg border border-stone-800 shadow-inner">
            {/* Supply Reel (Left) */}
            <div className="flex items-center gap-3">
              <div 
                className="relative w-11 h-11 rounded-full border-2 border-stone-500 flex items-center justify-center bg-stone-800 shadow transition-transform"
                style={{ transform: `rotate(${reelAngle}deg)` }}
              >
                <Disc className="w-9 h-9 text-stone-400" />
                <div className="absolute w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Supply Reel</div>
                <div className="text-xs font-bold text-stone-200">15 IPS Master</div>
              </div>
            </div>

            {/* Tape Path Center Marquee */}
            <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-ping' : 'bg-stone-600'}`} />
              <span>{isPlaying ? 'RECORDING HEAD ACTIVE (SCRUBBING)' : 'EDIT BLOCK STATIONARY (READY)'}</span>
            </div>

            {/* Takeup Reel (Right) */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Takeup Reel</div>
                <div className="text-xs font-bold text-stone-200">Aluminum Spool</div>
              </div>
              <div 
                className="relative w-11 h-11 rounded-full border-2 border-stone-500 flex items-center justify-center bg-stone-800 shadow transition-transform"
                style={{ transform: `rotate(${reelAngle}deg)` }}
              >
                <Disc className="w-9 h-9 text-stone-400" />
                <div className="absolute w-2 h-2 rounded-full bg-amber-500" />
              </div>
            </div>
          </div>

          {/* Interactive Splicing Block Canvas */}
          <div className="relative border-4 border-stone-700 rounded-xl overflow-hidden shadow-2xl bg-black">
            <canvas
              ref={canvasRef}
              width={800}
              height={160}
              className="w-full cursor-crosshair active:brightness-105 select-none"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={handleCanvasClick}
            />

            {/* Live Hover Guidance Overlay */}
            {snapTarget && (
              <div
                className="absolute top-2 pointer-events-none transform -translate-x-1/2 bg-sky-950/90 text-sky-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-sky-400 shadow-md animate-bounce"
                style={{ left: `${(snapTarget.x / 800) * 100}%` }}
              >
                {snapTarget.edge === 'in' ? '✂️ SLICE IN POINT' : '✂️ SLICE OUT POINT'}
              </div>
            )}
          </div>

          {/* Defect Cards Quick Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {defects.map(d => {
              const isSevered = d.inCut && d.outCut && !d.spliced;
              return (
                <div 
                  key={d.id}
                  className={`p-2.5 rounded-lg border text-xs transition-all ${
                    d.spliced 
                      ? 'bg-emerald-950/30 border-emerald-700/60 text-emerald-200' 
                      : isSevered 
                        ? 'bg-amber-950/40 border-amber-500 text-amber-200 ring-1 ring-amber-400' 
                        : 'bg-stone-800/80 border-stone-700 text-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold flex items-center gap-1.5">
                      {d.spliced ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      )}
                      {d.name}
                    </span>
                    <span className="font-mono text-[10px] text-stone-400">
                      {d.spliced ? 'REPAIRED' : isSevered ? 'SEVERED' : 'UNEDITED'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <span className={d.inCut ? 'text-emerald-400' : 'text-stone-400'}>
                      IN Cut: {d.inCut ? '✓' : '—'}
                    </span>
                    <span className={d.outCut ? 'text-emerald-400' : 'text-stone-400'}>
                      OUT Cut: {d.outCut ? '✓' : '—'}
                    </span>

                    {!d.spliced && (
                      isSevered ? (
                        <Button
                          size="sm"
                          onClick={() => performSplice(d.id)}
                          className="h-6 text-[10px] bg-amber-500 hover:bg-amber-400 text-black font-bold px-2"
                        >
                          <Bandage className="w-3 h-3 mr-1" />
                          Splice
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickCutDefect(d.id)}
                          className="h-6 text-[10px] border-amber-600/60 text-amber-300 hover:bg-amber-900/40 px-2"
                        >
                          <Scissors className="w-3 h-3 mr-1" />
                          Cut Both
                        </Button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
            {/* Transport controls */}
            <div className="flex gap-2">
              <Button
                onClick={handlePlayPause}
                variant="outline"
                size="sm"
                className={`font-semibold border-amber-500 ${
                  isPlaying 
                    ? 'bg-amber-500 text-black hover:bg-amber-400' 
                    : 'text-amber-200 hover:bg-amber-900/50'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4 mr-1.5" /> : <Play className="w-4 h-4 mr-1.5" />}
                {isPlaying ? tc('mg.TapeSplicingGame.pause', 'Pause') : tc('mg.TapeSplicingGame.play', 'Play')}
                <span className="text-[10px] ml-1 opacity-70">(Space)</span>
              </Button>
              
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="border-stone-600 text-stone-300 hover:bg-stone-800"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                {tc('mg.TapeSplicingGame.reset', 'Reset')}
              </Button>
            </div>

            {/* Tool Selection */}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setSelectedTool('cut');
                  void gameAudio.playTactileClick();
                }}
                variant={selectedTool === 'cut' ? 'default' : 'outline'}
                size="sm"
                className={selectedTool === 'cut' 
                  ? 'bg-amber-600 text-white font-bold hover:bg-amber-500' 
                  : 'border-stone-600 text-stone-300'}
              >
                <Scissors className="w-4 h-4 mr-1.5" />
                {tc('mg.TapeSplicingGame.razor_tool', 'Razor Tool')}
              </Button>

              <Button
                onClick={() => {
                  setSelectedTool('splice');
                  void gameAudio.playTactileClick();
                  // If any severed defect is waiting, splice it right away
                  const ready = defects.find(d => !d.spliced && d.inCut && d.outCut);
                  if (ready) performSplice(ready.id);
                }}
                variant={selectedTool === 'splice' ? 'default' : 'outline'}
                size="sm"
                className={selectedTool === 'splice' 
                  ? 'bg-sky-600 text-white font-bold hover:bg-sky-500' 
                  : 'border-stone-600 text-stone-300'}
              >
                <Bandage className="w-4 h-4 mr-1.5" />
                Splicing Tape
              </Button>
            </div>
          </div>

          {/* Progress & Live Feedback */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-amber-300 font-mono">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {tc('mg.TapeSplicingGame.splicing_progress', 'Splicing Progress')} ({defectsSpliced}/3 Spliced)
              </span>
              <span>{progressPercent}%</span>
            </div>
            <Progress 
              value={progressPercent} 
              className="h-2.5 bg-stone-800"
            />
            
            {feedback ? (
              <div className="text-center text-sm font-bold text-yellow-300 animate-pulse pt-1">
                {feedback}
              </div>
            ) : (
              <div className="text-center text-xs text-stone-400 pt-1">
                {defectsSpliced === 3 
                  ? '🎉 All analog tape defects spliced! Master track plays perfectly clean!' 
                  : '💡 Tip: Hover near red zone edges to snap the 45° razor, or click "Cut Both"'}
              </div>
            )}
          </div>
        </CardContent>
      </MinigameChrome>

      <DialogFooter className="p-4 bg-stone-950/80 border-t border-stone-800">
        <KenneyButton variant="yellow" onClick={onClose}>
          {tc('mg.TapeSplicingGame.close', 'Close')}
        </KenneyButton>
        <KenneyButton 
          variant={defectsSpliced >= 2 ? 'green' : 'yellow'} 
          onClick={handleComplete}
        >
          {tc('mg.TapeSplicingGame.complete_edit', 'Complete Edit')}
        </KenneyButton>
      </DialogFooter>
    </Card>
  );
};
