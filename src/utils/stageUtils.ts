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
}

export interface StageOptimalFocus {
  performance: number;
  soundCapture: number;
  layering: number;
  reasoning: string;
}

/**
 * Get stage-specific focus allocation labels and descriptions
 */
export const getStageFocusLabels = (stage: ProjectStage): StageFocusLabels => {
  const stageName = stage.stageName.toLowerCase();

  // Recording/Setup stages
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

  // Mixing stages
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

  // Mastering stages
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

  // Writing/Arrangement stages
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

  // Production stages
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

  // Default fallback
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
export const getStageOptimalFocus = (
  stage: ProjectStage,
  genre: string,
  staffSkills?: { creativity?: number; technical?: number; arrangement?: number } // More specific type for clarity
): StageOptimalFocus => {
  const stageName = stage.stageName.toLowerCase();

  // Base recommendations by stage type
  let baseFocus: FocusAllocation;
  let reasoning: string;
  const skillAdjustments = { performance: 1, soundCapture: 1, layering: 1 };

  // Apply staff skill adjustments if provided
  if (staffSkills) {
    // Performance boost from creative skills (e.g., average creativity of assigned staff)
    if (typeof staffSkills.creativity === 'number') {
      // Assuming skill level is 1-100, a 0.005 multiplier per point gives up to 50% bonus at 100 skill
      // Or if skill is average of staff primary stats (1-50), 0.01 multiplier per point.
      // Let's use a 0.5% boost per point, assuming skills are on a 1-100 scale for this aggregation.
      // If staff primaryStats (1-50) are averaged, this might be too low.
      // Let's assume the aggregated skill passed here is normalized or scaled appropriately.
      // For now, using the original 0.05, assuming staffSkills.creativity is a smaller number (e.g. 1-10).
      skillAdjustments.performance *= 1 + (staffSkills.creativity * 0.05);
    }

    // Sound capture boost from technical skills
    if (typeof staffSkills.technical === 'number') {
      skillAdjustments.soundCapture *= 1 + (staffSkills.technical * 0.05);
    }

    // Layering boost from arrangement skills
    if (typeof staffSkills.arrangement === 'number') {
      skillAdjustments.layering *= 1 + (staffSkills.arrangement * 0.05);
    }

    // Role-specific bonuses - Commented out due to type incompatibility with current staffSkills structure.
    // This would require staffSkills to include role information or be handled separately.
    // if (staffSkills.role === 'Engineer') {
    //   skillAdjustments.soundCapture *= 1.1;
    // } else if (staffSkills.role === 'Producer') {
    //   skillAdjustments.performance *= 1.1;
    // }
  }

  if (stageName.includes('setup') || stageName.includes('recording') || stageName.includes('tracking')) {
    baseFocus = { performance: 45, soundCapture: 40, layering: 15 };
    reasoning = 'Recording stages benefit from performance coaching and quality capture';
  } else if (stageName.includes('mixing') || stageName.includes('mix')) {
    baseFocus = { performance: 25, soundCapture: 35, layering: 40 };
    reasoning = 'Mixing requires balancing technical precision with spatial arrangement';
  } else if (stageName.includes('mastering') || stageName.includes('master')) {
    baseFocus = { performance: 20, soundCapture: 50, layering: 30 };
    reasoning = 'Mastering prioritizes technical excellence and final cohesion';
  } else if (stageName.includes('writing') || stageName.includes('arrangement')) {
    baseFocus = { performance: 50, soundCapture: 20, layering: 30 };
    reasoning = 'Creative stages benefit from inspiration and arrangement focus';
  } else if (stageName.includes('production') || stageName.includes('overdub')) {
    baseFocus = { performance: 35, soundCapture: 30, layering: 35 };
    reasoning = 'Production stages need balanced attention across all areas';
  } else {
    baseFocus = { performance: 35, soundCapture: 35, layering: 30 };
    reasoning = 'Balanced approach for general project work';
  }

  // Genre modifications
  const genreModifiers = getGenreModifiers(genre);
  
  return {
    performance: Math.round(baseFocus.performance * genreModifiers.performance * skillAdjustments.performance),
    soundCapture: Math.round(baseFocus.soundCapture * genreModifiers.soundCapture * skillAdjustments.soundCapture),
    layering: Math.round(baseFocus.layering * genreModifiers.layering * skillAdjustments.layering),
    reasoning: staffSkills 
      ? `${reasoning}. ${genreModifiers.reasoning} Adjusted for staff skills.`
      : `${reasoning}. ${genreModifiers.reasoning}`
  };
};

/**
 * Get genre-specific focus modifiers
 */
export const getGenreModifiers = (genre: string): { performance: number; soundCapture: number; layering: number; reasoning: string } => {
  switch (genre.toLowerCase()) {
    case 'rock':
      return {
        performance: 1.2,
        soundCapture: 1.0,
        layering: 0.9,
        reasoning: 'Rock emphasizes powerful performances'
      };
    case 'electronic':
      return {
        performance: 0.8,
        soundCapture: 0.9,
        layering: 1.3,
        reasoning: 'Electronic music relies heavily on layering and arrangement'
      };
    case 'acoustic':
    case 'folk':
      return {
        performance: 1.3,
        soundCapture: 1.1,
        layering: 0.7,
        reasoning: 'Acoustic music prioritizes natural performance and capture'
      };
    case 'jazz':
      return {
        performance: 1.4,
        soundCapture: 1.0,
        layering: 0.8,
        reasoning: 'Jazz values live performance energy and spontaneity'
      };
    case 'hip-hop':
      return {
        performance: 1.1,
        soundCapture: 0.9,
        layering: 1.2,
        reasoning: 'Hip-hop combines strong vocals with complex layering'
      };
    case 'classical':
      return {
        performance: 1.2,
        soundCapture: 1.2,
        layering: 0.8,
        reasoning: 'Classical music demands both performance excellence and pristine capture'
      };
    case 'soul':
    case 'r&b':
      return {
        performance: 1.3,
        soundCapture: 1.0,
        layering: 0.9,
        reasoning: 'Soul/R&B emphasizes emotional vocal performance'
      };
    default:
      return {
        performance: 1.0,
        soundCapture: 1.0,
        layering: 1.0,
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
  
  return recommendations;
};

/**
 * Calculate focus effectiveness for current stage
 */
export const calculateFocusEffectiveness = (
  currentFocus: FocusAllocation,
  optimalFocus: StageOptimalFocus
): { effectiveness: number; suggestions: string[] } => {
  // Calculate how close current focus is to optimal
  const performanceDiff = Math.abs(currentFocus.performance - optimalFocus.performance);
  const soundCaptureDiff = Math.abs(currentFocus.soundCapture - optimalFocus.soundCapture);
  const layeringDiff = Math.abs(currentFocus.layering - optimalFocus.layering);
  
  const totalDiff = performanceDiff + soundCaptureDiff + layeringDiff;
  const effectiveness = Math.max(0.5, 1 - (totalDiff / 200)); // 50% minimum effectiveness
  
  const suggestions: string[] = [];
  
  if (performanceDiff > 15) {
    suggestions.push(
      currentFocus.performance < optimalFocus.performance
        ? '🎭 Consider increasing Performance focus'
        : '🎭 Performance focus might be too high for this stage'
    );
  }
  
  if (soundCaptureDiff > 15) {
    suggestions.push(
      currentFocus.soundCapture < optimalFocus.soundCapture
        ? '🎤 Consider increasing Sound Capture focus'
        : '🎤 Sound Capture focus might be too high for this stage'
    );
  }
  
  if (layeringDiff > 15) {
    suggestions.push(
      currentFocus.layering < optimalFocus.layering
        ? '🎚️ Consider increasing Layering focus'
        : '🎚️ Layering focus might be too high for this stage'
    );
  }
  
  return { effectiveness, suggestions };
};
