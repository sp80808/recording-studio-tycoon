import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';

// Interfaces
interface PlayerAttributes {
  focusMastery: number;
  creativeIntuition: number;
  technicalAptitude: number;
  businessAcumen: number;
}

interface PlayerData {
  xp: number;
  level: number;
  xpToNextLevel: number;
  perkPoints: number;
  attributes: PlayerAttributes;
}

interface StudioSkill {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
}

interface ProjectStage {
  stageName: string;
  focusAreas: string[];
  workUnitsBase: number;
  workUnitsCompleted: number;
}

interface Project {
  id: string;
  title: string;
  genre: string;
  clientType: string;
  difficulty: number;
  durationDaysTotal: number;
  payoutBase: number;
  repGainBase: number;
  requiredSkills: Record<string, number>;
  stages: ProjectStage[];
  matchRating: 'Poor' | 'Good' | 'Excellent';
  accumulatedCPoints: number;
  accumulatedTPoints: number;
  currentStageIndex: number;
}

interface Engineer {
  id: string;
  name: string;
  primarySkill: string;
  skillLevel: number;
  efficiency: number;
  speedMultiplier: number;
  salary: number;
  energy: number;
  status: 'Idle' | 'Working' | 'Resting';
}

interface GameState {
  money: number;
  reputation: number;
  currentDay: number;
  playerData: PlayerData;
  studioSkills: Record<string, StudioSkill>;
  ownedUpgrades: string[];
  availableProjects: Project[];
  activeProject: Project | null;
  hiredStaff: Engineer[];
  candidateEngineers: Engineer[];
}

