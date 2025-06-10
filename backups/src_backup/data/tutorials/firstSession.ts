import { TutorialStep } from '@/types/tutorial';

export const firstSessionSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your Studio',
    description: 'Welcome to Recording Studio Tycoon! Let\'s get you started with the basics of running your recording studio.',
    trigger: {
      type: 'time',
      condition: 'onFirstLoad',
      priority: 1,
    },
    highlights: [
      {
        elementId: 'studio-overview',
        type: 'pulse',
      },
    ],
    completion: {
      type: 'action',
      condition: 'clickContinue',
    },
    nextSteps: ['basic-controls'],
  },
  {
    id: 'basic-controls',
    title: 'Basic Controls',
    description: 'Let\'s learn the basic controls for navigating your studio. Use WASD to move around and the mouse to interact with objects.',
    trigger: {
      type: 'state',
      condition: 'afterWelcome',
      priority: 2,
    },
    highlights: [
      {
        elementId: 'controls-hint',
        type: 'glow',
        position: 'bottom',
      },
    ],
    completion: {
      type: 'action',
      condition: 'movePlayer',
    },
    nextSteps: ['studio-equipment'],
    requirements: {
      completedSteps: ['welcome'],
    },
  },
  {
    id: 'studio-equipment',
    title: 'Studio Equipment',
    description: 'This is your recording equipment. Each piece has different quality levels and affects your recording outcomes.',
    trigger: {
      type: 'state',
      condition: 'nearEquipment',
      priority: 3,
    },
    highlights: [
      {
        elementId: 'recording-equipment',
        type: 'pulse',
      },
      {
        elementId: 'equipment-stats',
        type: 'glow',
        position: 'right',
      },
    ],
    completion: {
      type: 'action',
      condition: 'inspectEquipment',
    },
    nextSteps: ['first-session'],
    requirements: {
      completedSteps: ['basic-controls'],
    },
  },
  {
    id: 'first-session',
    title: 'Your First Session',
    description: 'Ready to start your first recording session? Click on the recording booth to begin.',
    trigger: {
      type: 'state',
      condition: 'equipmentInspected',
      priority: 4,
    },
    highlights: [
      {
        elementId: 'recording-booth',
        type: 'pulse',
      },
      {
        elementId: 'session-controls',
        type: 'glow',
        position: 'top',
      },
    ],
    completion: {
      type: 'action',
      condition: 'startSession',
    },
    nextSteps: ['session-controls'],
    requirements: {
      completedSteps: ['studio-equipment'],
    },
  },
  {
    id: 'session-controls',
    title: 'Session Controls',
    description: 'During a session, you can adjust various parameters to get the best recording quality. Try adjusting the input levels.',
    trigger: {
      type: 'state',
      condition: 'sessionStarted',
      priority: 5,
    },
    highlights: [
      {
        elementId: 'input-levels',
        type: 'pulse',
      },
      {
        elementId: 'quality-meter',
        type: 'glow',
        position: 'left',
      },
    ],
    completion: {
      type: 'action',
      condition: 'adjustLevels',
    },
    nextSteps: ['save-session'],
    requirements: {
      completedSteps: ['first-session'],
    },
  },
  {
    id: 'save-session',
    title: 'Saving Your Work',
    description: 'Great job! Now let\'s save your session. Click the save button to store your recording.',
    trigger: {
      type: 'state',
      condition: 'sessionComplete',
      priority: 6,
    },
    highlights: [
      {
        elementId: 'save-button',
        type: 'pulse',
      },
      {
        elementId: 'session-list',
        type: 'glow',
        position: 'right',
      },
    ],
    completion: {
      type: 'action',
      condition: 'saveSession',
    },
    nextSteps: ['tutorial-complete'],
    requirements: {
      completedSteps: ['session-controls'],
    },
  },
  {
    id: 'tutorial-complete',
    title: 'Tutorial Complete!',
    description: 'Congratulations! You\'ve completed the basic tutorial. You\'re now ready to start your journey as a studio owner!',
    trigger: {
      type: 'state',
      condition: 'sessionSaved',
      priority: 7,
    },
    highlights: [
      {
        elementId: 'main-menu',
        type: 'pulse',
      },
    ],
    completion: {
      type: 'action',
      condition: 'clickContinue',
    },
    nextSteps: [],
    requirements: {
      completedSteps: ['save-session'],
    },
  },
]; 