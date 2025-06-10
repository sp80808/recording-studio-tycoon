interface SoundCache {
  [key: string]: HTMLAudioElement;
}

const audioCache: SoundCache = {};
let isMuted = false; // Global mute state

/**
 * Plays a sound effect.
 * Manages a cache of audio elements to avoid re-creating them.
 * Assumes sound files are in public/audio/
 *
 * @param soundName - The name of the sound file (e.g., 'click.mp3').
 * @param volume - The volume to play the sound at (0.0 to 1.0). Default is 0.7.
 */
export const playSound = (soundName: string, volume: number = 0.7): void => {
  if (isMuted) return;

  try {
    let audio = audioCache[soundName];
    if (!audio) {
      audio = new Audio(`/audio/${soundName}`);
      audioCache[soundName] = audio;
    }

    audio.currentTime = 0; // Rewind to start if already playing
    audio.volume = Math.max(0, Math.min(1, volume)); // Clamp volume
    
    audio.play().catch(error => {
      // Autoplay was prevented, common in browsers until user interaction
      // Or the sound file might be missing
      console.warn(`Could not play sound "${soundName}":`, error.message);
      // Optionally, remove from cache if it's likely a missing file error
      // if (error.name === 'NotSupportedError' || error.name === 'NotFoundError') {
      //   delete audioCache[soundName];
      // }
    });
  } catch (error) {
    console.error(`Error playing sound "${soundName}":`, error);
  }
};

/**
 * Toggles the global mute state for sound effects.
 * @returns The new mute state (true if muted, false if unmuted).
 */
export const toggleMuteSounds = (): boolean => {
  isMuted = !isMuted;
  console.log(`Sounds ${isMuted ? 'muted' : 'unmuted'}`);
  // If unmuting and sounds were playing but paused due to mute, this won't auto-resume them.
  // This primarily prevents new sounds from playing.
  return isMuted;
};

/**
 * Gets the current global mute state.
 * @returns True if sounds are muted, false otherwise.
 */
export const getMuteState = (): boolean => {
  return isMuted;
};

/**
 * Preloads a sound or multiple sounds into the cache.
 * @param soundNames - A single sound name or an array of sound names.
 */
export const preloadSounds = (soundNames: string | string[]): void => {
  const soundsToLoad = Array.isArray(soundNames) ? soundNames : [soundNames];
  soundsToLoad.forEach(soundName => {
    if (!audioCache[soundName]) {
      try {
        const audio = new Audio(`/audio/${soundName}`);
        // Setting a very low volume and pausing immediately can sometimes help cache it
        // without actually playing it, but browser behavior varies.
        audio.volume = 0.01;
        audio.pause(); 
        audioCache[soundName] = audio;
        console.log(`Preloaded sound: ${soundName}`);
      } catch (error) {
        console.warn(`Could not preload sound "${soundName}":`, error);
      }
    }
  });
};