const MusicStudioTycoon = () => {
  const [gameState, setGameState] = useState<GameState>({
    money: 1000,
    reputation: 10,
    currentDay: 2,
    playerData: {
      xp: 0,
      level: 1,
      xpToNextLevel: 100,
      perkPoints: 0,
      attributes: {
        focusMastery: 1,
        creativeIntuition: 1,
        technicalAptitude: 1,
        businessAcumen: 1
      }
    },
    studioSkills: {
      Rock: { name: 'Rock', level: 1, xp: 0, xpToNext: 20 },
      Pop: { name: 'Pop', level: 1, xp: 0, xpToNext: 20 },
      Electronic: { name: 'Electronic', level: 1, xp: 0, xpToNext: 20 },
      Hiphop: { name: 'Hip-hop', level: 1, xp: 0, xpToNext: 20 },
      Acoustic: { name: 'Acoustic', level: 1, xp: 0, xpToNext: 20 }
    },
    ownedUpgrades: [],
    availableProjects: [],
    activeProject: null,
    hiredStaff: [],
    candidateEngineers: []
  });

  const [focusAllocation, setFocusAllocation] = useState({
    performance: 50,
    soundCapture: 50,
    layering: 50
  });

  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showAttributesModal, setShowAttributesModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [lastReview, setLastReview] = useState<any>(null);
  const orbContainerRef = useRef<HTMLDivElement>(null);

  // Initialize game
  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    const initialProjects = generateNewProjects(3);
    setGameState(prev => ({
      ...prev,
      availableProjects: initialProjects,
      candidateEngineers: generateCandidateEngineers(3)
    }));
  };

  const generateNewProjects = (count: number): Project[] => {
    const genres = ['Rock', 'Pop', 'Electronic', 'Hip-hop', 'Acoustic'];
    const clientTypes = ['Indie Band', 'Record Label', 'Artist', 'Commercial'];
    const projects: Project[] = [];

    for (let i = 0; i < count; i++) {
      const genre = genres[Math.floor(Math.random() * genres.length)];
      const difficulty = Math.floor(Math.random() * 5) + 1;
      const project: Project = {
        id: `project_${Date.now()}_${i}`,
        title: `${genre} ${['Anthem', 'Song', 'Track', 'Piece'][Math.floor(Math.random() * 4)]}`,
        genre,
        clientType: clientTypes[Math.floor(Math.random() * clientTypes.length)],
        difficulty,
        durationDaysTotal: difficulty + 2,
        payoutBase: 200 + (difficulty * 100),
        repGainBase: difficulty + 2,
        requiredSkills: { [genre]: difficulty },
        stages: [
          {
            stageName: 'Pre-production',
            focusAreas: ['planning', 'arrangement'],
            workUnitsBase: 10,
            workUnitsCompleted: 0
          },
          {
            stageName: 'Recording & Production',
            focusAreas: ['performance', 'soundCapture', 'layering'],
            workUnitsBase: 15,
            workUnitsCompleted: 0
          },
          {
            stageName: 'Mixing & Mastering',
            focusAreas: ['mixing', 'mastering'],
            workUnitsBase: 8,
            workUnitsCompleted: 0
          }
        ],
        matchRating: 'Good',
        accumulatedCPoints: 0,
        accumulatedTPoints: 0,
        currentStageIndex: 0
      };
      projects.push(project);
    }
    return projects;
  };

  const generateCandidateEngineers = (count: number): Engineer[] => {
    const names = ['Alex Rivera', 'Sam Chen', 'Jordan Blake', 'Casey Smith', 'Taylor Johnson'];
    const skills = ['Rock', 'Pop', 'Electronic', 'Hip-hop', 'Acoustic'];
    const engineers: Engineer[] = [];

    for (let i = 0; i < count; i++) {
      engineers.push({
        id: `engineer_${Date.now()}_${i}`,
        name: names[Math.floor(Math.random() * names.length)],
        primarySkill: skills[Math.floor(Math.random() * skills.length)],
        skillLevel: Math.floor(Math.random() * 5) + 1,
        efficiency: 0.8 + (Math.random() * 0.4),
        speedMultiplier: 1 + (Math.random() * 0.5),
        salary: 100 + Math.floor(Math.random() * 200),
        energy: 100,
        status: 'Idle'
      });
    }
    return engineers;
  };

  const startProject = (project: Project) => {
    if (gameState.activeProject) {
      toast({
        title: "Project Already Active",
        description: "Complete your current project before starting another.",
        variant: "destructive"
      });
      return;
    }

    setGameState(prev => ({
      ...prev,
      activeProject: { ...project, currentStageIndex: 0 },
      availableProjects: prev.availableProjects.filter(p => p.id !== project.id)
    }));

    toast({
      title: "Project Started!",
      description: `Now working on: ${project.title}`,
    });
  };

  const createOrb = (type: 'creativity' | 'technical', amount: number) => {
    if (!orbContainerRef.current) return;

    const orb = document.createElement('div');
    orb.className = `orb ${type}`;
    orb.textContent = `+${amount}`;
    
    // Random starting position in work area
    const startX = Math.random() * 200;
    const startY = Math.random() * 100;
    orb.style.left = `${startX}px`;
    orb.style.top = `${startY}px`;

    orbContainerRef.current.appendChild(orb);

    // Animate to target
    setTimeout(() => {
      const targetElement = document.getElementById(type === 'creativity' ? 'creativity-points' : 'technical-points');
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const containerRect = orbContainerRef.current!.getBoundingClientRect();
        const targetX = rect.left - containerRect.left;
        const targetY = rect.top - containerRect.top;
        
        orb.style.transform = `translate(${targetX - startX}px, ${targetY - startY}px)`;
        orb.style.opacity = '0';
      }
    }, 100);

    // Remove after animation
    setTimeout(() => {
      if (orb.parentNode) {
        orb.parentNode.removeChild(orb);
      }
    }, 1500);
  };

  const processStageWork = () => {
    if (!gameState.activeProject) return;

    const project = gameState.activeProject;
    const currentStage = project.stages[project.currentStageIndex];
    
    // Calculate points based on focus allocation and player attributes
    const creativityGain = Math.floor(
      (focusAllocation.performance / 100) * 5 * gameState.playerData.attributes.creativeIntuition
    );
    const technicalGain = Math.floor(
      (focusAllocation.soundCapture / 100) * 5 * gameState.playerData.attributes.technicalAptitude
    );

    // Create orb animations
    createOrb('creativity', creativityGain);
    createOrb('technical', technicalGain);

    // Update project progress
    const updatedProject = {
      ...project,
      accumulatedCPoints: project.accumulatedCPoints + creativityGain,
      accumulatedTPoints: project.accumulatedTPoints + technicalGain,
      stages: project.stages.map((stage, index) => 
        index === project.currentStageIndex 
          ? { ...stage, workUnitsCompleted: Math.min(stage.workUnitsCompleted + 2, stage.workUnitsBase) }
          : stage
      )
    };

    setGameState(prev => ({ ...prev, activeProject: updatedProject }));

    // Check if stage is complete
    if (currentStage.workUnitsCompleted + 2 >= currentStage.workUnitsBase) {
      if (project.currentStageIndex + 1 >= project.stages.length) {
        // Project complete
        completeProject(updatedProject);
      } else {
        // Move to next stage
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            activeProject: prev.activeProject ? {
              ...prev.activeProject,
              currentStageIndex: prev.activeProject.currentStageIndex + 1
            } : null
          }));
          toast({
            title: "Stage Complete!",
            description: `Moving to: ${project.stages[project.currentStageIndex + 1].stageName}`,
          });
        }, 1000);
      }
    }
  };

  const completeProject = (project: Project) => {
    const qualityScore = (project.accumulatedCPoints + project.accumulatedTPoints) / 20;
    const payout = Math.floor(project.payoutBase * (0.8 + qualityScore * 0.4));
    const repGain = Math.floor(project.repGainBase * (0.8 + qualityScore * 0.4));
    const xpGain = 25 + Math.floor(qualityScore * 10);

    const review = {
      projectTitle: project.title,
      qualityScore: Math.min(100, Math.floor(qualityScore * 10)),
      payout,
      repGain,
      xpGain,
      creativityPoints: project.accumulatedCPoints,
      technicalPoints: project.accumulatedTPoints
    };

    setLastReview(review);
    setShowReviewModal(true);

    // Update game state
    setGameState(prev => ({
      ...prev,
      money: prev.money + payout,
      reputation: prev.reputation + repGain,
      activeProject: null,
      availableProjects: [...prev.availableProjects, ...generateNewProjects(1)],
      playerData: {
        ...prev.playerData,
        xp: prev.playerData.xp + xpGain
      }
    }));

    // Check for level up
    if (gameState.playerData.xp + xpGain >= gameState.playerData.xpToNextLevel) {
      levelUpPlayer();
    }
  };

  const levelUpPlayer = () => {
    setGameState(prev => ({
      ...prev,
      playerData: {
        ...prev.playerData,
        level: prev.playerData.level + 1,
        perkPoints: prev.playerData.perkPoints + 1,
        xpToNextLevel: prev.playerData.xpToNextLevel + 50
      }
    }));

    toast({
      title: "Level Up!",
      description: `You are now level ${gameState.playerData.level + 1}! You gained a perk point.`,
    });
  };

  const spendPerkPoint = (attribute: keyof PlayerAttributes) => {
    if (gameState.playerData.perkPoints <= 0) return;

    setGameState(prev => ({
      ...prev,
      playerData: {
        ...prev.playerData,
        perkPoints: prev.playerData.perkPoints - 1,
        attributes: {
          ...prev.playerData.attributes,
          [attribute]: prev.playerData.attributes[attribute] + 1
        }
      }
    }));

    toast({
      title: "Attribute Upgraded!",
      description: `${attribute} increased to ${gameState.playerData.attributes[attribute] + 1}`,
    });
  };

  const hireEngineer = (engineerId: string) => {
    const engineer = gameState.candidateEngineers.find(e => e.id === engineerId);
    if (!engineer || gameState.money < engineer.salary) return;

    setGameState(prev => ({
      ...prev,
      money: prev.money - engineer.salary,
      hiredStaff: [...prev.hiredStaff, engineer],
      candidateEngineers: prev.candidateEngineers.filter(e => e.id !== engineerId)
    }));

    toast({
      title: "Engineer Hired!",
      description: `${engineer.name} has joined your studio.`,
    });
  };

  const advanceDay = () => {
    setGameState(prev => ({ ...prev, currentDay: prev.currentDay + 1 }));
    
    // Process active project if exists
    if (gameState.activeProject) {
      processStageWork();
    }
  };

  // Add CSS styles dynamically
  useEffect(() => {
    const styleId = 'orb-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .orb {
          position: absolute;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          transition: all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          pointer-events: none;
          z-index: 1000;
        }
        
        .orb.creativity {
          background: linear-gradient(45deg, #3b82f6, #60a5fa);
          color: white;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
        }
        
        .orb.technical {
          background: linear-gradient(45deg, #10b981, #34d399);
          color: white;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.5);
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-green-900 text-white">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 bg-black/30 backdrop-blur-sm">
        <div className="flex gap-6">
          <div className="text-green-400 font-bold">${gameState.money.toLocaleString()}</div>
          <div className="text-blue-400">{gameState.reputation} Reputation</div>
          <div className="text-yellow-400">Day {gameState.currentDay}</div>
          <div className="text-purple-400">Level {gameState.playerData.level}</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <div>Music Studio Tycoon</div>
            <div className="text-gray-400">
              {gameState.activeProject ? `Working: ${gameState.activeProject.title}` : 'No Active Project'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 p-4 h-[calc(100vh-80px)]">
        {/* Left Panel - Available Projects */}
        <div className="w-80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Available Projects</h2>
            <Button 
              onClick={() => setGameState(prev => ({ 
                ...prev, 
                availableProjects: [...prev.availableProjects, ...generateNewProjects(1)] 
              }))}
              size="sm"
            >
              Refresh
            </Button>
          </div>

          {gameState.activeProject && (
            <Card className="p-4 bg-blue-900/50 border-blue-500">
              <div className="text-sm text-blue-300 mb-2">Currently working on a project.</div>
              <div className="text-xs text-gray-400">Complete it before taking another.</div>
            </Card>
          )}

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {gameState.availableProjects.map(project => (
              <Card key={project.id} className="p-4 bg-gray-800/50 hover:bg-gray-700/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{project.title}</h3>
                  <span className="text-xs bg-red-600 px-2 py-1 rounded">{project.clientType}</span>
                </div>
                <div className="text-sm space-y-1">
                  <div>Genre: {project.genre}</div>
                  <div>Difficulty: {project.difficulty}</div>
                  <div className="text-green-400">${project.payoutBase}</div>
                  <div className="text-blue-400">+{project.repGainBase} Rep</div>
                  <div className="text-yellow-400">{project.durationDaysTotal} days</div>
                </div>
                <Button 
                  onClick={() => startProject(project)}
                  disabled={!!gameState.activeProject}
                  className="w-full mt-3"
                  size="sm"
                >
                  Start Project
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Central Area */}
        <div className="flex-1 relative">
          {gameState.activeProject ? (
            <div className="space-y-6">
              {/* Active Project Dashboard */}
              <Card className="p-6 bg-black/30">
                <h2 className="text-2xl font-bold mb-2">Working on: {gameState.activeProject.title}</h2>
                <div className="text-lg mb-4">
                  Stage {gameState.activeProject.currentStageIndex + 1} of {gameState.activeProject.stages.length}: {gameState.activeProject.stages[gameState.activeProject.currentStageIndex].stageName}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div id="creativity-points" className="text-center">
                    <div className="text-3xl mb-2">💙</div>
                    <div className="text-xl font-bold">{gameState.activeProject.accumulatedCPoints}</div>
                    <div className="text-sm text-gray-400">Creativity</div>
                  </div>
                  <div id="technical-points" className="text-center">
                    <div className="text-3xl mb-2">💚</div>
                    <div className="text-xl font-bold">{gameState.activeProject.accumulatedTPoints}</div>
                    <div className="text-sm text-gray-400">Technical</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Focus Allocation:</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Performance</span>
                        <span>{focusAllocation.performance}%</span>
                      </div>
                      <Slider
                        value={[focusAllocation.performance]}
                        onValueChange={(value) => setFocusAllocation(prev => ({ ...prev, performance: value[0] }))}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Sound Capture</span>
                        <span>{focusAllocation.soundCapture}%</span>
                      </div>
                      <Slider
                        value={[focusAllocation.soundCapture]}
                        onValueChange={(value) => setFocusAllocation(prev => ({ ...prev, soundCapture: value[0] }))}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Layering</span>
                        <span>{focusAllocation.layering}%</span>
                      </div>
                      <Slider
                        value={[focusAllocation.layering]}
                        onValueChange={(value) => setFocusAllocation(prev => ({ ...prev, layering: value[0] }))}
                        max={100}
                        step={1}
                      />
                    </div>
                  </div>

                  <Button onClick={processStageWork} className="w-full" size="lg">
                    Complete {gameState.activeProject.stages[gameState.activeProject.currentStageIndex].stageName} & Proceed
                  </Button>
                </div>

                <div className="mt-4">
                  <div className="text-sm text-gray-400 mb-2">Stage Progress</div>
                  <Progress 
                    value={(gameState.activeProject.stages[gameState.activeProject.currentStageIndex].workUnitsCompleted / gameState.activeProject.stages[gameState.activeProject.currentStageIndex].workUnitsBase) * 100} 
                  />
                </div>
              </Card>

              {/* Orb Animation Container */}
              <div ref={orbContainerRef} className="absolute inset-0 pointer-events-none z-10"></div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Card className="p-8 text-center bg-black/30">
                <div className="text-6xl mb-4">🎵</div>
                <h2 className="text-2xl font-bold mb-2">Studio Ready</h2>
                <p className="text-gray-400">Select a project from the left panel to get started</p>
              </Card>
            </div>
          )}
        </div>

        {/* Right Panel - Upgrades & Controls */}
        <div className="w-80 space-y-4">
          <div className="space-y-2">
            <Dialog open={showSkillsModal} onOpenChange={setShowSkillsModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">View Studio Skills</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Studio Skills</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  {Object.values(gameState.studioSkills).map(skill => (
                    <div key={skill.name} className="flex justify-between items-center">
                      <span>{skill.name}</span>
                      <div className="text-right">
                        <div className="font-bold">Level {skill.level}</div>
                        <div className="text-sm text-gray-400">{skill.xp}/{skill.xpToNext}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAttributesModal} onOpenChange={setShowAttributesModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Player Attributes ({gameState.playerData.perkPoints} points)
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Player Attributes</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-sm text-gray-400">Available Perk Points: {gameState.playerData.perkPoints}</div>
                  {Object.entries(gameState.playerData.attributes).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{value}</span>
                        <Button
                          size="sm"
                          onClick={() => spendPerkPoint(key as keyof PlayerAttributes)}
                          disabled={gameState.playerData.perkPoints <= 0}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            <Button onClick={advanceDay} className="w-full">Next Day</Button>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">Upgrades</h3>
            <div className="space-y-3">
              <Card className="p-4 bg-gray-800/50">
                <h4 className="font-semibold text-green-400">Pro Mic Bundle</h4>
                <p className="text-sm text-gray-400 mt-1">Professional microphones for better acoustic and pop recordings</p>
                <div className="mt-2 text-sm">Skills: acoustic +2, pop +1</div>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-green-400 font-bold">$800</span>
                  <Button size="sm" disabled={gameState.money < 800}>Purchase</Button>
                </div>
              </Card>

              <Card className="p-4 bg-gray-800/50">
                <h4 className="font-semibold text-yellow-400">Faster DAW</h4>
                <p className="text-sm text-gray-400 mt-1">Upgraded digital audio workstation for faster project completion</p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-green-400 font-bold">$1200</span>
                  <Button size="sm" disabled={gameState.money < 1200}>Purchase</Button>
                </div>
              </Card>
            </div>
          </div>

          {gameState.candidateEngineers.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3">Hiring</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {gameState.candidateEngineers.map(engineer => (
                  <Card key={engineer.id} className="p-3 bg-gray-800/50">
                    <h4 className="font-semibold">{engineer.name}</h4>
                    <div className="text-sm text-gray-400">
                      <div>{engineer.primarySkill} - Level {engineer.skillLevel}</div>
                      <div>Efficiency: {Math.floor(engineer.efficiency * 100)}%</div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-red-400">${engineer.salary}</span>
                      <Button 
                        size="sm" 
                        onClick={() => hireEngineer(engineer.id)}
                        disabled={gameState.money < engineer.salary}
                      >
                        Hire
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Project Complete! 🎉</DialogTitle>
          </DialogHeader>
          {lastReview && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{lastReview.projectTitle}</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl">💙</div>
                  <div className="font-bold">{lastReview.creativityPoints}</div>
                  <div className="text-sm text-gray-400">Creativity</div>
                </div>
                <div>
                  <div className="text-2xl">💚</div>
                  <div className="font-bold">{lastReview.technicalPoints}</div>
                  <div className="text-sm text-gray-400">Technical</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">⭐</div>
                <div className="text-xl font-bold">Quality Score: {lastReview.qualityScore}%</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Payment:</span>
                  <span className="text-green-400 font-bold">${lastReview.payout}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reputation:</span>
                  <span className="text-blue-400 font-bold">+{lastReview.repGain}</span>
                </div>
                <div className="flex justify-between">
                  <span>Experience:</span>
                  <span className="text-purple-400 font-bold">+{lastReview.xpGain} XP</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MusicStudioTycoon;
