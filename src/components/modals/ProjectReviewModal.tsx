import React, { useState, useEffect, useCallback } from 'react';
import { ProjectReport, ProjectReportSkillEntry } from '@/types/game';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription, // Import DialogDescription
} from '@/components/ui/dialog'; // Assuming these are from your UI library
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress'; // Assuming Progress component for XP bars
import { gameAudio } from '@/utils/audioSystem'; // For sound effects
import { X } from 'lucide-react'; // For skip button icon
import { generateAlbumArt, generateReview } from '@/services/pollinations';

interface AnimatedNumberProps {
  targetValue: number;
  duration?: number;
  className?: string;
  onComplete?: () => void;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ targetValue, duration = 1000, className, onComplete }) => {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCurrentValue(Math.floor(progress * targetValue));
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        if (onComplete) onComplete();
      }
    };
    requestAnimationFrame(animate);
  }, [targetValue, duration, onComplete]);

  return <span className={className}>{currentValue.toLocaleString()}</span>;
};


interface SkillDisplayProps {
  skillDetail: ProjectReportSkillEntry;
  onAnimationComplete: () => void;
  startAnimation: boolean;
}

const SkillDisplay: React.FC<SkillDisplayProps> = ({ skillDetail, onAnimationComplete, startAnimation }) => {
  const [xpBarProgress, setXpBarProgress] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(skillDetail.initialLevel);
  const [levelUpFlash, setLevelUpFlash] = useState(false);
  const [score, setScore] = useState(0);
  const [xpText, setXpText] = useState(skillDetail.initialXp);

  useEffect(() => {
    if (!startAnimation) return;

    let animationStep = 0;
    const timeouts: NodeJS.Timeout[] = [];
    let scoreIntervalId: NodeJS.Timeout | undefined = undefined;


    const runAnimations = () => {
      if (animationStep === 0) { // Animate XP bar and level
        gameAudio.playSound('xp-tick', 'sfx', 0.3); // Changed from xp_tick_fast
        let xpForNextCurrent = skillDetail.xpToNextLevelBefore;

        if (skillDetail.levelUps > 0) {
          let levelsToAnimate = skillDetail.levelUps;
          let currentAnimatedLevel = skillDetail.initialLevel;
          
          const animateLevelByLevel = () => {
            if (levelsToAnimate > 0) {
              setXpBarProgress(100); 
              setXpText(xpForNextCurrent); 
              timeouts.push(setTimeout(() => {
                setCurrentLevel(currentAnimatedLevel + 1);
                setLevelUpFlash(true);
                gameAudio.playSound('level_up_skill', 'sfx', 0.6);
                currentAnimatedLevel++;
                xpForNextCurrent = calculateXpToNextLevel(currentAnimatedLevel); 
                setXpText(0); 
                setXpBarProgress(0); 
                timeouts.push(setTimeout(() => {
                  setLevelUpFlash(false);
                  levelsToAnimate--;
                  animateLevelByLevel();
                }, 150)); // Reduced from 300
              }, 200)); // Reduced from 400 
            } else {
              setXpText(skillDetail.finalXp);
              setXpBarProgress(skillDetail.xpToNextLevelAfter > 0 ? (skillDetail.finalXp / skillDetail.xpToNextLevelAfter) * 100 : 0);
              animationStep++;
              timeouts.push(setTimeout(runAnimations, 250)); // Reduced from 500
            }
          };
          animateLevelByLevel();
        } else {
          setXpText(skillDetail.finalXp);
          setXpBarProgress(skillDetail.xpToNextLevelAfter > 0 ? (skillDetail.finalXp / skillDetail.xpToNextLevelAfter) * 100 : 0);
          animationStep++;
          timeouts.push(setTimeout(runAnimations, 250)); // Reduced from 500
        }
        setCurrentLevel(skillDetail.finalLevel);
      } else if (animationStep === 1) { // Animate score
        gameAudio.playSound('score-tick', 'sfx', 0.4); // Changed from score_tick
        let currentScoreVal = 0;
        const targetScore = skillDetail.score;
        const scoreSteps = 20;
        const scoreIncrement = Math.max(1, Math.ceil(targetScore / scoreSteps));
        const scoreStepDuration = 30;

        scoreIntervalId = setInterval(() => {
          currentScoreVal += scoreIncrement;
          if (currentScoreVal >= targetScore) {
            setScore(targetScore);
            clearInterval(scoreIntervalId);
            animationStep++;
            timeouts.push(setTimeout(runAnimations, 100)); // Reduced from 200
          } else {
            setScore(currentScoreVal);
          }
        }, scoreStepDuration);
      } else if (animationStep === 2) { // Done
        onAnimationComplete();
      }
    };
    
    timeouts.push(setTimeout(runAnimations, 50)); // Reduced from 100 

    return () => {
        timeouts.forEach(clearTimeout);
        if (scoreIntervalId) clearInterval(scoreIntervalId);
    };

  }, [startAnimation, skillDetail, onAnimationComplete]);
  
  const calculateXpToNextLevel = (level: number): number => Math.floor(100 * Math.pow(level, 1.5));

  return (
    <li className="text-sm p-2 bg-gray-750 rounded shadow">
      <div className="flex justify-between items-center mb-1">
        <span className={`font-semibold capitalize ${levelUpFlash ? 'text-yellow-300 animate-pulse-strong' : 'text-white'}`}>
          {skillDetail.skillName}: Lvl {currentLevel}
        </span>
        <span className={`font-bold text-lg ${score > 80 ? 'text-green-400' : score > 60 ? 'text-yellow-400' : 'text-red-400'}`}>
          {score}/100
        </span>
      </div>
      <div className="w-full bg-gray-600 rounded h-4 overflow-hidden relative">
        <div 
          className="bg-blue-500 h-full transition-all duration-500 ease-out" 
          style={{ width: `${xpBarProgress}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold drop-shadow-md">
           {xpText} / {skillDetail.finalLevel === currentLevel ? skillDetail.xpToNextLevelAfter : calculateXpToNextLevel(currentLevel)} XP
        </span>
      </div>
      {skillDetail.levelUps > 0 && !levelUpFlash && (
         <span className="text-green-400 ml-1 text-xs">({skillDetail.levelUps}x LEVEL UP!)</span>
      )}
    </li>
  );
};

interface ProjectReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ProjectReport | null;
}

export const ProjectReviewModal: React.FC<ProjectReviewModalProps> = ({ isOpen, onClose, report }) => {
  const [currentSkillIndex, setCurrentSkillIndex] = useState(-1);
  const [showOverallQuality, setShowOverallQuality] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [showSnippet, setShowSnippet] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [animatedOverallQualityValue, setAnimatedOverallQualityValue] = useState(0);
  const [typedSnippet, setTypedSnippet] = useState("");
  const [reviewText, setReviewText] = useState<string | null>(null);
  const [artUrl, setArtUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const totalAnimationStages = (report?.skillBreakdown.length || 0) + 3; 

  const handleNextAnimation = useCallback(() => {
    setCurrentSkillIndex(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (isOpen && report) {
      setCurrentSkillIndex(-1);
      setShowOverallQuality(false);
      setShowRewards(false);
      setShowSnippet(false);
      setShowContinueButton(false);
      setAnimatedOverallQualityValue(0); 
      setTypedSnippet("");
      
      gameAudio.playSound('review_start', 'sfx', 0.7); 
      setTimeout(() => setCurrentSkillIndex(0), 250); // Reduced from 500 
    }
  }, [isOpen, report]);

  useEffect(() => {
    if (isOpen && report) {
      setIsGenerating(true);
      setGenerationError(null);
      Promise.all([
        generateReview(report.projectTitle),
        generateAlbumArt(report.projectTitle)
      ])
        .then(([review, art]) => {
          setReviewText(review);
          setArtUrl(art);
        })
        .catch((err) => {
          setGenerationError(err.message);
        })
        .finally(() => {
          setIsGenerating(false);
        });
    }
  }, [isOpen, report]);

  useEffect(() => {
    if (!report || !isOpen) return;

    const timeouts: NodeJS.Timeout[] = [];
    let intervalId: NodeJS.Timeout | undefined = undefined;

    if (currentSkillIndex >= 0 && currentSkillIndex < report.skillBreakdown.length) {
      // SkillDisplay handles its own animation and calls handleNextAnimation
    } else if (currentSkillIndex === report.skillBreakdown.length) { 
      setShowOverallQuality(true);
      gameAudio.playSound('score_total_tick', 'sfx', 0.5); 
      
      let currentQuality = 0;
      const targetQuality = report.overallQualityScore;
      const qualityAnimationDuration = 1000; 
      const steps = 50; 
      const stepDuration = qualityAnimationDuration / steps;
      const increment = Math.max(1, targetQuality / steps);

      intervalId = setInterval(() => {
        currentQuality += increment;
        if (currentQuality >= targetQuality) {
          setAnimatedOverallQualityValue(targetQuality);
          clearInterval(intervalId);
          handleNextAnimation();
        } else {
          setAnimatedOverallQualityValue(Math.floor(currentQuality));
        }
      }, stepDuration);
      
    } else if (currentSkillIndex === report.skillBreakdown.length + 1) { 
      setShowRewards(true);
      gameAudio.playSound('purchase', 'sfx', 0.6); 
      timeouts.push(setTimeout(() => {
        handleNextAnimation();
      }, 1500)); 
    } else if (currentSkillIndex === report.skillBreakdown.length + 2) { 
      setShowSnippet(true);
      let i = 0;
      const snippetText = report.reviewSnippet;
      const typingSpeed = 30;
      intervalId = setInterval(() => {
        setTypedSnippet(snippetText.substring(0, i + 1));
        i++;
        if (i >= snippetText.length) {
          clearInterval(intervalId);
          gameAudio.playSound('text_complete', 'sfx', 0.5); 
          handleNextAnimation();
        } else {
          if (i % 3 === 0) gameAudio.playSound('text_scroll', 'sfx', 0.3); 
        }
      }, typingSpeed); 
    } else if (currentSkillIndex >= totalAnimationStages) { 
      setShowContinueButton(true);
      gameAudio.playSound('review_complete', 'sfx', 0.7); 
    }
    return () => {
      timeouts.forEach(clearTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [currentSkillIndex, report, isOpen, handleNextAnimation, totalAnimationStages]);


  // Use a unique ID for aria-describedby
  const descriptionId = "project-review-description";

  if (!isOpen || !report) return null;

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(openState) => {
        // This handles ESC key or other non-button close attempts.
        // Only allow closing if the continue button is visible (animations done).
        if (!openState && showContinueButton) {
          onClose();
        }
        // If !openState and !showContinueButton, do nothing (prevent close).
        // If openState is true, it's opening, do nothing.
      }}
    >
      <DialogContent 
        className="bg-black border-gray-700 text-gray-50 shadow-xl max-w-2xl w-full rounded-lg z-[60]" // Changed to black background
        onInteractOutside={(e) => {
          // Prevent closing when clicking outside if animation is not complete
          if (!showContinueButton) {
            e.preventDefault();
          }
          // If showContinueButton is true, onOpenChange (from ESC or other) will handle the close.
          // If user clicks outside AND showContinueButton is true, onOpenChange will be triggered with openState=false.
        }}
        aria-describedby={descriptionId} // Add aria-describedby for accessibility
      >
        <DialogHeader className="pt-6 px-6">
          <DialogTitle className="text-2xl font-bold text-yellow-400">Project Complete: {report.projectTitle}</DialogTitle>
          {/* Visible description for screen readers and context */}
          <DialogDescription id={descriptionId} className="sr-only">
            Detailed review of your completed project: {report.projectTitle}. Shows skill improvements, overall quality, and rewards gained.
          </DialogDescription>
        </DialogHeader>
        {/* Card wrapper for styling consistency, removed its own onClick handler */}
        <Card className="bg-transparent border-0 shadow-none">
          <CardContent className="overflow-y-auto flex-grow p-6 space-y-3 max-h-[70vh] md:max-h-[80vh]">
            {report.skillBreakdown.length > 0 && (
              <div>
                <h4 className="text-xl font-semibold text-yellow-200 mb-2">Skill Progression ({report.assignedPerson.name})</h4>
                <ul className="space-y-2">
                  {report.skillBreakdown.map((skillDetail, index) => (
                    <SkillDisplay 
                      key={skillDetail.skillName} 
                      skillDetail={skillDetail}
                      startAnimation={currentSkillIndex === index}
                      onAnimationComplete={handleNextAnimation} 
                    />
                  ))}
                </ul>
              </div>
            )}
            {showOverallQuality && (
              <div className="pt-2">
                <h3 className="text-2xl font-bold text-center text-yellow-300 mb-1">
                  Overall Quality: <AnimatedNumber targetValue={report.overallQualityScore} duration={1000} className="text-3xl" /> / 100
                </h3>
                <Progress value={animatedOverallQualityValue} className="h-6 bg-gray-700 [&>*]:bg-green-500 transition-all duration-300" />
              </div>
            )}
            {showRewards && (
              <div className="pt-2 space-y-1 text-center">
                <h4 className="text-xl font-semibold text-yellow-200">Rewards</h4>
                <p className="text-lg text-white">💰 Money: $<AnimatedNumber targetValue={report.moneyGained} duration={600} /></p>
                <p className="text-lg text-white">🌟 Reputation: +<AnimatedNumber targetValue={report.reputationGained} duration={600} /></p>
                {report.assignedPerson.type === 'staff' && report.playerManagementXpGained > 0 && (
                  <p className="text-lg text-white">🧠 Player Management XP: +<AnimatedNumber targetValue={report.playerManagementXpGained} duration={600} /></p>
                )}
              </div>
            )}
            {showSnippet && (
              <div className="pt-2">
                <h4 className="text-xl font-semibold text-yellow-200">Summary</h4>
                <p className="italic text-gray-300 text-center text-lg p-2 border border-dashed border-gray-600 rounded bg-gray-750">
                  "{typedSnippet}"
                </p>
              </div>
            )}

            <div className="pt-4">
              {isGenerating && (
                <div className="text-center text-gray-400 italic">Generating review and art...</div>
              )}
              {generationError && (
                <div className="text-center text-red-500">Error: {generationError}</div>
              )}
              {!isGenerating && !generationError && artUrl && reviewText && (
                <div className="pt-4 space-y-3 text-center">
                  <img
                    src={artUrl}
                    alt="Album Art"
                    className="mx-auto w-64 h-64 object-cover rounded"
                  />
                  <div className="p-4 bg-gray-800 rounded">
                    <p className="text-white">{reviewText}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-4">
            {showContinueButton ? (
              <Button disabled={isGenerating}
                onClick={() => {
                  // Play sound before calling onClose, as onClose might unmount the component
                  gameAudio.playSound('button_click', 'ui'); 
                  onClose();
                }} 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold text-lg py-3"
              >
                Awesome!
              </Button>
            ) : (
              <div className="w-full text-center text-gray-400 italic">Calculating...</div>
            )}
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
