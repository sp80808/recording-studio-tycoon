// Studio Perks & Specializations Panel Component
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  Award, 
  Star, 
  Lock, 
  Unlock, 
  Settings,
  Zap,
  Users,
  Volume2,
  Target
} from 'lucide-react';
import { useStudioUpgrades } from '../hooks/useStudioUpgrades';
import { StudioPerk, PerkCategory } from '../types/studioPerks';

interface StudioPerksPanelProps {
  className?: string;
}

export const StudioPerksPanel: React.FC<StudioPerksPanelProps> = ({ className }) => {
  const {
    perkTrees,
    industryPrestige,
    currentSpecialization,
    availablePerkPoints,
    unlockedPerks,
    canUnlockPerk,
    unlockPerk,
    getPerkById,
    totalBonuses,
    prestigeLevel,
    prestigeTier,
    isLoading,
    error
  } = useStudioUpgrades();

  const [selectedCategory, setSelectedCategory] = useState<PerkCategory>('acoustics');

  const getCategoryIcon = (category: PerkCategory) => {
    switch (category) {
      case 'acoustics':
        return <Volume2 className="w-4 h-4" />;
      case 'equipment':
        return <Settings className="w-4 h-4" />;
      case 'talent-acquisition':
        return <Users className="w-4 h-4" />;
      case 'marketing':
        return <Target className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: PerkCategory) => {
    switch (category) {
      case 'acoustics':
        return 'text-blue-600 border-blue-300 bg-blue-50';
      case 'equipment':
        return 'text-green-600 border-green-300 bg-green-50';
      case 'talent-acquisition':
        return 'text-purple-600 border-purple-300 bg-purple-50';
      case 'marketing':
        return 'text-orange-600 border-orange-300 bg-orange-50';
    }
  };

  const getPrestigeTierColor = (tier: string) => {
    switch (tier) {
      case 'legendary':
        return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'premier':
        return 'text-purple-600 bg-purple-100 border-purple-300';
      case 'established':
        return 'text-blue-600 bg-blue-100 border-blue-300';
      case 'emerging':
        return 'text-green-600 bg-green-100 border-green-300';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const handleUnlockPerk = (perkId: string) => {
    if (canUnlockPerk(perkId)) {
      unlockPerk(perkId);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Studio Perks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading studio upgrades...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Award className="w-5 h-5" />
            Studio Perks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-600">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  const currentTree = perkTrees.find(tree => tree.category === selectedCategory);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          Studio Perks & Specializations
        </CardTitle>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Customize your studio's strengths
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold text-yellow-600">{availablePerkPoints}</span>
            <span className="text-sm text-gray-600">points</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Industry Prestige */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-600" />
              Industry Prestige
            </h4>
            <Badge className={`${getPrestigeTierColor(prestigeTier)} border`}>
              {prestigeTier.charAt(0).toUpperCase() + prestigeTier.slice(1)}
            </Badge>
          </div>
          <Progress 
            value={(industryPrestige.points / industryPrestige.nextTierRequirement) * 100} 
            className="h-2 mb-2"
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>Level {prestigeLevel}</span>
            <span>{industryPrestige.points}/{industryPrestige.nextTierRequirement}</span>
          </div>
        </div>

        {/* Current Specialization */}
        {currentSpecialization && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-semibold text-sm text-blue-800 mb-1">
              Studio Specialization: {currentSpecialization.name}
            </h4>
            <p className="text-xs text-blue-600 mb-2">{currentSpecialization.description}</p>
            <div className="flex flex-wrap gap-1">
              {currentSpecialization.focusGenres.map((genre) => (
                <Badge key={genre} variant="outline" className="text-xs text-blue-600 border-blue-300">
                  {genre}: Specialized
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Perk Categories */}
        <div>
          <h4 className="font-semibold text-sm mb-3">Perk Categories</h4>
          <div className="grid grid-cols-2 gap-2">
            {(['acoustics', 'equipment', 'talent-acquisition', 'marketing'] as PerkCategory[]).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`justify-start ${selectedCategory === category ? '' : getCategoryColor(category)}`}
              >
                {getCategoryIcon(category)}
                <span className="ml-2 capitalize">{category.replace('-', ' ')}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Perk Tree */}
        {currentTree && (
          <div>
            <h4 className="font-semibold text-sm mb-3 capitalize">
              {selectedCategory.replace('-', ' ')} Perks
            </h4>
            <div className="space-y-4">
              {currentTree.tiers.map((tier, tierIndex) => (
                <div key={tierIndex} className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-xs font-medium text-gray-600">
                      Tier {tierIndex + 1}
                    </div>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {tier.perks.map((perk) => {
                      const isUnlocked = unlockedPerks.includes(perk.id);
                      const canUnlock = canUnlockPerk(perk.id);
                      
                      return (
                        <div
                          key={perk.id}
                          className={`p-3 rounded-lg border ${
                            isUnlocked 
                              ? 'border-green-300 bg-green-50' 
                              : canUnlock 
                                ? 'border-blue-300 bg-blue-50 cursor-pointer hover:bg-blue-100' 
                                : 'border-gray-200 bg-gray-50'
                          }`}
                          onClick={() => canUnlock && handleUnlockPerk(perk.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {isUnlocked ? (
                                <Unlock className="w-4 h-4 text-green-600" />
                              ) : (
                                <Lock className="w-4 h-4 text-gray-400" />
                              )}
                              <span className={`font-medium text-sm ${isUnlocked ? 'text-green-800' : 'text-gray-700'}`}>
                                {perk.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {!isUnlocked && (
                                <Badge variant="outline" className="text-xs">
                                  {typeof perk.cost === 'number' ? perk.cost : '?'} pts
                                </Badge>
                              )}
                              {canUnlock && !isUnlocked && (
                                <Button size="sm" variant="outline" className="text-xs px-2 py-1">
                                  Unlock
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2">{perk.description}</p>
                          
                          {/* Perk Effects */}
                          <div className="space-y-1">
                            {Object.entries(perk.effects.flatBonuses || {}).map(([key, value]) => (
                              <div key={key} className="text-xs text-blue-600">
                                +{value} {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                              </div>
                            ))}
                            {Object.entries(perk.effects.percentageBonuses || {}).map(([key, value]) => (
                              <div key={key} className="text-xs text-purple-600">
                                +{Math.round(value * 100)}% {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                              </div>
                            ))}
                          </div>
                          
                          {/* Unlock Requirements */}
                          {!isUnlocked && perk.unlockConditions && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="text-xs text-gray-500">Requirements:</div>
                              {perk.unlockConditions.studioReputationThreshold && (
                                <div className="text-xs text-gray-600">
                                  Studio Reputation: {perk.unlockConditions.studioReputationThreshold}+
                                </div>
                              )}
                              {perk.unlockConditions.completedProjectsInGenre && (
                                <div className="text-xs text-gray-600">
                                  Projects completed: {Object.entries(perk.unlockConditions.completedProjectsInGenre).map(([genre, count]) => 
                                    `${genre}: ${count}`
                                  ).join(', ')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Bonuses Summary */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm mb-2">Active Bonuses</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-gray-600">Quality Bonus:</div>
              <div className="font-medium">+{Math.round((totalBonuses.projectQualityBonus ?? 0) * 100)}%</div>
            </div>
            <div>
              <div className="text-gray-600">Speed Bonus:</div>
              <div className="font-medium">+{Math.round((totalBonuses.projectSpeedBonus ?? 0) * 100)}%</div>
            </div>
            <div>
              <div className="text-gray-600">Staff Happiness:</div>
              <div className="font-medium">+{totalBonuses.staffHappiness}</div>
            </div>
            <div>
              <div className="text-gray-600">Contract Value:</div>
              <div className="font-medium">+{Math.round(((totalBonuses.contractValueMultiplier ?? 1) - 1) * 100)}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
