// Sound System for Recording Studio Tycoon
// Using Web Audio API for real-time sound generation

class GameAudioSystem {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.setValueAtTime(0.3, this.audioContext.currentTime); // Master volume
      this.isInitialized = true;
    } catch (error) {
      console.warn('Audio context initialization failed:', error);
    }
  }

  private async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // BEAT MAKING SOUNDS
  async playKick() {
    await this.ensureInitialized();
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    // Kick drum synthesis
    oscillator.frequency.setValueAtTime(60, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(20, this.audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.8, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  async playSnare() {
    await this.ensureInitialized();
    if (!this.audioContext || !this.masterGain) return;

    // Snare using noise + tone
    const noiseBuffer = this.createNoiseBuffer(0.1);
    const noiseSource = this.audioContext.createBufferSource();
    const noiseGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    noiseSource.buffer = noiseBuffer;
    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
    
    noiseGain.gain.setValueAtTime(0.6, this.audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    noiseSource.start();
    noiseSource.stop(this.audioContext.currentTime + 0.2);
  }

  async playHiHat() {
    await this.ensureInitialized();
    if (!this.audioContext || !this.masterGain) return;

    const noiseBuffer = this.createNoiseBuffer(0.05);
    const noiseSource = this.audioContext.createBufferSource();
    const noiseGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    noiseSource.buffer = noiseBuffer;
    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, this.audioContext.currentTime);
    
    noiseGain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
    
    noiseSource.start();
    noiseSource.stop(this.audioContext.currentTime + 0.05);
  }

  async playOpenHat() {
    await this.ensureInitialized();
    if (!this.audioContext || !this.masterGain) return;

    const noiseBuffer = this.createNoiseBuffer(0.3);
    const noiseSource = this.audioContext.createBufferSource();
    const noiseGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    noiseSource.buffer = noiseBuffer;
    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6000, this.audioContext.currentTime);
    
    noiseGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    noiseSource.start();
    noiseSource.stop(this.audioContext.currentTime + 0.3);
  }

  // GAME UI SOUNDS
  async playSuccess() {
    await this.ensureInitialized();
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  async playError() {
    await this.ensureInitialized();
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  async playClick() {
    await this.ensureInitialized();
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.05);
  }

  async playLevelUp() {
    await this.ensureInitialized();
    if (!this.audioContext || !this.masterGain) return;

    // Ascending arpeggio
    const notes = [440, 554, 659, 880]; // A, C#, E, A
    
    notes.forEach((freq, index) => {
      setTimeout(() => {
        const oscillator = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain!);
        
        oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext!.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.4);
        
        oscillator.start();
        oscillator.stop(this.audioContext!.currentTime + 0.4);
      }, index * 100);
    });
  }

  async playCompleteProject() {
    await this.ensureInitialized();
    if (!this.audioContext || !this.masterGain) return;

    // Major chord progression
    const chord1 = [440, 554, 659]; // A major
    const chord2 = [494, 622, 740]; // B major
    
    [chord1, chord2].forEach((chord, chordIndex) => {
      setTimeout(() => {
        chord.forEach(freq => {
          const oscillator = this.audioContext!.createOscillator();
          const gainNode = this.audioContext!.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(this.masterGain!);
          
          oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime);
          
          gainNode.gain.setValueAtTime(0.2, this.audioContext!.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.8);
          
          oscillator.start();
          oscillator.stop(this.audioContext!.currentTime + 0.8);
        });
      }, chordIndex * 400);
    });
  }

  // WAVEFORM SOUNDS
  async playWaveformMatch() {
    await this.ensureInitialized();
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    // Sweep frequency to simulate waveform
    oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(440, this.audioContext.currentTime + 0.2);
    oscillator.frequency.linearRampToValueAtTime(220, this.audioContext.currentTime + 0.4);
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.4);
  }

  private createNoiseBuffer(duration: number): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not initialized');
    
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    return buffer;
  }

  // RHYTHM TIMING GAME SOUNDS
  async playMetronome(bpm: number = 120) {
    await this.ensureInitialized();
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  async playPerfectHit() {
    await this.ensureInitialized();
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1320, this.audioContext.currentTime + 0.05);
    
    gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  async playGoodHit() {
    await this.ensureInitialized();
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.frequency.setValueAtTime(660, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  // MIXING BOARD GAME SOUNDS
  async playSliderMove() {
    await this.ensureInitialized();
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.05);
  }

  async playZoneEnter() {
    await this.ensureInitialized();
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
    
    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  async playPerfectMix() {
    await this.ensureInitialized();
    if (!this.audioContext || !this.masterGain) return;

    // Play a triumphant chord
    const frequencies = [523, 659, 784]; // C5, E5, G5
    
    frequencies.forEach(freq => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain!);
      
      oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime);
      
      gainNode.gain.setValueAtTime(0.15, this.audioContext!.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.6);
      
      oscillator.start();
      oscillator.stop(this.audioContext!.currentTime + 0.6);
    });
  }

  // MASTERING GAME SOUNDS
  async playParameterAdjust() {
    await this.ensureInitialized();
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(350, this.audioContext.currentTime + 0.05);
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.05);
  }

  async playMasterCheck() {
    await this.ensureInitialized();
    if (!this.audioContext || !this.masterGain) return;

    // Sweep sound for mastering check
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  // VOCAL RECORDING GAME SOUNDS
  async playVocalHit() {
    await this.ensureInitialized();
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    // Vocal-like frequency with vibrato
    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
    oscillator.frequency.setValueAtTime(450, this.audioContext.currentTime + 0.05);
    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  async playVocalMiss() {
    await this.ensureInitialized();
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(150, this.audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  // GENERAL UI SOUNDS
  async playEquipmentPurchase() {
    await this.ensureInitialized();
    if (!this.audioContext || !this.masterGain) return;

    // Cash register sound effect
    const oscillator1 = this.audioContext.createOscillator();
    const oscillator2 = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator1.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator2.frequency.setValueAtTime(1200, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
    
    oscillator1.start();
    oscillator2.start();
    oscillator1.stop(this.audioContext.currentTime + 0.4);
    oscillator2.stop(this.audioContext.currentTime + 0.4);
  }

  async playButtonHover() {
    await this.ensureInitialized();
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.03);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.03);
  }
}

// Global instance
export const gameAudio = new GameAudioSystem();
