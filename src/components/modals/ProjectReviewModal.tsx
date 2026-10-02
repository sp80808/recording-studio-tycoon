import { moneySymbol, moneyValue } from '@/utils/displayMoney';
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
import { AlbumCoverArt } from '@/components/AlbumCoverArt';
import { triggerMilestoneCelebration } from '@/utils/confettiJuice';
import { gradeQuality, type RankResult } from '@/rpg/rankChase';
import { RankRevealOverlay } from '@/components/RankRevealOverlay';
import { MotionReward, MotionButton, MotionNumber } from '@/components/motion/primitives';

interface AnimatedNumberProps {
  targetValue: number;
  duration?: number;
  className?: string;
  onComplete?: () => void;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ targetValue, className, onComplete }) => {
  return <MotionNumber value={targetValue} className={className} onComplete={onComplete} />;
};


interface SkillDisplayProps {
  skillDetail: ProjectReportSkillEntry;
  onAnimationComplete: () => void;
  startAnimation: boolean;
  skipped?: boolean;
}

const SkillDisplay: React.FC<SkillDisplayProps> = ({ skillDetail, onAnimationComplete, startAnimation, skipped = false }) => {
  const [xpBarProgress, setXpBarProgress] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(skillDetail.initialLevel);
  const [levelUpFlash, setLevelUpFlash] = useState(false);
  const [score, setScore] = useState(0);
  const [xpText, setXpText] = useState(skillDetail.initialXp);

  // Fast-forward: jump straight to the final values when the player skips the reveal.
  useEffect(() => {
    if (!skipped) return;
    setLevelUpFlash(false);
    setCurrentLevel(skillDetail.finalLevel);
    setXpText(skillDetail.finalXp);
    setXpBarProgress(skillDetail.xpToNextLevelAfter > 0 ? (skillDetail.finalXp / skillDetail.xpToNextLevelAfter) * 100 : 0);
    setScore(skillDetail.score);
  }, [skipped, skillDetail]);

  useEffect(() => {
    if (!startAnimation || skipped) return;

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

  }, [startAnimation, skipped, skillDetail, onAnimationComplete]);
  
  const calculateXpToNextLevel = (level: number): number => Math.floor(100 * Math.pow(level, 1.5));

  return (
    <li className="group rounded-xl border border-stone-700/70 bg-stone-900/80 p-3 shadow-[0_10px_28px_rgba(0,0,0,.18)] transition-colors hover:border-amber-400/35">
      <div className="flex justify-between items-center mb-1">
        <span className={`font-semibold capitalize ${levelUpFlash ? 'text-yellow-300 animate-pulse-strong' : 'text-white'}`}>
          {skillDetail.skillName}: Lvl {currentLevel}
        </span>
        <span className={`font-bold text-lg ${score > 80 ? 'text-green-400' : score > 60 ? 'text-yellow-400' : 'text-red-400'}`}>
          {score}/100
        </span>
      </div>
      <div className="w-full bg-stone-600 rounded h-4 overflow-hidden relative">
        <div 
          className="bg-amber-500 h-full transition-all duration-500 ease-out" 
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
  /** Studio Seasons link: what this delivery adds to the chosen focus (#63). */
  seasonNote?: string | null;
}

export const ProjectReviewModal: React.FC<ProjectReviewModalProps> = ({ isOpen, onClose, report, seasonNote }) => {
  const [currentSkillIndex, setCurrentSkillIndex] = useState(-1);
  const [showOverallQuality, setShowOverallQuality] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [showSnippet, setShowSnippet] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [animatedOverallQualityValue, setAnimatedOverallQualityValue] = useState(0);
  const [typedSnippet, setTypedSnippet] = useState("");
  const [reviewText, setReviewText] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [rankStamp, setRankStamp] = useState<RankResult | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [albumArtUrl, setAlbumArtUrl] = useState<string | null>(null);
  const [isGeneratingArt, setIsGeneratingArt] = useState(false);

  const totalAnimationStages = (report?.skillBreakdown.length || 0) + 3; 

  const handleNextAnimation = useCallback(() => {
    setCurrentSkillIndex(prev => prev + 1);
  }, []);

  const skipReveal = useCallback(() => {
    if (!report) return;
    setSkipped(true);
    setShowOverallQuality(true);
    setAnimatedOverallQualityValue(report.overallQualityScore);
    setShowRewards(true);
    setShowSnippet(true);
    setTypedSnippet(report.reviewSnippet);
    setCurrentSkillIndex(totalAnimationStages);
  }, [report, totalAnimationStages]);

  // Space / Enter fast-forwards the reveal so a review never locks the game for its full length.
  useEffect(() => {
    if (!isOpen || showContinueButton) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        skipReveal();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, showContinueButton, skipReveal]);

  useEffect(() => {
    if (isOpen && report) {
      setSkipped(false);
      setCurrentSkillIndex(-1);
      setShowOverallQuality(false);
      setShowRewards(false);
      setShowSnippet(false);
      setShowContinueButton(false);
      setAnimatedOverallQualityValue(0); 
      setTypedSnippet("");
      setRankStamp(null);
      
      gameAudio.playSound('review_start', 'sfx', 0.7); 
      setTimeout(() => setCurrentSkillIndex(0), 250); // Reduced from 500 
    }
  }, [isOpen, report]);

  useEffect(() => {
    if (isOpen && report) {
      setAlbumArtUrl(null);
      setIsGeneratingArt(true);
      generateAlbumArt(`editorial album cover for ${report.projectTitle}, ${report.genre} music, tactile studio photography, bold geometric composition, no text, square artwork`)
        .then(url => setAlbumArtUrl(url === '/placeholder.svg' ? null : url))
        .catch(() => setAlbumArtUrl(null))
        .finally(() => setIsGeneratingArt(false));

      let settled = false;
      setIsGenerating(true);
      setReviewText(null);
      const fallback = window.setTimeout(() => {
        settled = true;
        setReviewText(report.reviewSnippet);
        setIsGenerating(false);
      }, 2500);
      generateReview(report.projectTitle)
        .then(text => { if (!settled) setReviewText(text); })
        .catch(() => { if (!settled) setReviewText(report.reviewSnippet); })
        .finally(() => {
          if (!settled) setIsGenerating(false);
        });
      return () => {
        settled = true;
        window.clearTimeout(fallback);
      };
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
          if (targetQuality >= 80) {
            // Rank stamp climax (non-blocking): overlay fires alongside the
            // existing milestone confetti; S/S+ sting plays from the overlay.
            setRankStamp(gradeQuality(targetQuality));
            triggerMilestoneCelebration(
              targetQuality >= 90 ? 'S' : 'A',
              targetQuality >= 95 ? 'Platinum' : targetQuality >= 85 ? 'Gold' : undefined
            );
          }
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
        className="bg-black border-stone-700 text-stone-50 shadow-2xl max-w-4xl w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] overflow-hidden rounded-xl z-[60] flex flex-col !animate-none"
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
        <DialogHeader className="pt-5 px-6 border-b border-stone-800/80 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-yellow-400">Project Complete: {report.projectTitle}</DialogTitle>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-stone-800 text-stone-300 border border-stone-700">
              {report.genre}
            </span>
          </div>
          {/* Visible description for screen readers and context */}
          <DialogDescription id={descriptionId} className="sr-only">
            Detailed review of your completed project: {report.projectTitle}. Shows skill improvements, overall quality, and rewards gained.
          </DialogDescription>
        </DialogHeader>
        {/* Card wrapper for styling consistency */}
        <Card className="bg-transparent border-0 shadow-none min-h-0 flex flex-1 flex-col">
          <CardContent className="min-h-0 overflow-y-auto flex-1 p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Column: Album Art, Press Review & Rewards */}
              <div className="flex flex-col items-center space-y-4">
                <AlbumCoverArt
                  title={report.projectTitle}
                  genre={report.genre}
                  artist={report.assignedPerson?.name || 'Studio Tycoon'}
                  score={report.overallQualityScore}
                  imageUrl={albumArtUrl}
                  isGenerating={isGeneratingArt}
                  showVinylPeek={true}
                />

                {/* Press Critique */}
                <div className="w-full max-w-sm">
                  {isGenerating ? (
                    <div className="text-center text-amber-300/80 font-mono text-xs tracking-wider animate-pulse py-2">
                      🎛️ Mastering album art & press review...
                    </div>
                  ) : (
                    <div className="w-full p-3.5 bg-stone-900/90 border border-stone-700/80 rounded-lg shadow-inner text-center">
                      <p className="text-[10px] font-mono tracking-widest text-amber-400/80 uppercase mb-1">Press Critique</p>
                      <p className="text-sm text-stone-200 italic leading-relaxed">
                        "{reviewText || typedSnippet || report.reviewSnippet}"
                      </p>
                    </div>
                  )}
                </div>

                {seasonNote && (
                  <p className="w-full rounded-md border border-amber-500/30 bg-stone-900/70 px-3 py-2 text-center text-xs text-amber-200" data-testid="season-review-note">
                    {seasonNote}
                  </p>
                )}

                {/* Rewards */}
                {showRewards && (
                  <MotionReward
                    active={showRewards}
                    glow={true}
                    glowTone="gold"
                    className="w-full max-w-sm pt-2 space-y-1 text-center bg-stone-900/70 border border-amber-500/30 rounded-lg p-3 shadow"
                  >
                    <h4 className="text-xl font-semibold text-yellow-200">Rewards</h4>
                    <p className="text-lg text-white flex items-center justify-center gap-1.5">
                      <span>💰 Money:</span>
                      <span className="text-emerald-400 font-bold"><MotionNumber value={moneyValue(report.moneyGained)} prefix={moneySymbol()} /></span>
                    </p>
                    <p className="text-lg text-white flex items-center justify-center gap-1.5">
                      <span>🌟 Reputation:</span>
                      <span className="text-amber-300 font-bold"><MotionNumber value={report.reputationGained} prefix="+" /></span>
                    </p>
                    {report.assignedPerson.type === 'staff' && report.playerManagementXpGained > 0 && (
                      <p className="text-lg text-white flex items-center justify-center gap-1.5">
                        <span>🧠 Player Management XP:</span>
                        <span className="text-purple-400 font-bold"><MotionNumber value={report.playerManagementXpGained} prefix="+" /></span>
                      </p>
                    )}
                  </MotionReward>
                )}
              </div>

              {/* Right Column: Overall Quality & Skill Progression */}
              <div className="space-y-4">
                {showOverallQuality && (
                  <div className="p-3 bg-stone-900/80 border border-yellow-500/40 rounded-lg shadow text-center">
                    <h3 className="text-2xl font-bold text-center text-yellow-300 mb-1">
                      Overall Quality: <AnimatedNumber targetValue={report.overallQualityScore} duration={1000} className="text-3xl" /> / 100
                    </h3>
                    <Progress value={animatedOverallQualityValue} className="h-5 bg-stone-700 [&>*]:bg-green-500 transition-all duration-300" />
                  </div>
                )}

                {report.skillBreakdown.length > 0 && (
                  <div className="bg-stone-950/60 border border-stone-800/80 rounded-lg p-3 space-y-2">
                    <h4 className="text-xl font-semibold text-yellow-200 mb-2">Skill Progression ({report.assignedPerson.name})</h4>
                    <ul className="space-y-2">
                      {report.skillBreakdown.map((skillDetail, index) => (
                        <SkillDisplay 
                          key={skillDetail.skillName} 
                          skillDetail={skillDetail}
                          startAnimation={currentSkillIndex === index}
                          skipped={skipped}
                          onAnimationComplete={handleNextAnimation} 
                        />
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          {rankStamp && (
            <RankRevealOverlay
              rank={rankStamp.rank}
              pointsToNext={rankStamp.pointsToNext}
              nextRank={rankStamp.nextRank}
              onDone={() => setRankStamp(null)}
            />
          )}
          <CardFooter className="shrink-0 p-4 border-t border-stone-800/80 bg-stone-950/90">
            {showContinueButton ? (
              <MotionButton
                onClick={() => {
                  // Play sound before calling onClose, as onClose might unmount the component
                  gameAudio.playSound('button_click', 'sfx'); 
                  onClose();
                }} 
                className="w-full bg-amber-400/[0.14] ring-1 ring-inset ring-amber-400/45 hover:bg-amber-400/[0.24] text-amber-100 font-bold text-lg py-3 rounded"
              >
                Awesome!
              </MotionButton>
            ) : (
              <div className="flex w-full items-center justify-between gap-3">
                <span className="text-stone-400 italic">Calculating...</span>
                <button
                  type="button"
                  onClick={skipReveal}
                  className="rounded border border-amber-400/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-200 hover:bg-amber-400/15"
                >
                  Skip (Space)
                </button>
              </div>
            )}
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
