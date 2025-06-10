import { Tutorial } from '@/types/tutorial';

export const eqMatchingTutorial: Tutorial = {
  id: 'eq-matching',
  name: 'EQ Matching',
  description: 'Shape sound like a pro with EQ!',
  requiredLevel: 11,
  steps: [
    {
      id: 'intro',
      title: 'Welcome to EQ Matching! 🎚️',
      content: 'Ready to become an EQ master? Let\'s learn how to shape sound like a pro!',
      target: '.eq-matching-container',
      position: 'center',
      interactive: true,
      action: {
        type: 'click',
        selector: '.target-select'
      },
      actionHint: 'Click to start your EQ journey!',
      nextSteps: ['select-target']
    },
    {
      id: 'select-target',
      title: 'Pick Your Sound 🎯',
      content: 'Choose a sound to match. From warm pads to punchy kicks, each has its own character!',
      target: '.target-select',
      position: 'bottom',
      interactive: true,
      action: {
        type: 'select',
        selector: '.target-select'
      },
      actionHint: 'Select a sound to work with!',
      nextSteps: ['add-band']
    },
    {
      id: 'add-band',
      title: 'Add Some Bands! 🎛️',
      content: 'Time to add EQ bands! Each band helps you shape a different part of the sound.',
      target: '.add-band-button',
      position: 'right',
      interactive: true,
      action: {
        type: 'click',
        selector: '.add-band-button'
      },
      actionHint: 'Click to add your first EQ band!',
      nextSteps: ['band-type']
    },
    {
      id: 'band-type',
      title: 'Choose Your Band 🎨',
      content: 'Pick the right band type: Peak (boost/cut), Notch (remove), or Shelf (smooth).',
      target: '.band-type-select',
      position: 'bottom',
      interactive: true,
      action: {
        type: 'select',
        selector: '.band-type-select'
      },
      actionHint: 'Select a band type that fits your needs!',
      nextSteps: ['adjust']
    },
    {
      id: 'adjust',
      title: 'Shape Your Sound 🎵',
      content: 'Use the sliders to fine-tune your EQ. Find that sweet spot!',
      target: '.frequency-slider',
      position: 'right',
      interactive: true,
      action: {
        type: 'slide',
        selector: '.frequency-slider'
      },
      actionHint: 'Move the sliders to shape your sound!',
      nextSteps: ['visualizer']
    },
    {
      id: 'visualizer',
      title: 'See the Changes! 📊',
      content: 'Watch your EQ curve take shape. The visualizer shows how your adjustments affect the sound.',
      target: '.eq-visualizer',
      position: 'top',
      interactive: false,
      nextSteps: ['submit']
    },
    {
      id: 'submit',
      title: 'Perfect Match! 🎯',
      content: 'When your sound matches the target, submit it to earn rewards!',
      target: '.submit-button',
      position: 'bottom',
      interactive: true,
      action: {
        type: 'click',
        selector: '.submit-button'
      },
      actionHint: 'Click to submit your perfect match!',
      nextSteps: []
    }
  ]
};
