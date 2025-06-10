import { useEffect, useRef } from 'react';

type SoundOptions = {
  loop?: boolean;
  volume?: number;
};

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private isMuted: boolean = false;

  constructor() {
    // Load saved mute state
    this.isMuted = localStorage.getItem('gameMuted') === 'true';
  }

  loadSound(id: string, url: string) {
    const audio = new Audio(url);
    this.sounds.set(id, audio);
  }

  play(id: string, options: SoundOptions = {}) {
    const sound = this.sounds.get(id);
    if (!sound) return;

    sound.loop = options.loop || false;
    sound.volume = options.volume || 1.0;
    
    if (!this.isMuted) {
      sound.play().catch(error => {
        console.warn(`Failed to play sound ${id}:`, error);
      });
    }
  }

  stop(id: string) {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('gameMuted', String(muted));
    
    // Stop all sounds if muted
    if (muted) {
      this.sounds.forEach(sound => {
        sound.pause();
        sound.currentTime = 0;
      });
    }
  }

  isSoundMuted() {
    return this.isMuted;
  }
}

// Create a singleton instance
const soundManager = new SoundManager();

// Preload common sounds
soundManager.loadSound('equipment', '/sounds/equipment-ambient.mp3');
soundManager.loadSound('rain', '/sounds/rain-ambient.mp3');
soundManager.loadSound('success', '/sounds/success.mp3');
soundManager.loadSound('click', '/sounds/click.mp3');

export const useSound = () => {
  const isMuted = useRef(soundManager.isSoundMuted());

  const playSound = (id: string, options: SoundOptions = {}) => {
    soundManager.play(id, options);
  };

  const stopSound = (id: string) => {
    soundManager.stop(id);
  };

  const toggleMute = () => {
    const newMutedState = !isMuted.current;
    soundManager.setMuted(newMutedState);
    isMuted.current = newMutedState;
  };

  return {
    playSound,
    stopSound,
    toggleMute,
    isMuted: isMuted.current
  };
}; 