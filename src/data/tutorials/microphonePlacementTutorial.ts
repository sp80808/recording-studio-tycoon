import { Tutorial } from '@/types/tutorial';

export const microphonePlacementTutorial: Tutorial = {
  id: 'microphone-placement',
  name: 'Microphone Placement',
  description: 'Master the art of perfect mic placement!',
  requiredLevel: 1,
  steps: [
    {
      id: 'intro',
      title: 'Welcome to Mic Placement! 🎤',
      content: 'Ready to become a mic placement pro? Let\'s learn how to capture the perfect sound!',
      target: '.microphone-placement-container',
      position: 'center',
      interactive: true,
      action: {
        type: 'click',
        selector: '.scenario-select'
      },
      actionHint: 'Click to start your recording journey!',
      nextSteps: ['select-scenario']
    },
    {
      id: 'select-scenario',
      title: 'Pick Your Scene 🎸',
      content: 'Choose what you want to record - from acoustic guitars to booming drums!',
      target: '.scenario-select',
      position: 'bottom',
      interactive: true,
      action: {
        type: 'select',
        selector: '.scenario-select'
      },
      actionHint: 'Select your recording scenario!',
      nextSteps: ['mic-selection']
    },
    {
      id: 'mic-selection',
      title: 'Choose Your Mic 🎙️',
      content: 'Different mics for different sounds. Pick the perfect one for your recording!',
      target: '.mic-select',
      position: 'bottom',
      interactive: true,
      action: {
        type: 'select',
        selector: '.mic-select'
      },
      actionHint: 'Select your microphone!',
      nextSteps: ['placement']
    },
    {
      id: 'placement',
      title: 'Position Your Mic 📍',
      content: 'Drag your mic to the perfect spot. Distance and angle make all the difference!',
      target: '.mic-position',
      position: 'center',
      interactive: true,
      action: {
        type: 'drag',
        selector: '.mic-position'
      },
      actionHint: 'Click and drag to position your mic!',
      nextSteps: ['fine-tune']
    },
    {
      id: 'fine-tune',
      title: 'Fine-tune It! 🎛️',
      content: 'Use the sliders to perfect your mic placement. Every small adjustment counts!',
      target: '.distance-slider',
      position: 'right',
      interactive: true,
      action: {
        type: 'slide',
        selector: '.distance-slider'
      },
      actionHint: 'Adjust the sliders to get the perfect sound!',
      nextSteps: ['preview']
    },
    {
      id: 'preview',
      title: 'Listen Up! 🔊',
      content: 'Hear how your mic placement affects the sound. Make adjustments until it sounds just right!',
      target: '.preview-button',
      position: 'left',
      interactive: true,
      action: {
        type: 'click',
        selector: '.preview-button'
      },
      actionHint: 'Click to preview your recording!',
      nextSteps: ['submit']
    },
    {
      id: 'submit',
      title: 'Perfect Placement! 🎯',
      content: 'When you\'ve got the perfect sound, submit your placement to earn rewards!',
      target: '.submit-button',
      position: 'bottom',
      interactive: true,
      action: {
        type: 'click',
        selector: '.submit-button'
      },
      actionHint: 'Click to submit your perfect placement!',
      nextSteps: []
    }
  ]
};
