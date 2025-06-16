import { EntityId, ProjectId, SkillId } from './common.types';
import { StudioPerk } from './studio-perks'; // For studio-wide effects on mood

export type StaffId = EntityId;

export enum StaffMoodStatus {
  ECSTATIC = 'Ecstatic',
  HAPPY = 'Happy',
  CONTENT = 'Content',
  NEUTRAL = 'Neutral',
  STRESSED = 'Stressed',
  UNHAPPY = 'Unhappy',
  MISERABLE = 'Miserable',
  BURNOUT_RISK = 'Burnout Risk',
}

// Assuming a base StaffMember interface exists. This extends it.
export interface StaffMemberWellbeing {
  id: StaffId;
  name: string; // Assuming name is part of base StaffMember
  moodScore: number; // 0-100, underlying numeric value for mood
  currentMood: StaffMoodStatus;
  burnoutLevel: number; // 0-100
  // Factors influencing current mood - useful for UI tooltips
  moodFactors: Array<{ description: string; impact: number; source: string }>; 
  // Example: { description: "Successful Project Alpha", impact: 10, source: "Project" }
  // Example: { description: "Low Salary", impact: -5, source: "Salary" }
  // Example: { description: "Comfortable Studio Perk", impact: 5, source: "Perk" }
  
  // Relevant staff attributes (simplified, assuming these are part of a core StaffMember type)
  skills?: Map<SkillId, number>; 
  experience?: number;
  salary?: number;
  assignedProjects?: ProjectId[];
  isTakingLeave?: boolean;
  leaveDaysRemaining?: number;
}

export interface MoodModifier {
  factor: string; // e.g., "ProjectSuccess", "Overtime", "LowSalary", "StudioPerk_Lounge"
  change: number; // Positive or negative change to moodScore
  duration?: number; // How many game ticks/days this modifier lasts, if temporary
  isCritical?: boolean; // If this modifier can directly trigger a mood status change
}

const MOOD_THRESHOLDS: Record<StaffMoodStatus, { min: number, max: number }> = {
    [StaffMoodStatus.ECSTATIC]: { min: 90, max: 100 },
    [StaffMoodStatus.HAPPY]: { min: 75, max: 89 },
    [StaffMoodStatus.CONTENT]: { min: 60, max: 74 },
    [StaffMoodStatus.NEUTRAL]: { min: 40, max: 59 },
    [StaffMoodStatus.STRESSED]: { min: 25, max: 39 },
    [StaffMoodStatus.UNHAPPY]: { min: 10, max: 24 },
    [StaffMoodStatus.MISERABLE]: { min: 0, max: 9 },
    [StaffMoodStatus.BURNOUT_RISK]: { min: 0, max: 25 }, // This is more of a flag when burnout is high
};

const BURNOUT_THRESHOLD_HIGH = 70;
const BURNOUT_THRESHOLD_CRITICAL = 90;

/**
 * StaffWellbeingService: Manages mood and burnout for all staff members.
 */
export class StaffWellbeingService {
  private staffWellbeingData: Map<StaffId, StaffMemberWellbeing> = new Map();

  constructor(initialStaff: StaffMemberWellbeing[]) {
    initialStaff.forEach(staff => {
      this.staffWellbeingData.set(staff.id, {
        ...staff, // Spread existing staff data
        moodScore: staff.moodScore || 60, // Default to Content
        currentMood: staff.currentMood || StaffMoodStatus.CONTENT,
        burnoutLevel: staff.burnoutLevel || 0,
        moodFactors: staff.moodFactors || [],
      });
      this.updateMoodStatus(staff.id);
    });
  }

  private updateMoodStatus(staffId: StaffId): void {
    const staff = this.staffWellbeingData.get(staffId);
    if (!staff) return;

    for (const status in MOOD_THRESHOLDS) {
        const {min, max} = MOOD_THRESHOLDS[status as StaffMoodStatus];
        if (staff.moodScore >= min && staff.moodScore <= max) {
            if (status === StaffMoodStatus.BURNOUT_RISK && staff.burnoutLevel < BURNOUT_THRESHOLD_HIGH) {
                // Don't set to BurnoutRisk status unless burnout is actually high
                continue;
            }
            staff.currentMood = status as StaffMoodStatus;
            break;
        }
    }
    // If burnout is high, it might override or add to the mood status display
    if (staff.burnoutLevel >= BURNOUT_THRESHOLD_HIGH && staff.moodScore < MOOD_THRESHOLDS[StaffMoodStatus.CONTENT].min) {
        staff.currentMood = StaffMoodStatus.BURNOUT_RISK;
    }
  }

