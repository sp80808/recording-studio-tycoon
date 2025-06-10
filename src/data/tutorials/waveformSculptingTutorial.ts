import { Tutorial } from '@/types/tutorial';

export const waveformSculptingTutorial: Tutorial = {
  id: 'waveform-sculpting',
  name: 'Waveform Sculpting',
  description: 'Create amazing sounds by combining waveforms!',
  requiredLevel: 11,
  steps: [
    {
      id: 'intro',
      title: 'Welcome to Waveform Sculpting! 🎵',
      content: 'Ready to create some awesome sounds? Let\'s combine different waveforms to make unique audio magic!',
      target: '.waveform-sculpting-container',
      position: 'center',
      interactive: true,
      action: {
        type: 'click',
        selector: '.target-select'
      },
      actionHint: 'Click the target selector to start your sound design journey!',
      nextSteps: ['select-target']
    },
    {
      id: 'select-target',
      title: 'Pick Your Sound 🎯',
      content: 'Choose a sound to recreate. Each one has its own personality - from warm pads to growling basses!',
      target: '.target-select',
      position: 'bottom',
      interactive: true,
      action: {
        type: 'select',
        selector: '.target-select'
      },
      actionHint: 'Select a sound that speaks to you!',
      nextSteps: ['add-layer']
    },
    {
      id: 'add-layer',
      title: 'Layer Up! 🎨',
      content: 'Time to add some layers! Mix different waveforms to create your unique sound.',
      target: '.add-layer-button',
      position: 'right',
      interactive: true,
      action: {
        type: 'click',
        selector: '.add-layer-button'
      },
      actionHint: 'Click to add your first layer!',
      nextSteps: ['waveform-types']
    },
    {
      id: 'waveform-types',
      title: 'Choose Your Wave 🌊',
      content: 'Each waveform has its own character: Sine (smooth), Square (harsh), Saw (bright), Triangle (warm)',
      target: '.waveform-type-select',
      position: 'bottom',
      interactive: true,
      action: {
        type: 'select',
        selector: '.waveform-type-select'
      },
      actionHint: 'Pick a waveform that matches your vibe!',
      nextSteps: ['controls']
    },
    {
      id: 'controls',
      title: 'Shape Your Sound 🎛️',
      content: 'Use the sliders to fine-tune your sound. Mix and match until it\'s perfect!',
      target: '.frequency-slider',
      position: 'right',
      interactive: true,
      action: {
        type: 'slide',
        selector: '.frequency-slider'
      },
      actionHint: 'Try moving the sliders to hear the changes!',
      nextSteps: ['visualizer']
    },
    {
      id: 'visualizer',
      title: 'Watch It Come Alive! 📊',
      content: 'See your sound take shape in real-time. The visualizer shows how your layers interact.',
      target: '.waveform-visualizer',
      position: 'top',
      interactive: false,
      nextSteps: ['submit']
    },
    {
      id: 'submit',
      title: 'Ready to Rock! 🚀',
      content: 'When you\'re happy with your sound, submit it to earn rewards and XP!',
      target: '.submit-button',
      position: 'bottom',
      interactive: true,
      action: {
        type: 'click',
        selector: '.submit-button'
      },
      actionHint: 'Click to share your creation!',
      nextSteps: []
    }
  ]
};
