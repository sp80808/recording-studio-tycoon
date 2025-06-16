// Sound System for Recording Studio Tycoon
// Using Web Audio API with real audio files

interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  sfxEnabled: boolean;
  musicEnabled: boolean;
}

class GameAudioSystem {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private isInitialized = false;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private currentMusic: AudioBufferSourceNode | null = null;
  private settings: AudioSettings = {
    masterVolume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.5,
    sfxEnabled: true,
    musicEnabled: true
  };

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create gain nodes for different audio types
      this.masterGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();
      
      // Connect audio graph
      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);
      
      // Set initial volumes
      this.updateVolumes();
      
      // Load audio settings from localStorage
      this.loadSettings();
      
      // Preload audio files
      await this.preloadAudioFiles();
      
      this.isInitialized = true;
    } catch (error) {
      console.warn('Audio context initialization failed:', error);
    }
  }

  private updateVolumes() {
    if (!this.masterGain || !this.sfxGain || !this.musicGain) return;
    
    this.masterGain.gain.setValueAtTime(this.settings.masterVolume, this.audioContext?.currentTime || 0);
    this.sfxGain.gain.setValueAtTime(this.settings.sfxEnabled ? this.settings.sfxVolume : 0, this.audioContext?.currentTime || 0);
    this.musicGain.gain.setValueAtTime(this.settings.musicEnabled ? this.settings.musicVolume : 0, this.audioContext?.currentTime || 0);
  }

  private async loadAndCacheAudio(name: string, path: string): Promise<AudioBuffer | null> {
    if (!this.audioContext) {
      console.warn('AudioContext not initialized, cannot load audio.');
      return null;
    }
    if (this.audioBuffers.has(name)) {
      return this.audioBuffers.get(name)!;
    }
    try {
      // Assuming paths like '/audio/drums/kick.wav' are relative to the public folder
      const response = await fetch(path); 
      if (!response.ok) {
        throw new Error(`Failed to fetch audio ${name} from ${path}: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(name, audioBuffer);
      console.log(`Audio loaded and cached: ${name}`);
      return audioBuffer;
    } catch (error) {
      console.warn(`Failed to load audio file ${name} from ${path}:`, error);
      return null;
    }
  }

  private async preloadAudioFiles() {
    // Paths should be relative to the public directory for direct fetching.
    // Example: '/audio/drums/kick.wav' if 'audio' is in 'public'
    const audioFiles = [
      // Drums - Corrected paths
      { name: 'kick', path: '/audio/drums/Ama kick (7).wav' }, 
      { name: 'snare', path: '/audio/drums/Ama-snare (5).wav' },
      { name: 'hihat', path: '/audio/drums/GS_NT_HAT_04.wav' },
      { name: 'openhat', path: '/audio/drums/MURDA_HAT_OPEN_ZETO.wav' },
      // UI SFX - Corrected pathsProject Complete
      { name: 'ui-bubble-pop', path: '/audio/ui-sfx/bubble-pop-sound-316482.mp3' },
      { name: 'ui-close-menu', path: '/audio/ui-sfx/close-menu.mp3' },
      { name: 'ui-email-notif', path: '/audio/ui-sfx/emailnotif-190435.mp3' },
      { name: 'ui-notice', path: '/audio/ui-sfx/notice-sound-270349.mp3' },
      { name: 'ui-proj-complete', path: '/audio/ui-sfx/proj-complete.mp3' },
      { name: 'ui-purchase-complete', path: '/audio/ui-sfx/purchase-complete.mp3' },
      { name: 'ui-staff-unavailable', path: '/audio/ui-sfx/staff-unavailable-warning.mp3' },
      { name: 'ui-stage-complete', path: '/audio/ui-sfx/stage-complete.mp3' },
      { name: 'ui-training-complete', path: '/audio/ui-sfx/training-complete.mp3' },
      { name: 'ui-unavailable', path: '/audio/ui-sfx/unavailable-ui-79817.mp3' },
      // Music - Added paths
      { name: 'music-bgm1', path: '/audio/music/tycoon-bgm1.mp3' },
      { name: 'music-bgm2', path: '/audio/music/tycoon-bgm2.mp3' },
      { name: 'music-bgm3', path: '/audio/music/tycoon-bgm3.mp3' },
      { name: 'music-bgm4', path: '/audio/music/tycoon-bgm4.mp3' },
      { name: 'music-bgm5', path: '/audio/music/tycoon-bgm5.mp3' },
      { name: 'music-bgm6', path: '/audio/music/tycoon-bgm6.mp3' },
      { name: 'music-bgm7', path: '/audio/music/tycoon-bgm7.mp3' },
      { name: 'music-bgm8', path: '/audio/music/tycoon-bgm8.mp3' },
    ];

    // Filter out any files that might have been added with empty paths
    const validAudioFiles = audioFiles.filter(file => file.path && file.path.trim() !== '');

    const loadPromises = validAudioFiles.map(file => this.loadAndCacheAudio(file.name, file.path));
    await Promise.all(loadPromises);
  }

  // Public method to check initialization status
  public isAudioInitialized(): boolean {
    return this.isInitialized;
  }

  // Public method to play sound, loads on demand if not cached
  // Name can be a key (for preloaded) or a full path (for on-demand, e.g. chart clips)
  async playSound(nameOrPath: string, type: 'sfx' | 'music' = 'sfx', volume: number = 1, loop: boolean = false): Promise<AudioBufferSourceNode | null> {
    await this.ensureInitialized();
    if (!this.audioContext) return null;

    let buffer = this.audioBuffers.get(nameOrPath);
    if (!buffer) {
      // If not in cache, assume nameOrPath is a path and try to load it
      // For chart clips, the path would be like '/audio/chart_clips/clip.mp3'
      // The 'name' for caching will be the path itself to ensure uniqueness for dynamic files
      console.log(`Buffer for ${nameOrPath} not found in cache, attempting to load...`);
      buffer = await this.loadAndCacheAudio(nameOrPath, nameOrPath);
    }

    if (!buffer) {
      console.warn(`Audio buffer not found or could not be loaded: ${nameOrPath}`);
      return null;
    }
    
    const gainNode = type === 'music' ? this.musicGain : this.sfxGain;
    if (!gainNode) {
        console.warn(`Gain node for type ${type} not available.`);
        return null;
    }

    const source = this.audioContext.createBufferSource();
    const gainControl = this.audioContext.createGain();
    
    source.buffer = buffer;
    source.loop = loop;
    source.connect(gainControl);
    gainControl.connect(gainNode);
    
    gainControl.gain.setValueAtTime(volume, this.audioContext.currentTime);
    
    source.start();

    if (type === 'music') {
      if (this.currentMusic) {
        this.currentMusic.stop();
      }
      this.currentMusic = source;
    }
    return source;
  }

  // Settings management
  updateSettings(newSettings: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.updateVolumes();
    this.saveSettings();
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  private saveSettings() {
    localStorage.setItem('gameAudioSettings', JSON.stringify(this.settings));
  }

  private loadSettings() {
    const saved = localStorage.getItem('gameAudioSettings');
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
        this.updateVolumes();
      } catch (error) {
        console.warn('Failed to load audio settings:', error);
      }
    }
  }

  private async ensureInitialized() {
    if (!this.isInitialized) {
      try {
        await this.initialize();
      } catch (error) {
        console.warn('Audio system initialization failed:', error);
        return false;
      }
    }
    
    if (this.audioContext?.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Failed to resume audio context:', error);
        return false;
      }
    }
    
    return true;
  }

  // Call this after the first user interaction to ensure AudioContext is running
  async userGestureSignal(): Promise<boolean> {
    console.log('User gesture detected, ensuring audio context is active.');
    const initialized = await this.ensureInitialized();
    if (initialized && this.audioContext?.state === 'running') {
      console.log('Audio context is active and running.');
      // Optionally, auto-play initial background music here if desired
      // For example: this.playSound('bgm1', 'music', 0.5, true);
    } else if (initialized) {
      console.warn('Audio context is initialized but not running. State:', this.audioContext?.state);
    } else {
      console.error('Audio context failed to initialize or resume after user gesture.');
    }
    return initialized && this.audioContext?.state === 'running';
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

  // GENERAL UI SOUNDS
  async playUISound(soundType: string) {
    switch (soundType) {
      case 'buttonClick':
        await this.playClick();
        break;
      case 'success':
        await this.playSuccess();
        break;
      case 'levelUp':
        await this.playLevelUp();
        break;
      case 'purchase':
        await this.playEquipmentPurchase();
        break;
      case 'error':
        await this.playError();
        break;
      case 'hover':
        await this.playButtonHover();
        break;
      default:
        // Fall back to basic click sound for unknown types
        await this.playClick();
    }
  }
}

// Global instance
const gameAudioSystem = new GameAudioSystem();
export default gameAudioSystem;

export const playSound = async (soundName: string, volume: number = 1, type: 'sfx' | 'music' = 'sfx', loop: boolean = false) => {
  if (!gameAudioSystem.isAudioInitialized()) {
    console.warn('Audio system not initialized. Attempting to initialize now. This should ideally be done at app start');
    await gameAudioSystem.initialize();
    if (!gameAudioSystem.isAudioInitialized()) {
      console.error("Failed to initialize audio system on demand.");
      return;
    }
  }
  
  // Delegate to the GameAudioSystem class method with correct argument order
  return gameAudioSystem.playSound(soundName, type, volume, loop);
};

// Export the instance as a named export for compatibility
export { gameAudioSystem as gameAudio };

// Example of how to get the underlying AudioContext if needed elsewhere (though direct use should be rare)
export const getAudioContext = () => {
  if (!gameAudioSystem.isAudioInitialized()) {
    console.warn("Audio system not initialized when trying to get context.");
    // Optionally, you could try to initialize it here too, or return null
    // await gameAudioSystem.initialize();
  }
  return gameAudioSystem['audioContext']; // Accessing private member for specific needs, consider a getter
};