  /**
   * Applies a modifier to a staff member's mood score.
   */
  applyMoodModifier(staffId: StaffId, modifier: MoodModifier): void {
    const staff = this.staffWellbeingData.get(staffId);
    if (!staff || staff.isTakingLeave) return;

    staff.moodScore = Math.max(0, Math.min(100, staff.moodScore + modifier.change));
    staff.moodFactors.push({ description: modifier.factor, impact: modifier.change, source: 'Event' });
    // Keep moodFactors list from growing too large, remove oldest
    if (staff.moodFactors.length > 10) {
        staff.moodFactors.shift();
    }
    this.updateMoodStatus(staffId);
  }

  /**
   * Periodic update for all staff, called by the game loop (e.g., daily).
   * @param activePerks - List of currently active studio perks that might affect mood.
   */
  dailyUpdate(activePerks: StudioPerk[]): Array<{staffId: StaffId, event: string, details?: any}> {
    const eventsOccurred: Array<{staffId: StaffId, event: string, details?: any}> = [];
    this.staffWellbeingData.forEach(staff => {
      if (staff.isTakingLeave) {
        staff.leaveDaysRemaining = (staff.leaveDaysRemaining || 0) - 1;
        if ((staff.leaveDaysRemaining || 0) <= 0) {
          staff.isTakingLeave = false;
          staff.burnoutLevel = Math.max(0, staff.burnoutLevel - 50); // Significant recovery from leave
          this.applyMoodModifier(staff.id, { factor: "Returned from leave", change: 20 });
          eventsOccurred.push({staffId: staff.id, event: 'ReturnedFromLeave'});
        }
        return; // No other updates if on leave
      }

      let moodAdjustment = 0;
      let burnoutChange = 0;

      // 1. Workload (placeholder - needs integration with project system)
      // const workload = calculateWorkload(staff.assignedProjects);
      // if (workload > HIGH_WORKLOAD_THRESHOLD) moodAdjustment -= 5;
      // if (workload > VERY_HIGH_WORKLOAD_THRESHOLD) burnoutChange += 3;

      // 2. Salary Satisfaction (placeholder - needs more complex logic)
      // const expectedSalary = calculateExpectedSalary(staff.skills, staff.experience);
      // if (staff.salary < expectedSalary * 0.8) moodAdjustment -= 3;

      // 3. Studio Perks
      activePerks.forEach(perk => {
        perk.effects.forEach(effect => {
          if (effect.attribute === 'staffHappinessBonus' || effect.attribute === 'moodBonus') {
            const perkImpact = effect.type === 'flat' ? effect.value : (staff.moodScore * effect.value);
            moodAdjustment += perkImpact;
            // Add to moodFactors if significant
            if (Math.abs(perkImpact) > 0.1) {
                 staff.moodFactors.push({ description: `Perk: ${perk.name}`, impact: perkImpact, source: "Perk" });
            }
          }
          if (effect.attribute === 'burnoutReduction') {
            burnoutChange -= effect.value; // Assuming flat reduction
          }
        });
      });

      // 4. Natural mood drift towards neutral (50)
      if (staff.moodScore > 55) moodAdjustment -= 0.5;
      if (staff.moodScore < 45) moodAdjustment += 0.5;

      // 5. Burnout accumulation/recovery
      if (staff.moodScore < MOOD_THRESHOLDS[StaffMoodStatus.STRESSED].min) {
        burnoutChange += 2; // Low mood increases burnout
      } else if (staff.moodScore > MOOD_THRESHOLDS[StaffMoodStatus.CONTENT].min) {
        burnoutChange -= 1; // Positive mood slowly reduces burnout
      }
      burnoutChange -= 0.5; // Natural small daily recovery if not stressed

      staff.moodScore = Math.max(0, Math.min(100, staff.moodScore + moodAdjustment));
      staff.burnoutLevel = Math.max(0, Math.min(100, staff.burnoutLevel + burnoutChange));
      
      this.updateMoodStatus(staff.id);

      // 6. Handle high burnout effects
      if (staff.burnoutLevel >= BURNOUT_THRESHOLD_CRITICAL && !staff.isTakingLeave) {
        // staff.isTakingLeave = true;
        // staff.leaveDaysRemaining = 10; // Request 10 days leave
        // this.applyMoodModifier(staff.id, { factor: "Critical Burnout - Forced Leave", change: -20 });
        // eventsOccurred.push({staffId: staff.id, event: 'ForcedLeave', details: { days: 10 }});
        // Potentially resignation if this happens repeatedly or other factors
        const resignationChance = (staff.burnoutLevel - BURNOUT_THRESHOLD_CRITICAL) / 10; // up to 100% at 100 burnout
        if (Math.random() < resignationChance) {
            eventsOccurred.push({staffId: staff.id, event: 'StaffResignation', details: { reason: 'Critical Burnout'}});
            // Actual removal of staff would be handled by a different service or game manager
        }

      } else if (staff.burnoutLevel >= BURNOUT_THRESHOLD_HIGH && !staff.isTakingLeave) {
        // staff.isTakingLeave = true;
        // staff.leaveDaysRemaining = 5; // Request 5 days leave
        // this.applyMoodModifier(staff.id, { factor: "High Burnout - Requested Leave", change: -10 });
        // eventsOccurred.push({staffId: staff.id, event: 'RequestedLeave', details: { days: 5 }});
         // Higher chance of errors, lower productivity - these effects are applied where staff performance is calculated.
      }
    });
    return eventsOccurred;
  }

