import React from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { PlayerAttributes, StudioSkill, STUDIO_SKILLS } from '@/types/game';
import { 
  PERKS,
  calculateAttributeEffects,
  calculateStudioSkillEffects 
} from '@/utils/progressionUtils';
import { MILESTONE_REWARDS } from '@/data/milestones';

interface ProgressionPanelProps {
  attributes: PlayerAttributes;
  attributePoints: number;
  perkPoints: number;
  level: number;
  studioSkills: Record<string, StudioSkill>;
  onSpendAttributePoint: (attribute: keyof PlayerAttributes) => void;
  onSpendPerkPoint: (attribute: keyof PlayerAttributes) => void;
}

export const ProgressionPanel: React.FC<ProgressionPanelProps> = ({
  attributes,
  attributePoints,
  perkPoints,
  level,
  studioSkills,
  onSpendAttributePoint,
  onSpendPerkPoint
}) => {
  const effects = calculateAttributeEffects(attributes);

  const attributeDescriptions = {
    creativity: "Influences song quality and innovation",
    technical: "Reduces equipment maintenance and improves recording quality",
    charisma: "Influences client satisfaction and staff morale",
    business: "Affects contract negotiations and marketing effectiveness",
    luck: "Affects random events and critical successes",
    focusMastery: "Increases work speed and XP gain",
    creativeIntuition: "Improves project quality and client satisfaction",
    technicalAptitude: "Enhances project quality and equipment efficiency",
    businessAcumen: "Boosts income and client relationships"
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Character Progression</CardTitle>
        <CardDescription>
          Level {level} - Attribute Points: {attributePoints} - Perk Points: {perkPoints}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="attributes">
          <TabsList>
            <TabsTrigger value="attributes">Attributes</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="perks">Perks</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
          </TabsList>

          <TabsContent value="skills" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Genre Skills</h3>
                {Object.entries(STUDIO_SKILLS)
                  .filter(([_, skill]) => skill.category === 'genre')
                  .map(([skillId, template]) => {
                    const skill = studioSkills[skillId] || { level: 0, xp: 0, xpToNext: 100 };
                    return (
                      <Card key={skillId} className="mb-2">
                        <CardHeader>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription>{template.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Level {skill.level}</span>
                              <span>{skill.xp} / {skill.xpToNext} XP</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded">
                              <div
                                className="h-full bg-blue-500 rounded"
                                style={{ width: `${(skill.xp / skill.xpToNext) * 100}%` }}
                              />
                            </div>
                            <div className="text-sm text-gray-600">
                              {Object.entries(template.bonuses).map(([bonus, value]) => (
                                <div key={bonus}>
                                  {bonus}: +{Math.round(value * skill.level * 100)}%
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Technical Skills</h3>
                {Object.entries(STUDIO_SKILLS)
                  .filter(([_, skill]) => skill.category === 'technical')
                  .map(([skillId, template]) => {
                    const skill = studioSkills[skillId] || { level: 0, xp: 0, xpToNext: 100 };
                    return (
                      <Card key={skillId} className="mb-2">
                        <CardHeader>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription>{template.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Level {skill.level}</span>
                              <span>{skill.xp} / {skill.xpToNext} XP</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded">
                              <div
                                className="h-full bg-blue-500 rounded"
                                style={{ width: `${(skill.xp / skill.xpToNext) * 100}%` }}
                              />
                            </div>
                            <div className="text-sm text-gray-600">
                              {Object.entries(template.bonuses).map(([bonus, value]) => (
                                <div key={bonus}>
                                  {bonus}: +{Math.round(value * skill.level * 100)}%
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="attributes" className="space-y-4">
            {Object.entries(attributes).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-2 border rounded bg-gray-800/80">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="text-left">
                        <div className="font-medium text-white">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-sm text-gray-400">
                          Level: {value}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{attributeDescriptions[key as keyof typeof attributeDescriptions]}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-blue-400">
                    {key === 'technical' && `+${Math.floor(effects.equipmentEfficiencyMod * 100 - 100)}% Efficiency`}
                    {key === 'creativity' && `+${Math.floor(effects.projectQualityMod * 100 - 100)}% Quality`}
                    {key === 'charisma' && `+${Math.floor(effects.clientSatisfactionMod * 100 - 100)}% Satisfaction`}
                    {key === 'business' && `+${Math.floor(effects.moneyMod * 100 - 100)}% Income`}
                    {key === 'luck' && `+${Math.floor(effects.projectQualityMod * 100 - 100)}% Quality`}
                  </div>
                  <Button
                    onClick={() => onSpendAttributePoint(key as keyof PlayerAttributes)}
                    disabled={attributePoints <= 0}
                    variant="outline"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white"
                  >
                    Upgrade
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="perks" className="grid grid-cols-2 gap-4">
            {PERKS.map(perk => {
              const canAfford = perkPoints >= perk.cost;
              const meetsRequirements = !perk.requirements || 
                Object.entries(perk.requirements).every(
                  ([attr, req]) => attributes[attr as keyof PlayerAttributes] >= req
                );
              
              return (
                <Card key={perk.id} className={`relative ${!canAfford || !meetsRequirements ? 'opacity-50' : ''}`}>
                  <CardHeader>
                    <CardTitle className="text-lg">{perk.name}</CardTitle>
                    <CardDescription>
                      {perk.description}
                      <div className="mt-1 text-xs">
                        Cost: {perk.cost} perk points
                      </div>
                      {perk.requirements && (
                        <div className="mt-1 text-xs text-red-500">
                          Requires: {Object.entries(perk.requirements)
                            .map(([attr, req]) => `${attr} ${req}`)
                            .join(', ')}
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => onSpendPerkPoint(perk.id as keyof PlayerAttributes)}
                      disabled={!canAfford || !meetsRequirements}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Purchase
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="milestones" className="space-y-4">
            {MILESTONE_REWARDS.map(milestone => {
              const isCompleted = level >= milestone.level;
              const isNext = !isCompleted && milestone.level === Math.ceil(level / 5) * 5;
              
              return (
                <Card key={milestone.id} className={`${isCompleted ? 'bg-green-50 dark:bg-green-900' : ''} ${isNext ? 'border-blue-500' : ''}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {isCompleted && (
                        <span className="text-green-500">✓</span>
                      )}
                      Level {milestone.level}: {milestone.name}
                    </CardTitle>
                    <CardDescription>{milestone.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {milestone.unlockedFeatures && milestone.unlockedFeatures.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">New Features:</span>{' '}
                          {milestone.unlockedFeatures.join(', ')}
                        </div>
                      )}
                      {milestone.newProjectTemplates && milestone.newProjectTemplates.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">New Projects:</span>{' '}
                          {milestone.newProjectTemplates.join(', ')}
                        </div>
                      )}
                      {milestone.newEquipment && milestone.newEquipment.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">New Equipment:</span>{' '}
                          {milestone.newEquipment.join(', ')}
                        </div>
                      )}
                      {milestone.newTrainingCourses && milestone.newTrainingCourses.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">New Training:</span>{' '}
                          {milestone.newTrainingCourses.join(', ')}
                        </div>
                      )}
                      {milestone.attributePoints && milestone.attributePoints > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">Attribute Points:</span>{' '}
                          +{milestone.attributePoints}
                        </div>
                      )}
                      {milestone.perkPoints && milestone.perkPoints > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">Perk Points:</span>{' '}
                          +{milestone.perkPoints}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
