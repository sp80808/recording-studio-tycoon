import { Tutorial } from '@/types/tutorial';

// Analog Era Tutorial (1950s-1970s)
export const analogEraTutorial: Tutorial = {
  id: 'analog-era',
  name: 'Welcome to the Analog Era',
  description: 'Master the art of analog recording in the golden age of music production!',
  requiredLevel: 1,
  steps: [
    {
      id: 'analog-intro',
      title: 'Welcome to the Analog Era! 🎵',
      content: 'Welcome to the golden age of analog recording! Here, every sound is captured through physical equipment, creating that warm, classic sound we all love.',
      target: '.studio-overview',
      position: 'center',
      interactive: true,
      action: {
        type: 'click',
        selector: '.continue-button'
      },
      actionHint: 'Click to begin your analog journey!',
      nextSteps: ['analog-equipment']
    },
    {
      id: 'analog-equipment',
      title: 'Your Analog Equipment 🎛️',
      content: 'Meet your analog gear: tape machines, mixing consoles, and outboard gear. Each piece adds its own character to your recordings.',
      target: '.equipment-rack',
      position: 'right',
      interactive: true,
      action: {
        type: 'click',
        selector: '.equipment-rack'
      },
      actionHint: 'Click to explore your equipment!',
      nextSteps: ['tape-basics']
    },
    {
      id: 'tape-basics',
      title: 'Tape Machine Basics 🎥',
      content: 'The tape machine is your canvas. Learn to use it properly to capture that warm, analog sound.',
      target: '.tape-machine',
      position: 'left',
      interactive: true,
      action: {
        type: 'click',
        selector: '.tape-machine'
      },
      actionHint: 'Click to learn about tape recording!',
      nextSteps: ['analog-mixing']
    },
    {
      id: 'analog-mixing',
      title: 'Analog Mixing Console 🎚️',
      content: 'Your mixing console is where the magic happens. Each knob and fader shapes your sound in real-time.',
      target: '.mixing-console',
      position: 'center',
      interactive: true,
      action: {
        type: 'click',
        selector: '.mixing-console'
      },
      actionHint: 'Click to explore the mixing console!',
      nextSteps: ['outboard-gear']
    },
    {
      id: 'outboard-gear',
      title: 'Outboard Gear Magic 🎛️',
      content: 'Compressors, EQs, and effects units - these are your tools for shaping sound. Each adds its own character.',
      target: '.outboard-rack',
      position: 'right',
      interactive: true,
      action: {
        type: 'click',
        selector: '.outboard-rack'
      },
      actionHint: 'Click to learn about outboard gear!',
      nextSteps: []
    }
  ]
};

// Digital Era Tutorial (1980s-1990s)
export const digitalEraTutorial: Tutorial = {
  id: 'digital-era',
  name: 'Welcome to the Digital Era',
  description: 'Enter the world of digital recording and MIDI!',
  requiredLevel: 5,
  steps: [
    {
      id: 'digital-intro',
      title: 'Welcome to the Digital Era! 💾',
      content: 'Welcome to the digital revolution! Now you can record, edit, and mix with precision using computers and digital equipment.',
      target: '.studio-overview',
      position: 'center',
      interactive: true,
      action: {
        type: 'click',
        selector: '.continue-button'
      },
      actionHint: 'Click to begin your digital journey!',
      nextSteps: ['digital-equipment']
    },
    {
      id: 'digital-equipment',
      title: 'Digital Equipment 🖥️',
      content: 'Meet your digital gear: DAWs, digital mixers, and MIDI controllers. Precision and flexibility are now at your fingertips.',
      target: '.digital-rack',
      position: 'right',
      interactive: true,
      action: {
        type: 'click',
        selector: '.digital-rack'
      },
      actionHint: 'Click to explore your digital equipment!',
      nextSteps: ['daw-basics']
    },
    {
      id: 'daw-basics',
      title: 'DAW Basics 🎹',
      content: 'Your Digital Audio Workstation is your command center. Learn to navigate and use its powerful features.',
      target: '.daw-interface',
      position: 'center',
      interactive: true,
      action: {
        type: 'click',
        selector: '.daw-interface'
      },
      actionHint: 'Click to learn about your DAW!',
      nextSteps: ['midi-intro']
    },
    {
      id: 'midi-intro',
      title: 'MIDI Magic 🎹',
      content: 'MIDI lets you control virtual instruments and record performances with perfect timing.',
      target: '.midi-controller',
      position: 'left',
      interactive: true,
      action: {
        type: 'click',
        selector: '.midi-controller'
      },
      actionHint: 'Click to learn about MIDI!',
      nextSteps: ['digital-mixing']
    },
    {
      id: 'digital-mixing',
      title: 'Digital Mixing 🎚️',
      content: 'Digital mixing gives you precise control and automation. Create perfect mixes with ease.',
      target: '.digital-mixer',
      position: 'right',
      interactive: true,
      action: {
        type: 'click',
        selector: '.digital-mixer'
      },
      actionHint: 'Click to learn about digital mixing!',
      nextSteps: []
    }
  ]
};