  getStaffWellbeing(staffId: StaffId): StaffMemberWellbeing | undefined {
    return this.staffWellbeingData.get(staffId);
  }

  getAllStaffWellbeing(): StaffMemberWellbeing[] {
    return Array.from(this.staffWellbeingData.values());
  }

  // --- Integration with Project System ---
  processProjectCompletion(
    staffIdsInvolved: StaffId[], 
    wasSuccess: boolean, 
    wasCrunch: boolean
  ): void {
    staffIdsInvolved.forEach(staffId => {
      const staff = this.staffWellbeingData.get(staffId);
      if (!staff) return;

      let moodChange = 0;
      let factor = "Project Completed";
      if (wasSuccess) {
        moodChange += 15;
        factor = "Successful Project";
      } else {
        moodChange -= 10;
        factor = "Failed Project";
      }
      if (wasCrunch) {
        moodChange -= 5;
        staff.burnoutLevel = Math.min(100, staff.burnoutLevel + 10);
        factor += " (Crunch)";
      }
      this.applyMoodModifier(staffId, { factor, change: moodChange });
    });
  }
}

/*
Effects of Mood & Burnout (to be applied in relevant systems):

1. Productivity (in ProjectTaskService or similar):
   - const staffPerformance = basePerformance * getMoodModifier(staff.currentMood) * getBurnoutModifier(staff.burnoutLevel);
   - getMoodModifier: Ecstatic=1.2, Happy=1.1, Content=1.0, Stressed=0.9, Unhappy=0.75, Miserable=0.6
   - getBurnoutModifier: Normal=1.0, ModerateBurnout (50+)=0.8, HighBurnout (70+)=0.6

2. Skill Gain (in StaffTrainingService or after project completion):
   - const skillXpGained = baseSkillXp * getMoodModifierForSkillGain(staff.currentMood);
   - Mood mods: Ecstatic=1.3, Happy=1.15, Content=1.0, Stressed=0.8, Unhappy=0.6

3. Error Rates (in ProjectTaskService):
   - const errorChance = baseErrorChance * getErrorRateModifier(staff.currentMood, staff.burnoutLevel);
   - Mood mods: Stressed=1.5x, Unhappy=2x, Miserable=3x
   - Burnout mods: Moderate=1.5x, High=2.5x (multiplicative or additive with mood)

4. Positive/Negative Events (random chance during tasks):
   - Low mood/high burnout: Higher chance of "Distracted", "Made a costly mistake" events.
   - High mood: Higher chance of "Inspired Idea", "Efficient Workflow" events.

UI Feedback (Conceptual):

// src/hooks/useStaffWellbeing.ts
import { useState, useEffect, useCallback } from 'react';
import { staffWellbeingServiceInstance } from '../services'; // Singleton
import { StaffMemberWellbeing, StaffId } from '../game-mechanics/staff-wellbeing';

export function useStaffWellbeing(staffId?: StaffId) {
  const [wellbeingData, setWellbeingData] = useState<StaffMemberWellbeing | StaffMemberWellbeing[] | null>(null);

  const refreshWellbeing = useCallback(() => {
    if (staffId) {
      setWellbeingData(staffWellbeingServiceInstance.getStaffWellbeing(staffId) || null);
    } else {
      setWellbeingData(staffWellbeingServiceInstance.getAllStaffWellbeing());
    }
  }, [staffId]);

  useEffect(() => {
    refreshWellbeing();
    // Subscribe to updates from the service if it emits events
    // const unsubscribe = staffWellbeingServiceInstance.onUpdate(refreshWellbeing);
    // return () => unsubscribe();
  }, [refreshWellbeing]);

  return { wellbeingData, refreshWellbeing };
}

// In a StaffCard component:
// const { wellbeingData } = useStaffWellbeing(staff.id);
// {wellbeingData && <MoodIcon mood={wellbeingData.currentMood} burnout={wellbeingData.burnoutLevel} />}
// <p>Mood: {wellbeingData?.currentMood} ({wellbeingData?.moodScore})</p>
// <p>Burnout: {wellbeingData?.burnoutLevel.toFixed(0)}%</p>
// {wellbeingData?.moodFactors.map(f => <Tooltip text={`${f.description}: ${f.impact}`} />)}
*/
