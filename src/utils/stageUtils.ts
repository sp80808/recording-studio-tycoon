// Stage-specific focus allocation utilities
import { ProjectStage, FocusAllocation } from '@/types/game';

export interface StageFocusLabels {
  performance: {
    label: string;
    description: string;
    impact: string;
  };
  soundCapture: {
    label: string;
    description: string;
    impact: string;
  };
  layering: {
    label: string;
    description: string;
    impact: string;
  };
  // Optional: Add labels for creativity, technical, business if they are directly settable by sliders
}

export interface StageOptimalFocus extends FocusAllocation { // Extend FocusAllocation
  reasoning: string;
}

/**
 * Get stage-specific focus allocation labels and descriptions
 */
export const getStageFocusLabels = (stage: ProjectStage): StageFocusLabels => {
  const stageName = stage.stageName.toLowerCase();

  if (stageName.includes('setup') || stageName.includes('recording') || stageName.includes('tracking')) {
    return {
      performance: {
        label: '🎭 Performance Energy',
        description: 'Artist coaching and performance optimization',
        impact: 'Better takes, fewer retakes, natural feel'
      },
      soundCapture: {
        label: '🎤 Recording Quality',
        description: 'Microphone placement and signal chain',
        impact: 'Cleaner recordings, professional sound'
      },
      layering: {
        label: '🎚️ Take Management', 
        description: 'Multiple takes and comp organization',
        impact: 'Organized sessions, efficient workflow'
      }
    };
  }

  if (stageName.includes('mixing') || stageName.includes('mix')) {
    return {
      performance: {
        label: '🎭 Musical Balance',
        description: 'Preserving the musical intent and energy',
        impact: 'Maintains groove and emotional impact'
      },
      soundCapture: {
        label: '🎛️ Technical Precision',
        description: 'EQ, compression, and processing accuracy',
        impact: 'Professional polish and clarity'
      },
      layering: {
        label: '🎚️ Mix Architecture',
        description: 'Spatial placement and frequency balance',
        impact: 'Wide, dimensional, cohesive mix'
      }
    };
  }

  if (stageName.includes('mastering') || stageName.includes('master')) {
    return {
      performance: {
        label: '🎭 Sonic Character',
        description: 'Enhancing the musical personality',
        impact: 'Distinctive sound and vibe'
      },
      soundCapture: {
        label: '🔊 Final Polish',
        description: 'Loudness, dynamics, and format prep',
        impact: 'Ready for release across all platforms'
      },
      layering: {
        label: '🎚️ Cohesion',
        description: 'Gluing elements into unified whole',
        impact: 'Professional, radio-ready sound'
      }
    };
  }

  if (stageName.includes('writing') || stageName.includes('arrangement') || stageName.includes('composition')) {
    return {
      performance: {
        label: '🎭 Creative Flow',
        description: 'Inspiration and artistic expression',
        impact: 'Memorable melodies and engaging parts'
      },
      soundCapture: {
        label: '🎼 Demo Quality',
        description: 'Clear reference recordings for ideas',
        impact: 'Better communication of concepts'
      },
      layering: {
        label: '🎚️ Arrangement',
        description: 'Instrument parts and song structure',
        impact: 'Rich, interesting musical textures'
      }
    };
  }

  if (stageName.includes('production') || stageName.includes('overdub') || stageName.includes('layering')) {
    return {
      performance: {
        label: '🎭 Part Performance',
        description: 'Individual instrument and vocal quality',
        impact: 'Expressive, musical performances'
      },
      soundCapture: {
        label: '🎤 Layer Quality',
        description: 'Each element recorded cleanly',
        impact: 'Clean separation and processing headroom'
      },
      layering: {
        label: '🎚️ Sonic Landscape',
        description: 'How all parts work together',
        impact: 'Rich, full arrangements'
      }
    };
  }

  return {
    performance: {
      label: '🎭 Performance',
      description: 'Musical expression and artist direction',
      impact: 'Better musical results and artist satisfaction'
    },
    soundCapture: {
      label: '🎤 Sound Capture',
      description: 'Technical recording quality',
      impact: 'Professional, clean recordings'
    },
    layering: {
      label: '🎚️ Layering',
      description: 'Multi-track organization and arrangement',
      impact: 'Rich, well-organized productions'
    }
  };
};

