import { OrbConfig } from './types';

/**
 * Creates an animated orb element that travels from start to end coordinates
 */
export function createOrb(config: OrbConfig): void {
  // Get the orbs container
  const orbsContainer = document.getElementById('orbs-container');
  if (!orbsContainer) return;
  
  // Create the orb element
  const orb = document.createElement('div');
  orb.className = `orb ${config.type}-orb`;
  
  // Set initial position and size
  orb.style.left = `${config.startX}px`;
  orb.style.top = `${config.startY}px`;
  orb.style.width = `${config.size}px`;
  orb.style.height = `${config.size}px`;
  
  // Add to container
  orbsContainer.appendChild(orb);
  
  // Trigger animation (forces browser to recognize the element before transforming)
  setTimeout(() => {
    // Add transition for smooth animation
    orb.style.transition = `transform ${config.duration}ms ease-out, opacity ${config.duration}ms ease-out`;
    
    // Calculate transform to move to end position
    const translateX = config.endX - config.startX;
    const translateY = config.endY - config.startY;
    
    orb.style.transform = `translate(${translateX}px, ${translateY}px) scale(0.5)`;
    orb.style.opacity = '0';
    
    // Remove orb after animation completes
    setTimeout(() => {
      orb.remove();
    }, config.duration);
  }, 10);
}

/**
 * Creates a floating text animation (for showing points gained)
 */
export function createFloatingText(
  x: number, 
  y: number, 
  text: string, 
  color: string = 'white'
): void {
  // Get the orbs container (we'll reuse it for floating text)
  const orbsContainer = document.getElementById('orbs-container');
  if (!orbsContainer) return;
  
  // Create text element
  const textElement = document.createElement('div');
  textElement.style.position = 'absolute';
  textElement.style.left = `${x}px`;
  textElement.style.top = `${y}px`;
  textElement.style.color = color;
  textElement.style.fontWeight = 'bold';
  textElement.style.fontSize = '16px';
  textElement.style.pointerEvents = 'none';
  textElement.style.textShadow = '0 0 3px rgba(0, 0, 0, 0.5)';
  textElement.textContent = text;
  
  // Add to container
  orbsContainer.appendChild(textElement);
  
  // Animate upward and fade out
  setTimeout(() => {
    textElement.style.transition = 'transform 1s ease-out, opacity 1s ease-out';
    textElement.style.transform = 'translateY(-30px)';
    textElement.style.opacity = '0';
    
    // Remove after animation
    setTimeout(() => {
      textElement.remove();
    }, 1000);
  }, 10);
}

/**
 * Creates a pulsing highlight effect on an element
 */
export function createPulseEffect(element: HTMLElement, color: string = '#3a6ea5'): void {
  // Store original box shadow if any
  const originalBoxShadow = element.style.boxShadow;
  
  // Create keyframes animation
  const keyframes = [
    { boxShadow: `0 0 0 0 ${color}00` },
    { boxShadow: `0 0 0 10px ${color}40` },
    { boxShadow: `0 0 0 0 ${color}00` }
  ];
  
  // Start animation
  const animation = element.animate(keyframes, {
    duration: 1500,
    iterations: 2
  });
  
  // Reset to original state when done
  animation.onfinish = () => {
    element.style.boxShadow = originalBoxShadow;
  };
}

/**
 * Creates a shake animation for an element (e.g., when an action fails)
 */
export function createShakeEffect(element: HTMLElement): void {
  // Create keyframes animation
  const keyframes = [
    { transform: 'translateX(0)' },
    { transform: 'translateX(-5px)' },
    { transform: 'translateX(5px)' },
    { transform: 'translateX(-5px)' },
    { transform: 'translateX(5px)' },
    { transform: 'translateX(-5px)' },
    { transform: 'translateX(0)' }
  ];
  
  // Start animation
  element.animate(keyframes, {
    duration: 500,
    iterations: 1
  });
}