// Internet Era Tutorial (2000s)
export const internetEraTutorial: Tutorial = {
  id: 'internet-era',
  name: 'Welcome to the Internet Era',
  description: 'Master online distribution and digital collaboration!',
  requiredLevel: 10,
  steps: [
    {
      id: 'internet-intro',
      title: 'Welcome to the Internet Era! 🌐',
      content: 'Welcome to the age of online music! Now you can distribute your music worldwide and collaborate with artists globally.',
      target: '.studio-overview',
      position: 'center',
      interactive: true,
      action: {
        type: 'click',
        selector: '.continue-button'
      },
      actionHint: 'Click to begin your internet journey!',
      nextSteps: ['online-distribution']
    },
    {
      id: 'online-distribution',
      title: 'Online Distribution 📱',
      content: 'Learn to distribute your music through digital platforms and reach listeners worldwide.',
      target: '.distribution-panel',
      position: 'right',
      interactive: true,
      action: {
        type: 'click',
        selector: '.distribution-panel'
      },
      actionHint: 'Click to learn about online distribution!',
      nextSteps: ['digital-collaboration']
    },
    {
      id: 'digital-collaboration',
      title: 'Digital Collaboration 👥',
      content: 'Work with artists and producers from anywhere in the world using cloud collaboration tools.',
      target: '.collaboration-tools',
      position: 'left',
      interactive: true,
      action: {
        type: 'click',
        selector: '.collaboration-tools'
      },
      actionHint: 'Click to learn about digital collaboration!',
      nextSteps: ['social-media']
    },
    {
      id: 'social-media',
      title: 'Social Media Promotion 📱',
      content: 'Use social media to promote your music and build your fanbase.',
      target: '.social-media-panel',
      position: 'center',
      interactive: true,
      action: {
        type: 'click',
        selector: '.social-media-panel'
      },
      actionHint: 'Click to learn about social media promotion!',
      nextSteps: []
    }
  ]
};

// Modern Era Tutorial (2010s-Present)
export const modernEraTutorial: Tutorial = {
  id: 'modern-era',
  name: 'Welcome to the Modern Era',
  description: 'Master streaming, AI tools, and modern production techniques!',
  requiredLevel: 15,
  steps: [
    {
      id: 'modern-intro',
      title: 'Welcome to the Modern Era! 🚀',
      content: 'Welcome to the future of music production! AI tools, streaming platforms, and advanced production techniques await.',
      target: '.studio-overview',
      position: 'center',
      interactive: true,
      action: {
        type: 'click',
        selector: '.continue-button'
      },
      actionHint: 'Click to begin your modern journey!',
      nextSteps: ['ai-tools']
    },
    {
      id: 'ai-tools',
      title: 'AI Production Tools 🤖',
      content: 'Discover how AI can enhance your production process, from mixing to mastering.',
      target: '.ai-tools-panel',
      position: 'right',
      interactive: true,
      action: {
        type: 'click',
        selector: '.ai-tools-panel'
      },
      actionHint: 'Click to learn about AI tools!',
      nextSteps: ['streaming-optimization']
    },
    {
      id: 'streaming-optimization',
      title: 'Streaming Optimization 📊',
      content: 'Learn to optimize your music for streaming platforms and reach more listeners.',
      target: '.streaming-panel',
      position: 'left',
      interactive: true,
      action: {
        type: 'click',
        selector: '.streaming-panel'
      },
      actionHint: 'Click to learn about streaming optimization!',
      nextSteps: ['modern-mastering']
    },
    {
      id: 'modern-mastering',
      title: 'Modern Mastering 🎚️',
      content: 'Master the latest mastering techniques for the streaming age.',
      target: '.mastering-panel',
      position: 'center',
      interactive: true,
      action: {
        type: 'click',
        selector: '.mastering-panel'
      },
      actionHint: 'Click to learn about modern mastering!',
      nextSteps: []
    }
  ]
}; 