/**
 * Get optimal focus allocation for a specific stage
 */
export const getStageOptimalFocus = (stage: ProjectStage, genre: string): StageOptimalFocus => {
  const stageName = stage.stageName.toLowerCase();
  
  let baseFocus: FocusAllocation; // This type includes creativity, technical, business
  let reasoning: string;

  // Default values for creativity, technical, business if not stage-specific
  const defaultCTB = { creativity: 33, technical: 33, business: 34 };


  if (stageName.includes('setup') || stageName.includes('recording') || stageName.includes('tracking')) {
    baseFocus = { performance: 45, soundCapture: 40, layering: 15, ...defaultCTB };
    reasoning = 'Recording stages benefit from performance coaching and quality capture';
  } else if (stageName.includes('mixing') || stageName.includes('mix')) {
    baseFocus = { performance: 25, soundCapture: 35, layering: 40, ...defaultCTB };
    reasoning = 'Mixing requires balancing technical precision with spatial arrangement';
  } else if (stageName.includes('mastering') || stageName.includes('master')) {
    baseFocus = { performance: 20, soundCapture: 50, layering: 30, ...defaultCTB };
    reasoning = 'Mastering prioritizes technical excellence and final cohesion';
  } else if (stageName.includes('writing') || stageName.includes('arrangement')) {
    baseFocus = { performance: 50, soundCapture: 20, layering: 30, creativity: 40, technical: 30, business: 30 }; // Example with specific CTB
    reasoning = 'Creative stages benefit from inspiration and arrangement focus';
  } else if (stageName.includes('production') || stageName.includes('overdub')) {
    baseFocus = { performance: 35, soundCapture: 30, layering: 35, ...defaultCTB };
    reasoning = 'Production stages need balanced attention across all areas';
  } else {
    baseFocus = { performance: 35, soundCapture: 35, layering: 30, ...defaultCTB };
    reasoning = 'Balanced approach for general project work';
  }

  const genreModifiers = getGenreModifiers(genre);
  
  return {
    performance: Math.round(baseFocus.performance * genreModifiers.performance),
    soundCapture: Math.round(baseFocus.soundCapture * genreModifiers.soundCapture),
    layering: Math.round(baseFocus.layering * genreModifiers.layering),
    creativity: Math.round(baseFocus.creativity * (genreModifiers.creativity || 1.0)), // Add CTB modifiers if they exist
    technical: Math.round(baseFocus.technical * (genreModifiers.technical || 1.0)),
    business: Math.round(baseFocus.business * (genreModifiers.business || 1.0)),
    reasoning: `${reasoning}. ${genreModifiers.reasoning}`
  };
};

/**
 * Get genre-specific focus modifiers
 */
// Update GenreModifiers to potentially include creativity, technical, business
interface GenreFocusModifiers {
  performance: number;
  soundCapture: number;
  layering: number;
  creativity?: number;
  technical?: number;
  business?: number;
  reasoning: string;
}

export const getGenreModifiers = (genre: string): GenreFocusModifiers => {
  switch (genre.toLowerCase()) {
    case 'rock':
      return {
        performance: 1.2, soundCapture: 1.0, layering: 0.9,
        reasoning: 'Rock emphasizes powerful performances'
      };
    case 'electronic':
      return {
        performance: 0.8, soundCapture: 0.9, layering: 1.3,
        creativity: 1.1, technical: 1.1, // Example
        reasoning: 'Electronic music relies heavily on layering and arrangement'
      };
    case 'acoustic':
    case 'folk':
      return {
        performance: 1.3, soundCapture: 1.1, layering: 0.7,
        reasoning: 'Acoustic music prioritizes natural performance and capture'
      };
    // Add other cases with full FocusAllocation fields
    default:
      return {
        performance: 1.0, soundCapture: 1.0, layering: 1.0,
        creativity: 1.0, technical: 1.0, business: 1.0,
        reasoning: 'Balanced approach works well for this genre'
      };
  }
};

/**
 * Get focus area recommendations based on stage focus areas
 */
