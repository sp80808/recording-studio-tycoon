import { useCallback } from 'react';
import { useGameState } from './useGameState';
import { Band } from '@/types/bands';
import { StaffMember } from '@/types/game';

interface PerformanceRating {
  overall: number;
  technical: number;
  creativity: number;
  stagePresence: number;
  genreMatch: number;
}

interface GenreModifier {
  technicalWeight: number;
  creativityWeight: number;
  stagePresenceWeight: number;
}

const GENRE_MODIFIERS: Record<string, GenreModifier> = {
  Rock: {
    technicalWeight: 0.4,
    creativityWeight: 0.3,
    stagePresenceWeight: 0.3
  },
  Pop: {
    technicalWeight: 0.3,
    creativityWeight: 0.4,
    stagePresenceWeight: 0.3
  },
  'Hip Hop': {
    technicalWeight: 0.3,
    creativityWeight: 0.4,
    stagePresenceWeight: 0.3
  },
  Electronic: {
    technicalWeight: 0.5,
    creativityWeight: 0.4,
    stagePresenceWeight: 0.1
  },
  Jazz: {
    technicalWeight: 0.5,
    creativityWeight: 0.4,
    stagePresenceWeight: 0.1
  },
  Classical: {
    technicalWeight: 0.6,
    creativityWeight: 0.3,
    stagePresenceWeight: 0.1
  }
};

export const useBandPerformance = () => {
  const { gameState } = useGameState();

  const calculateMemberStats = useCallback((member: StaffMember) => {
    return {
      technical: member.primaryStats.technical,
      creativity: member.primaryStats.creativity,
      stagePresence: Math.floor((member.primaryStats.creativity + member.primaryStats.technical) / 2)
    };
  }, []);

  const calculateBandPerformance = useCallback((band: Band): PerformanceRating => {
    const members = band.memberIds
      .map((id: string) => gameState.hiredStaff.find((staff: StaffMember) => staff.id === id))
      .filter((member): member is StaffMember => member !== undefined);

    if (members.length === 0) {
      return {
        overall: 0,
        technical: 0,
        creativity: 0,
        stagePresence: 0,
        genreMatch: 0
      };
    }

    const memberStats = members.map(calculateMemberStats);
    const genreModifier = GENRE_MODIFIERS[band.genre] || GENRE_MODIFIERS.Rock;

    const technical = Math.floor(
      memberStats.reduce((sum: number, stats: { technical: number; creativity: number; stagePresence: number }) => sum + stats.technical, 0) / members.length
    );
    const creativity = Math.floor(
      memberStats.reduce((sum: number, stats: { technical: number; creativity: number; stagePresence: number }) => sum + stats.creativity, 0) / members.length
    );
    const stagePresence = Math.floor(
      memberStats.reduce((sum: number, stats: { technical: number; creativity: number; stagePresence: number }) => sum + stats.stagePresence, 0) / members.length
    );

    const genreMatch = Math.floor(
      technical * genreModifier.technicalWeight +
      creativity * genreModifier.creativityWeight +
      stagePresence * genreModifier.stagePresenceWeight
    );

    const overall = Math.floor(
      (technical + creativity + stagePresence + genreMatch) / 4
    );

    return {
      overall,
      technical,
      creativity,
      stagePresence,
      genreMatch
    };
  }, [gameState.hiredStaff, calculateMemberStats]);

  const getPerformanceFeedback = useCallback((rating: PerformanceRating): string[] => {
    const feedback: string[] = [];

    if (rating.overall >= 90) {
      feedback.push("Outstanding performance! The band is at the top of their game.");
    } else if (rating.overall >= 75) {
      feedback.push("Great performance! The band is performing very well.");
    } else if (rating.overall >= 60) {
      feedback.push("Good performance. There's room for improvement.");
    } else if (rating.overall >= 40) {
      feedback.push("Average performance. The band needs more practice.");
    } else {
      feedback.push("Poor performance. The band needs significant improvement.");
    }

    if (rating.technical >= 80) {
      feedback.push("Excellent technical execution.");
    } else if (rating.technical <= 40) {
      feedback.push("Technical skills need improvement.");
    }

    if (rating.creativity >= 80) {
      feedback.push("Highly creative and innovative.");
    } else if (rating.creativity <= 40) {
      feedback.push("Could use more creative expression.");
    }

    if (rating.stagePresence >= 80) {
      feedback.push("Strong stage presence and audience engagement.");
    } else if (rating.stagePresence <= 40) {
      feedback.push("Stage presence needs work.");
    }

    if (rating.genreMatch >= 80) {
      feedback.push("Perfect fit for their genre.");
    } else if (rating.genreMatch <= 40) {
      feedback.push("Consider exploring a different genre or style.");
    }

    return feedback;
  }, []);

  return {
    calculateBandPerformance,
    getPerformanceFeedback
  };
}; 