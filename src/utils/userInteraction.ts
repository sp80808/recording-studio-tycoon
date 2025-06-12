import { gameAudio } from './audioSystem';

let hasInteractedGlobal = false;

/**
 * Checks if the user has interacted with the document.
 * @returns {boolean} True if user has interacted, false otherwise.
 */
export const userHasInteracted = (): boolean => hasInteractedGlobal;

/**
 * To be called once on the first user interaction.
 * Sets the global interaction flag, attempts to resume audio contexts,
 * and dispatches a custom event.
 */
const onFirstUserInteraction = () => {
  if (hasInteractedGlobal) return;
  hasInteractedGlobal = true;

  console.log('User has interacted with the document for the first time.');

  // Attempt to resume the main AudioContext from audioSystem.ts
  // gameAudio.initialize() should have been called at app startup.
  // ensureInitialized will attempt to resume the context if suspended.
  if (gameAudio && typeof (gameAudio as any).ensureInitialized === 'function') {
    (gameAudio as any).ensureInitialized().then(() => {
       console.log('GameAudio context state checked/resumed on interaction.');
    }).catch((e: any) => console.warn("Error ensuring gameAudio is initialized on interaction:", e));
  } else {
    console.warn('gameAudio or gameAudio.ensureInitialized is not available for interaction handling.');
  }
  
  // Dispatch a custom event that other parts of the app can listen to
  // This is particularly useful for the useBackgroundMusic hook
  document.dispatchEvent(new CustomEvent('userInteracted'));

  // Clean up listeners to ensure this only runs once
  document.removeEventListener('click', onFirstUserInteraction, true);
  document.removeEventListener('keydown', onFirstUserInteraction, true);
  document.removeEventListener('mousedown', onFirstUserInteraction, true);
  document.removeEventListener('touchstart', onFirstUserInteraction, true);
};

/**
 * Initializes a one-time event listener for the first user interaction.
 * This should be called once when the application starts.
 */
export const initInteractionListener = () => {
  // Ensure this setup runs only once
  if (typeof window !== 'undefined' && !(window as any).__interactionListenerSetupDone) {
    // Listen for various interaction events, once.
    // Using `capture: true` to catch the event early.
    document.addEventListener('click', onFirstUserInteraction, { once: true, capture: true });
    document.addEventListener('keydown', onFirstUserInteraction, { once: true, capture: true });
    document.addEventListener('mousedown', onFirstUserInteraction, { once: true, capture: true });
    document.addEventListener('touchstart', onFirstUserInteraction, { once: true, capture: true });
    (window as any).__interactionListenerSetupDone = true;
    console.log('User interaction listeners initialized.');
  }
};