export const getStageFocusRecommendations = (stage: ProjectStage): string[] => {
  const recommendations: string[] = [];
  
  if (stage.focusAreas.includes('performance')) {
    recommendations.push('Consider higher Performance focus for this stage');
  }
  if (stage.focusAreas.includes('soundCapture')) {
    recommendations.push('Sound Capture is crucial for this stage');
  }
  if (stage.focusAreas.includes('layering')) {
    recommendations.push('Layering will have significant impact here');
  }
  // Add recommendations for creativity, technical, business if applicable
  
  return recommendations;
};

/**
 * Calculate focus effectiveness for current stage
 */
export const calculateFocusEffectiveness = (
  currentFocus: FocusAllocation,
  optimalFocus: StageOptimalFocus // StageOptimalFocus now extends FocusAllocation
): { effectiveness: number; suggestions: string[] } => {
  const performanceDiff = Math.abs(currentFocus.performance - optimalFocus.performance);
  const soundCaptureDiff = Math.abs(currentFocus.soundCapture - optimalFocus.soundCapture);
  const layeringDiff = Math.abs(currentFocus.layering - optimalFocus.layering);
  const creativityDiff = Math.abs(currentFocus.creativity - optimalFocus.creativity);
  const technicalDiff = Math.abs(currentFocus.technical - optimalFocus.technical);
  const businessDiff = Math.abs(currentFocus.business - optimalFocus.business);
  
  // Adjust totalDiff calculation based on the number of fields in FocusAllocation (now 6)
  const totalDiff = performanceDiff + soundCaptureDiff + layeringDiff + creativityDiff + technicalDiff + businessDiff;
  // Max possible diff is 6 * 100 = 600. Normalizing factor might need adjustment.
  // Let's assume a max relevant diff sum of 300 for 100% ineffectiveness (0.0 effectiveness)
  // Or, if 100% deviation in all 3 primary sliders (perf, sound, layer) means 0.5 effectiveness,
  // then totalDiff / (3 * 100) * 0.5.
  // For 6 sliders, if totalDiff is 300 (avg 50 diff per slider), effectiveness is 0.
  // If totalDiff is 0, effectiveness is 1.
  // Max totalDiff is 600.
  // Let's scale it so that an average deviation of 25 per slider (total 150) gives ~0.5 effectiveness.
  // 1 - (totalDiff / (numSliders * maxSliderValue))
  // 1 - (totalDiff / 600) -> if totalDiff = 300, eff = 0.5. If totalDiff = 0, eff = 1. If totalDiff = 600, eff = 0.
  // Let's keep the 0.5 minimum:
  const effectiveness = Math.max(0.3, 1 - (totalDiff / (6 * 100))); 
  
  const suggestions: string[] = [];
  
  if (performanceDiff > 15) {
    suggestions.push(
      currentFocus.performance < optimalFocus.performance
        ? '🎭 Consider increasing Performance focus'
        : '🎭 Performance focus might be too high'
    );
  }
  if (soundCaptureDiff > 15) {
    suggestions.push(
      currentFocus.soundCapture < optimalFocus.soundCapture
        ? '🎤 Consider increasing Sound Capture focus'
        : '🎤 Sound Capture focus might be too high'
    );
  }
  if (layeringDiff > 15) {
    suggestions.push(
      currentFocus.layering < optimalFocus.layering
        ? '🎚️ Consider increasing Layering focus'
        : '🎚️ Layering focus might be too high'
    );
  }
  if (creativityDiff > 15) {
    suggestions.push(
      currentFocus.creativity < optimalFocus.creativity
        ? '🎨 Consider increasing Creativity focus'
        : '🎨 Creativity focus might be too high'
    );
  }
  if (technicalDiff > 15) {
    suggestions.push(
      currentFocus.technical < optimalFocus.technical
        ? '⚙️ Consider increasing Technical focus'
        : '⚙️ Technical focus might be too high'
    );
  }
  if (businessDiff > 15) {
    suggestions.push(
      currentFocus.business < optimalFocus.business
        ? '💼 Consider increasing Business focus'
        : '💼 Business focus might be too high'
    );
  }
  
  return { effectiveness, suggestions };
};
