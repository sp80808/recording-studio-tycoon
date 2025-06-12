import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { Award, Zap, Users, TrendingUp, Package, Settings, Music, Briefcase, ShieldCheck } from 'lucide-react';
import { LevelUpDetails, PlayerAttributeChange, UnlockedFeatureInfo, ProjectPerformanceSummary, StaffProgressionHighlight, PlayerAbilityChange } from '@/types/game';
import { PlayerAttributes } from '@/types/game'; // Ensure PlayerAttributes is imported

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  levelUpDetails: LevelUpDetails | null;
}

const attributeLabels: Record<keyof PlayerAttributes, string> = {
  focusMastery: 'Focus Mastery',
  creativeIntuition: 'Creative Intuition',
  technicalAptitude: 'Technical Aptitude',
  businessAcumen: 'Business Acumen',
  creativity: 'Creativity',
  technical: 'Technical Skill',
  business: 'Business Savvy',
  charisma: 'Charisma',
  luck: 'Luck',
};

const featureCategoryIcons: Record<UnlockedFeatureInfo['category'], React.ReactNode> = {
  Minigame: <Music className="h-5 w-5 text-purple-400" />,
  Equipment: <Package className="h-5 w-5 text-green-400" />,
  'Studio Upgrade': <Settings className="h-5 w-5 text-blue-400" />,
  'Staff Tier': <Users className="h-5 w-5 text-orange-400" />,
  'Project Type': <Briefcase className="h-5 w-5 text-yellow-400" />,
  Mechanic: <ShieldCheck className="h-5 w-5 text-red-400" />,
};

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ isOpen, onClose, levelUpDetails }) => {
  if (!isOpen || !levelUpDetails) {
    return null;
  }

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.5,
      },
    }),
  };

  const renderAttributeChange = (attrChange: PlayerAttributeChange) => (
    <motion.div
      key={attrChange.name}
      custom={0}
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0"
    >
      <span className="text-gray-300">{attributeLabels[attrChange.name] || attrChange.name}</span>
      <div className="flex items-center">
        <span className="text-gray-500 mr-2">{attrChange.oldValue}</span>
        <span className="text-yellow-400 text-lg font-semibold">➔ {attrChange.newValue}</span>
        <span className="text-green-400 ml-2 text-sm">(+{attrChange.newValue - attrChange.oldValue})</span>
      </div>
    </motion.div>
  );

  const renderAbilityChange = (abilityChange: PlayerAbilityChange) => (
    <motion.div
      key={abilityChange.name}
      custom={1}
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      className="p-3 bg-gray-700/50 rounded-md"
    >
      <div className="flex items-center mb-1">
        <Zap className="h-5 w-5 text-yellow-400 mr-2" />
        <h4 className="font-semibold text-yellow-400">{abilityChange.name}</h4>
      </div>
      <p className="text-sm text-gray-300">
        Now: <span className="font-medium text-white">{abilityChange.newValue}{abilityChange.unit || ''}</span>
        {abilityChange.oldValue !== undefined && (
          <span className="text-xs text-gray-400 ml-1">(was {abilityChange.oldValue}{abilityChange.unit || ''})</span>
        )}
      </p>
      {abilityChange.description && <p className="text-xs text-gray-400 mt-1">{abilityChange.description}</p>}
    </motion.div>
  );
  
  const renderUnlockedFeature = (feature: UnlockedFeatureInfo, index: number) => (
    <motion.div
      key={feature.id}
      custom={index}
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      className="p-3 bg-gray-700/50 rounded-md"
    >
      <div className="flex items-center mb-1">
        {feature.icon ? <span className="mr-2 text-xl">{feature.icon}</span> : featureCategoryIcons[feature.category] || <Award className="h-5 w-5 text-purple-400 mr-2" />}
        <h4 className="font-semibold text-purple-300">{feature.name}</h4>
      </div>
      <p className="text-sm text-gray-300">{feature.description}</p>
      <p className="text-xs text-gray-500 mt-1">Category: {feature.category}</p>
    </motion.div>
  );

  const renderProjectSummary = (summary: ProjectPerformanceSummary, index: number) => (
     <motion.div
      key={summary.projectId}
      custom={index}
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      className="p-3 bg-gray-700/50 rounded-md text-sm"
    >
      <h4 className="font-semibold text-blue-300">{summary.projectTitle} <span className="text-xs text-gray-400">({summary.genre})</span></h4>
      <p className="text-gray-300">Final Score: <span className="font-medium text-white">{summary.finalScore}%</span></p>
      <p className="text-gray-300">Quality: <span className="font-medium text-white">{summary.qualityTier}</span></p>
    </motion.div>
  );

  const renderStaffHighlight = (highlight: StaffProgressionHighlight, index: number) => (
    <motion.div
      key={highlight.staffId}
      custom={index}
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      className="p-3 bg-gray-700/50 rounded-md text-sm"
    >
      <h4 className="font-semibold text-green-300">{highlight.staffName}</h4>
      {highlight.skillIncreased && <p className="text-gray-300">{highlight.skillIncreased} Skill: <span className="font-medium text-white">Level {highlight.newSkillLevel}</span></p>}
      {highlight.newAbilityUnlocked && <p className="text-gray-300">Unlocked: <span className="font-medium text-white">{highlight.newAbilityUnlocked}</span></p>}
    </motion.div>
  );


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-gray-800 border-gray-700 text-white shadow-2xl">
        <DialogHeader className="text-center">
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, type: 'spring' }}>
            <Award className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <DialogTitle className="text-3xl font-bold text-yellow-400">LEVEL UP!</DialogTitle>
            <DialogDescription className="text-gray-300 text-lg">
              Congratulations! You've reached Level {levelUpDetails.newPlayerLevel}!
            </DialogDescription>
          </motion.div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] p-1 pr-4">
          <div className="space-y-6 py-4">
            {levelUpDetails.attributeChanges.length > 0 && (
              <motion.section custom={0} initial="hidden" animate="visible" variants={sectionVariants}>
                <h3 className="text-xl font-semibold text-yellow-300 mb-3 flex items-center"><TrendingUp className="mr-2 h-6 w-6"/>Your Attributes Improved!</h3>
                <div className="bg-gray-700/30 p-4 rounded-lg">{levelUpDetails.attributeChanges.map(renderAttributeChange)}</div>
              </motion.section>
            )}
            
            {levelUpDetails.abilityChanges.length > 0 && (
              <motion.section custom={1} initial="hidden" animate="visible" variants={sectionVariants}>
                <h3 className="text-xl font-semibold text-yellow-300 mb-3 flex items-center"><Zap className="mr-2 h-6 w-6"/>Ability Enhancements!</h3>
                <div className="space-y-3">{levelUpDetails.abilityChanges.map(renderAbilityChange)}</div>
              </motion.section>
            )}

            {levelUpDetails.unlockedFeatures.length > 0 && (
              <motion.section custom={2} initial="hidden" animate="visible" variants={sectionVariants}>
                <h3 className="text-xl font-semibold text-purple-300 mb-3 flex items-center"><Award className="mr-2 h-6 w-6"/>New Unlocks!</h3>
                <div className="space-y-3">{levelUpDetails.unlockedFeatures.map((feat, idx) => renderUnlockedFeature(feat, idx))}</div>
              </motion.section>
            )}

            {levelUpDetails.projectSummaries.length > 0 && (
              <motion.section custom={3} initial="hidden" animate="visible" variants={sectionVariants}>
                <h3 className="text-xl font-semibold text-blue-300 mb-3 flex items-center"><Briefcase className="mr-2 h-6 w-6"/>Studio Report Card (Last Level)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{levelUpDetails.projectSummaries.map((summary, idx) => renderProjectSummary(summary, idx))}</div>
              </motion.section>
            )}

            {levelUpDetails.staffHighlights.length > 0 && (
              <motion.section custom={4} initial="hidden" animate="visible" variants={sectionVariants}>
                <h3 className="text-xl font-semibold text-green-300 mb-3 flex items-center"><Users className="mr-2 h-6 w-6"/>Team Growth!</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{levelUpDetails.staffHighlights.map((highlight, idx) => renderStaffHighlight(highlight, idx))}</div>
              </motion.section>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: levelUpDetails.unlockedFeatures.length * 0.2 + 0.5 }}>
            <Button onClick={onClose} className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-6 text-lg">
              Awesome!
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
