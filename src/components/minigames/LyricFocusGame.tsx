import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LyricFocusGameState, LyricFocusKeyword, LyricFocusTheme, MinigameType } from '@/types/miniGame';
import { MusicGenre } from '@/types/charts';
import { getLyricFocusThemeForProject } from '@/data/lyricFocusData';
import { gameAudio } from '@/utils/audioSystem';
import { cn } from "@/lib/utils";

interface LyricFocusGameProps {
  onComplete: (score: number, lyricalQualityBonus: number) => void;
  onClose: () => void;
  genre: MusicGenre;
  mood?: string; // Optional mood to help select a theme
  difficulty: number; // 1-10 scale
}

const MAX_SELECTIONS = 7;
const BASE_TIME_LIMIT = 45; // seconds

export const LyricFocusGame: React.FC<LyricFocusGameProps> = ({
  onComplete,
  onClose,
  genre,
  mood,
  difficulty,
}) => {
  const [gameState, setGameState] = useState<LyricFocusGameState | null>(null);
  const [timeLeft, setTimeLeft] = useState(BASE_TIME_LIMIT);
  const [score, setScore] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  const initializeGame = useCallback(() => {
    const theme = getLyricFocusThemeForProject(genre, mood);
    // Adjust keyword pool size or relevance based on difficulty
    const keywordPoolSize = 15 + Math.floor(difficulty * 1.5); // e.g., 15-30 keywords
    
    // Shuffle and select keywords for the pool, ensuring some distractors
    const shuffledKeywords = [...theme.keywords]. sort(() => 0.5 - Math.random());
    const availableKeywords = shuffledKeywords.slice(0, keywordPoolSize);

    const timeLimit = BASE_TIME_LIMIT - (difficulty - 1) * 2; // Harder = less time

    setGameState({
      isActive: true,
      currentType: 'lyricFocus' as MinigameType,
      difficulty,
      timeRemaining: timeLimit, // Will be handled by separate timeLeft state
      score: 0, // Initial score, will be handled by separate score state
      progress: 0,
      targetTheme: theme,
      availableKeywords,
      selectedKeywords: [],
      maxSelections: MAX_SELECTIONS,
    });
    setTimeLeft(timeLimit);
    setScore(0);
    setFeedbackMessage(`Focus on: ${theme.name} (${theme.mood})`);
    gameAudio.playClick();
  }, [genre, mood, difficulty]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    if (!gameState || !gameState.isActive || timeLeft <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.isActive]); // Dependency on gameState.isActive to restart timer if game resets

  const handleKeywordSelect = (keyword: LyricFocusKeyword) => {
    if (!gameState || !gameState.isActive) return;

    setGameState(prev => {
      if (!prev) return null;
      let newSelectedKeywords = [...prev.selectedKeywords];
      const isSelected = newSelectedKeywords.find(k => k.id === keyword.id);

      if (isSelected) {
        newSelectedKeywords = newSelectedKeywords.filter(k => k.id !== keyword.id);
        gameAudio.playClick();
      } else {
        if (newSelectedKeywords.length < MAX_SELECTIONS) {
          newSelectedKeywords.push(keyword);
          gameAudio.playClick();
        } else {
          setFeedbackMessage(`Max ${MAX_SELECTIONS} keywords allowed!`);
          setTimeout(() => setFeedbackMessage(''), 2000);
          gameAudio.playError();
          return prev; // No change if max selections reached
        }
      }
      return { ...prev, selectedKeywords: newSelectedKeywords };
    });
  };

  const calculateFinalScore = useCallback(() => {
    if (!gameState) return 0;
    let currentScore = 0;
    gameState.selectedKeywords.forEach(kw => {
      switch (kw.relevance) {
        case 'high': currentScore += 20; break;
        case 'medium': currentScore += 10; break;
        case 'low': currentScore += 5; break;
        case 'distractor': currentScore -= 10; break;
      }
      if (kw.isGolden) currentScore += 15; // Bonus for golden keywords
    });

    // Time bonus: up to 20 points for finishing early
    const timeBonus = Math.max(0, Math.floor(timeLeft / (BASE_TIME_LIMIT / 20) ));
    currentScore += timeBonus;
    
    // Normalize to 0-100
    const maxPossibleScoreFromKeywords = MAX_SELECTIONS * 20 + (gameState.targetTheme.keywords.filter(k=>k.isGolden).length * 15); // Rough max
    const normalizedScore = Math.max(0, Math.min(100, (currentScore / (maxPossibleScoreFromKeywords * 0.75 + 20)) * 100)); // Normalize, assuming not all golden are picked

    return Math.round(normalizedScore);
  }, [gameState, timeLeft]);

  const endGame = useCallback(() => {
    if (!gameState || !gameState.isActive) return;

    const finalScore = calculateFinalScore();
    setScore(finalScore);
    setGameState(prev => prev ? { ...prev, isActive: false, score: finalScore } : null);
    
    const lyricalQualityBonus = Math.floor(finalScore / 10); // e.g., 0-10 bonus points
    onComplete(finalScore, lyricalQualityBonus);
    gameAudio.playSuccess();
    setFeedbackMessage(`Minigame Over! Score: ${finalScore}. Lyrical Quality Bonus: +${lyricalQualityBonus}`);
  }, [gameState, calculateFinalScore, onComplete]);

  if (!gameState) {
    return <div className="p-4 text-center">Loading Lyric Focus Minigame...</div>;
  }

  const progressPercent = ((BASE_TIME_LIMIT - timeLeft) / BASE_TIME_LIMIT) * 100;

  return (
    <Card className="w-full max-w-2xl mx-auto my-4 shadow-xl bg-slate-800 text-gray-100 border-slate-700">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-purple-400">Lyric Focus Challenge</CardTitle>
        <CardDescription className="text-slate-400">
          Select keywords that best fit the theme: <strong className="text-purple-300">{gameState.targetTheme.name}</strong> ({gameState.targetTheme.mood})
        </CardDescription>
        <div className="flex justify-between items-center mt-2">
          <Badge variant="secondary" className="text-lg">Time: {timeLeft}s</Badge>
          <Badge variant="outline" className="text-lg border-purple-400 text-purple-400">Score: {score}</Badge>
        </div>
        <Progress value={progressPercent} className="w-full mt-2 h-2 bg-slate-700 [&>*]:bg-purple-500" />
      </CardHeader>
      <CardContent>
        {feedbackMessage && <p className="text-center text-yellow-400 mb-3 animate-pulse">{feedbackMessage}</p>}
        
        <div className="mb-4">
          <h4 className="font-semibold mb-2 text-lg text-slate-300">Available Keywords:</h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {gameState.availableKeywords.map(kw => (
              <Button
                key={kw.id}
                variant={gameState.selectedKeywords.find(k => k.id === kw.id) ? "default" : "outline"}
                onClick={() => handleKeywordSelect(kw)}
                className={cn(
                  "h-auto p-2 text-xs sm:text-sm transition-all duration-150 ease-in-out",
                  gameState.selectedKeywords.find(k => k.id === kw.id) 
                    ? "bg-purple-600 hover:bg-purple-700 text-white ring-2 ring-purple-400" 
                    : "bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200"
                )}
                disabled={!gameState.isActive}
              >
                {kw.text}
              </Button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold mb-2 text-lg text-slate-300">Selected Ideas ({gameState.selectedKeywords.length}/{MAX_SELECTIONS}):</h4>
          {gameState.selectedKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2 p-2 border border-slate-700 rounded-md bg-slate-900 min-h-[40px]">
              {gameState.selectedKeywords.map(kw => (
                <Badge key={kw.id} variant="secondary" className="text-sm bg-purple-500 text-white">
                  {kw.text}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 italic">Select up to {MAX_SELECTIONS} keywords...</p>
          )}
        </div>

        {gameState.isActive ? (
          <Button onClick={endGame} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg">
            Finalize Lyrical Focus
          </Button>
        ) : (
          <Button onClick={onClose} className="w-full bg-slate-600 hover:bg-slate-500 text-white py-3 text-lg">
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
