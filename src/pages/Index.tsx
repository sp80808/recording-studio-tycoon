
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

interface StaffMember {
  id: string;
  name: string;
  role: 'Engineer' | 'Producer' | 'Songwriter';
  primaryStats: {
    creativity: number;
    technical: number;
    speed: number;
  };
  xpInRole: number;
  levelInRole: number;
  genreAffinity: { genre: string; bonus: number } | null;
  energy: number;
  salary: number;
  status: 'Idle' | 'Working' | 'Resting';
  assignedProjectId: string | null;
}

interface Equipment {
  id: string;
  name: string;
  category: 'microphone' | 'monitor' | 'interface' | 'processor' | 'instrument';
  price: number;
  description: string;
  bonuses: {
    genreBonus?: Record<string, number>;
    qualityBonus?: number;
    speedBonus?: number;
    creativityBonus?: number;
    technicalBonus?: number;
  };
  icon: string;
}

interface GameState {
  money: number;
  reputation: number;
  currentDay: number;
  playerData: PlayerData;
  studioSkills: Record<string, StudioSkill>;
  ownedUpgrades: string[];
  ownedEquipment: Equipment[];
  availableProjects: Project[];
  activeProject: Project | null;
  hiredStaff: StaffMember[];
  availableCandidates: StaffMember[];
  lastSalaryDay: number;
}

const MusicStudioTycoon = () => {
  const [gameState, setGameState] = useState<GameState>({
    money: 2000,
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
    ownedEquipment: [
      {
        id: 'basic_mic',
        name: 'Basic USB Mic',
        category: 'microphone',
        price: 0,
        description: 'Standard starter microphone',
        bonuses: { qualityBonus: 0 },
        icon: '🎤'
      },
      {
        id: 'basic_monitors',
        name: 'Basic Speakers',
        category: 'monitor',
        price: 0,
        description: 'Standard studio monitors',
        bonuses: { qualityBonus: 0 },
        icon: '🔊'
      }
    ],
    availableProjects: [],
    activeProject: null,
    hiredStaff: [],
    availableCandidates: [],
    lastSalaryDay: 0
  });

  const [focusAllocation, setFocusAllocation] = useState({
    performance: 50,
    soundCapture: 50,
    layering: 50
  });

  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showAttributesModal, setShowAttributesModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showRecruitmentModal, setShowRecruitmentModal] = useState(false);
  const [lastReview, setLastReview] = useState<any>(null);
  const orbContainerRef = useRef<HTMLDivElement>(null);

  const availableEquipment: Equipment[] = [
    {
      id: 'condenser_mic',
      name: 'Professional Condenser Mic',
      category: 'microphone',
      price: 450,
      description: 'High-quality condenser microphone perfect for vocals and acoustic instruments',
      bonuses: { genreBonus: { Acoustic: 2, Pop: 1 }, qualityBonus: 10 },
      icon: '🎤'
    },
    {
      id: 'dynamic_mic',
      name: 'Dynamic Recording Mic',
      category: 'microphone',
      price: 320,
      description: 'Robust dynamic microphone ideal for rock and live recordings',
      bonuses: { genreBonus: { Rock: 2, Hiphop: 1 }, qualityBonus: 8 },
      icon: '🎤'
    },
    {
      id: 'studio_monitors',
      name: 'Studio Monitor Pair',
      category: 'monitor',
      price: 800,
      description: 'Professional studio monitors for accurate sound reproduction',
      bonuses: { qualityBonus: 15, technicalBonus: 5 },
      icon: '🔊'
    },
    {
      id: 'audio_interface',
      name: 'Audio Interface',
      category: 'interface',
      price: 350,
      description: 'Multi-channel audio interface for professional recording',
      bonuses: { qualityBonus: 12, speedBonus: 10 },
      icon: '🔌'
    },
    {
      id: 'compressor',
      name: 'Hardware Compressor',
      category: 'processor',
      price: 600,
      description: 'Analog compressor for that warm, professional sound',
      bonuses: { qualityBonus: 20, technicalBonus: 8 },
      icon: '⚙️'
    },
    {
      id: 'synthesizer',
      name: 'Analog Synthesizer',
      category: 'instrument',
      price: 1200,
      description: 'Vintage-style analog synthesizer for electronic music production',
      bonuses: { genreBonus: { Electronic: 3, Pop: 1 }, creativityBonus: 15 },
      icon: '🎹'
    },
    {
      id: 'guitar_amp',
      name: 'Tube Guitar Amplifier',
      category: 'instrument',
      price: 900,
      description: 'Classic tube amplifier for that perfect rock guitar tone',
      bonuses: { genreBonus: { Rock: 3, Acoustic: 1 }, creativityBonus: 10 },
      icon: '🎸'
    }
  ];

  // Initialize game
  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    const initialProjects = generateNewProjects(3);
    const initialCandidates = generateCandidates(3);
    setGameState(prev => ({
      ...prev,
      availableProjects: initialProjects,
      availableCandidates: initialCandidates
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

  const generateCandidates = (count: number): StaffMember[] => {
    const names = ['Alex Rivera', 'Sam Chen', 'Jordan Blake', 'Casey Smith', 'Taylor Johnson', 'Morgan Davis', 'Riley Parker', 'Avery Wilson', 'Quinn Martinez', 'Sage Thompson'];
    const roles: ('Engineer' | 'Producer' | 'Songwriter')[] = ['Engineer', 'Producer', 'Songwriter'];
    const genres = ['Rock', 'Pop', 'Electronic', 'Hip-hop', 'Acoustic'];
    const candidates: StaffMember[] = [];

    for (let i = 0; i < count; i++) {
      const role = roles[Math.floor(Math.random() * roles.length)];
      const hasAffinity = Math.random() > 0.6; // 40% chance of genre affinity
      
      const candidate: StaffMember = {
        id: '', // Will be assigned when hired
        name: names[Math.floor(Math.random() * names.length)],
        role,
        primaryStats: {
          creativity: 15 + Math.floor(Math.random() * 25), // 15-40 range
          technical: 15 + Math.floor(Math.random() * 25),
          speed: 15 + Math.floor(Math.random() * 25)
        },
        xpInRole: 0,
        levelInRole: 1,
        genreAffinity: hasAffinity ? {
          genre: genres[Math.floor(Math.random() * genres.length)],
          bonus: 10 + Math.floor(Math.random() * 15) // 10-25% bonus
        } : null,
        energy: 100,
        salary: 80 + Math.floor(Math.random() * 120), // $80-200 per week
        status: 'Idle',
        assignedProjectId: null
      };
      
      candidates.push(candidate);
    }
    return candidates;
  };

  const hireStaff = (candidateIndex: number): boolean => {
    const candidate = gameState.availableCandidates[candidateIndex];
    if (!candidate) return false;

    const signingFee = candidate.salary * 2;
    if (gameState.money < signingFee) {
      toast({
        title: "Insufficient Funds",
        description: `Need $${signingFee} to hire ${candidate.name} (2x salary signing fee)`,
        variant: "destructive"
      });
      return false;
    }

    const newStaff: StaffMember = {
      ...candidate,
      id: `staff_${Date.now()}_${Math.random()}`
    };

    setGameState(prev => ({
      ...prev,
      money: prev.money - signingFee,
      hiredStaff: [...prev.hiredStaff, newStaff],
      availableCandidates: prev.availableCandidates.filter((_, index) => index !== candidateIndex)
    }));

    toast({
      title: "Staff Hired!",
      description: `${candidate.name} has joined your studio as a ${candidate.role}.`,
    });

    return true;
  };

  const assignStaffToProject = (staffId: string) => {
    if (!gameState.activeProject) {
      toast({
        title: "No Active Project",
        description: "Start a project before assigning staff.",
        variant: "destructive"
      });
      return;
    }

    const staff = gameState.hiredStaff.find(s => s.id === staffId);
    if (!staff || staff.status !== 'Idle') return;

    // Check if role slot is available (max 1 of each role per project)
    const assignedStaff = gameState.hiredStaff.filter(s => s.assignedProjectId === gameState.activeProject?.id);
    const roleCount = assignedStaff.filter(s => s.role === staff.role).length;
    
    if (roleCount >= 1) {
      toast({
        title: "Role Slot Filled",
        description: `Already have a ${staff.role} assigned to this project.`,
        variant: "destructive"
      });
      return;
    }

    setGameState(prev => ({
      ...prev,
      hiredStaff: prev.hiredStaff.map(s => 
        s.id === staffId 
          ? { ...s, status: 'Working' as const, assignedProjectId: prev.activeProject?.id || null }
          : s
      )
    }));

    toast({
      title: "Staff Assigned",
      description: `${staff.name} is now working on the project.`,
    });
  };

  const unassignStaffFromProject = (staffId: string) => {
    setGameState(prev => ({
      ...prev,
      hiredStaff: prev.hiredStaff.map(s => 
        s.id === staffId 
          ? { ...s, status: 'Idle' as const, assignedProjectId: null }
          : s
      )
    }));

    const staff = gameState.hiredStaff.find(s => s.id === staffId);
    toast({
      title: "Staff Unassigned",
      description: `${staff?.name} is now idle.`,
    });
  };

  const toggleStaffRest = (staffId: string) => {
    const staff = gameState.hiredStaff.find(s => s.id === staffId);
    if (!staff || staff.status === 'Working') return;

    const newStatus = staff.status === 'Idle' ? 'Resting' : 'Idle';
    
    setGameState(prev => ({
      ...prev,
      hiredStaff: prev.hiredStaff.map(s => 
        s.id === staffId 
          ? { ...s, status: newStatus as 'Idle' | 'Resting' }
          : s
      )
    }));
  };

  const addStaffXP = (staffId: string, amount: number) => {
    setGameState(prev => ({
      ...prev,
      hiredStaff: prev.hiredStaff.map(s => {
        if (s.id === staffId) {
          const newXP = s.xpInRole + amount;
          const xpForNextLevel = s.levelInRole * 50; // Scaling XP requirement
          
          if (newXP >= xpForNextLevel) {
            // Level up!
            const newLevel = s.levelInRole + 1;
            const statIncrease = 2;
            
            toast({
              title: "Staff Level Up!",
              description: `${s.name} reached level ${newLevel} in ${s.role}!`,
            });

            return {
              ...s,
              xpInRole: newXP - xpForNextLevel,
              levelInRole: newLevel,
              primaryStats: {
                creativity: s.primaryStats.creativity + statIncrease,
                technical: s.primaryStats.technical + statIncrease,
                speed: s.primaryStats.speed + statIncrease
              }
            };
          }
          
          return { ...s, xpInRole: newXP };
        }
        return s;
      })
    }));
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
    
    const startX = Math.random() * 200;
    const startY = Math.random() * 100;
    orb.style.left = `${startX}px`;
    orb.style.top = `${startY}px`;

    orbContainerRef.current.appendChild(orb);

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
    
    // Calculate base points from player attributes
    let creativityGain = Math.floor(
      (focusAllocation.performance / 100) * 5 * gameState.playerData.attributes.creativeIntuition
    );
    let technicalGain = Math.floor(
      (focusAllocation.soundCapture / 100) * 5 * gameState.playerData.attributes.technicalAptitude
    );

    // Add staff contributions
    const assignedStaff = gameState.hiredStaff.filter(s => s.assignedProjectId === project.id);
    
    assignedStaff.forEach(staff => {
      if (staff.energy < 20) {
        // Low energy penalty
        const penalty = 0.3;
        creativityGain += Math.floor(staff.primaryStats.creativity * 0.1 * penalty);
        technicalGain += Math.floor(staff.primaryStats.technical * 0.1 * penalty);
      } else {
        // Normal contribution
        let staffCreativity = Math.floor(staff.primaryStats.creativity * 0.15);
        let staffTechnical = Math.floor(staff.primaryStats.technical * 0.15);
        
        // Genre affinity bonus
        if (staff.genreAffinity && staff.genreAffinity.genre === project.genre) {
          const bonus = staff.genreAffinity.bonus / 100;
          staffCreativity += Math.floor(staffCreativity * bonus);
          staffTechnical += Math.floor(staffTechnical * bonus);
        }
        
        creativityGain += staffCreativity;
        technicalGain += staffTechnical;
      }
    });

    // Create orb animations
    createOrb('creativity', creativityGain);
    createOrb('technical', technicalGain);

    // Calculate work progress (staff speed affects this)
    let workProgress = 2;
    assignedStaff.forEach(staff => {
      if (staff.energy >= 20) {
        workProgress += Math.floor(staff.primaryStats.speed * 0.05);
      }
    });

    // Update project progress
    const updatedProject = {
      ...project,
      accumulatedCPoints: project.accumulatedCPoints + creativityGain,
      accumulatedTPoints: project.accumulatedTPoints + technicalGain,
      stages: project.stages.map((stage, index) => 
        index === project.currentStageIndex 
          ? { ...stage, workUnitsCompleted: Math.min(stage.workUnitsCompleted + workProgress, stage.workUnitsBase) }
          : stage
      )
    };

    setGameState(prev => ({ ...prev, activeProject: updatedProject }));

    // Deplete staff energy
    setGameState(prev => ({
      ...prev,
      hiredStaff: prev.hiredStaff.map(s => 
        s.assignedProjectId === project.id && s.status === 'Working'
          ? { ...s, energy: Math.max(0, s.energy - 15) }
          : s
      )
    }));

    // Check if stage is complete
    if (currentStage.workUnitsCompleted + workProgress >= currentStage.workUnitsBase) {
      if (project.currentStageIndex + 1 >= project.stages.length) {
        completeProject(updatedProject);
      } else {
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

    // Give XP to assigned staff
    const assignedStaff = gameState.hiredStaff.filter(s => s.assignedProjectId === project.id);
    assignedStaff.forEach(staff => {
      addStaffXP(staff.id, 20 + Math.floor(qualityScore * 5));
    });

    // Unassign staff from completed project
    setGameState(prev => ({
      ...prev,
      money: prev.money + payout,
      reputation: prev.reputation + repGain,
      activeProject: null,
      availableProjects: [...prev.availableProjects, ...generateNewProjects(1)],
      playerData: {
        ...prev.playerData,
        xp: prev.playerData.xp + xpGain
      },
      hiredStaff: prev.hiredStaff.map(s => 
        s.assignedProjectId === project.id 
          ? { ...s, status: 'Idle' as const, assignedProjectId: null }
          : s
      )
    }));

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

  const advanceDay = () => {
    const newDay = gameState.currentDay + 1;
    
    setGameState(prev => ({ 
      ...prev, 
      currentDay: newDay,
      // Recover energy for resting staff
      hiredStaff: prev.hiredStaff.map(s => 
        s.status === 'Resting' 
          ? { ...s, energy: Math.min(100, s.energy + 20) }
          : s
      )
    }));
    
    // Process salary payments every 7 days
    if (newDay % 7 === 0 && newDay > gameState.lastSalaryDay) {
      const totalSalaries = gameState.hiredStaff.reduce((total, staff) => total + staff.salary, 0);
      
      if (gameState.money >= totalSalaries) {
        setGameState(prev => ({
          ...prev,
          money: prev.money - totalSalaries,
          lastSalaryDay: newDay
        }));
        
        toast({
          title: "Salaries Paid",
          description: `Paid $${totalSalaries} in weekly salaries.`,
        });
      } else {
        toast({
          title: "Cannot Pay Salaries!",
          description: `Need $${totalSalaries} for weekly salaries. Staff morale will suffer.`,
          variant: "destructive"
        });
      }
    }
    
    // Process active project if exists
    if (gameState.activeProject) {
      processStageWork();
    }

    // Refresh candidates occasionally
    if (newDay % 5 === 0) {
      setGameState(prev => ({
        ...prev,
        availableCandidates: generateCandidates(3)
      }));
    }
  };

  const purchaseEquipment = (equipmentId: string) => {
    const equipment = availableEquipment.find(e => e.id === equipmentId);
    if (!equipment || gameState.money < equipment.price) {
      toast({
        title: "Cannot Purchase",
        description: "Not enough money for this equipment.",
        variant: "destructive"
      });
      return;
    }

    if (gameState.ownedEquipment.some(e => e.id === equipmentId)) {
      toast({
        title: "Already Owned",
        description: "You already own this equipment.",
        variant: "destructive"
      });
      return;
    }

    setGameState(prev => ({
      ...prev,
      money: prev.money - equipment.price,
      ownedEquipment: [...prev.ownedEquipment, equipment]
    }));

    toast({
      title: "Equipment Purchased!",
      description: `${equipment.name} added to your studio.`,
    });
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

  const getStaffStatusColor = (status: string) => {
    switch (status) {
      case 'Working': return 'text-green-400';
      case 'Resting': return 'text-blue-400';
      case 'Idle': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getEnergyColor = (energy: number) => {
    if (energy > 60) return 'text-green-400';
    if (energy > 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-green-900 text-white">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 bg-black/30 backdrop-blur-sm">
        <div className="flex gap-6">
          <div className="text-green-400 font-bold">${gameState.money.toLocaleString()}</div>
          <div className="text-blue-400">{gameState.reputation} Reputation</div>
          <div className="text-yellow-400">Day {gameState.currentDay}</div>
          <div className="text-purple-400">Level {gameState.playerData.level}</div>
          <div className="text-orange-400">Staff: {gameState.hiredStaff.length}</div>
        </div>
        <div className="flex items-center gap-4">
          <Dialog open={showStudioModal} onOpenChange={setShowStudioModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-gray-800/80 hover:bg-gray-700/80 text-white border-gray-600">
                View Studio 🏠
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-600 text-white max-w-4xl">
              <DialogHeader>
                <DialogTitle className="text-white">Your Studio</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-4 p-4">
                {/* Studio Visual Representation */}
                <div className="col-span-2 bg-gray-800 rounded-lg p-6 h-64 relative">
                  <div className="text-center mb-4 text-gray-300">Studio Layout</div>
                  <div className="grid grid-cols-4 gap-2 h-full">
                    {/* Recording Booth */}
                    <div className="bg-blue-900/50 rounded border-2 border-blue-400 p-2 text-center">
                      <div className="text-xs text-blue-300 mb-1">Recording</div>
                      {gameState.ownedEquipment.filter(e => e.category === 'microphone').map(eq => (
                        <div key={eq.id} className="text-lg">{eq.icon}</div>
                      ))}
                    </div>
                    
                    {/* Control Room */}
                    <div className="bg-green-900/50 rounded border-2 border-green-400 p-2 text-center">
                      <div className="text-xs text-green-300 mb-1">Control</div>
                      {gameState.ownedEquipment.filter(e => e.category === 'monitor').map(eq => (
                        <div key={eq.id} className="text-lg">{eq.icon}</div>
                      ))}
                    </div>
                    
                    {/* Equipment Rack */}
                    <div className="bg-yellow-900/50 rounded border-2 border-yellow-400 p-2 text-center">
                      <div className="text-xs text-yellow-300 mb-1">Rack</div>
                      {gameState.ownedEquipment.filter(e => e.category === 'processor' || e.category === 'interface').map(eq => (
                        <div key={eq.id} className="text-lg">{eq.icon}</div>
                      ))}
                    </div>
                    
                    {/* Live Room */}
                    <div className="bg-purple-900/50 rounded border-2 border-purple-400 p-2 text-center">
                      <div className="text-xs text-purple-300 mb-1">Live Room</div>
                      {gameState.ownedEquipment.filter(e => e.category === 'instrument').map(eq => (
                        <div key={eq.id} className="text-lg">{eq.icon}</div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Equipment List */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-bold mb-3 text-white">Owned Equipment</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {gameState.ownedEquipment.map(equipment => (
                      <div key={equipment.id} className="bg-gray-700 p-2 rounded text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{equipment.icon}</span>
                          <span className="text-white">{equipment.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showStaffModal} onOpenChange={setShowStaffModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-gray-800/80 hover:bg-gray-700/80 text-white border-gray-600">
                My Staff 👥
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-600 text-white max-w-4xl">
              <DialogHeader>
                <DialogTitle className="text-white">Staff Management</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {gameState.hiredStaff.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    No staff hired yet. Visit the recruitment center to hire your first team members!
                  </div>
                ) : (
                  gameState.hiredStaff.map(staff => (
                    <Card key={staff.id} className="p-4 bg-gray-800 border-gray-600">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-lg font-bold text-white">{staff.name}</h4>
                          <p className="text-gray-300">{staff.role} - Level {staff.levelInRole}</p>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${getStaffStatusColor(staff.status)}`}>{staff.status}</div>
                          <div className="text-sm text-gray-400">${staff.salary}/week</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-blue-400 font-bold">{staff.primaryStats.creativity}</div>
                          <div className="text-xs text-gray-400">Creativity</div>
                        </div>
                        <div className="text-center">
                          <div className="text-green-400 font-bold">{staff.primaryStats.technical}</div>
                          <div className="text-xs text-gray-400">Technical</div>
                        </div>
                        <div className="text-center">
                          <div className="text-yellow-400 font-bold">{staff.primaryStats.speed}</div>
                          <div className="text-xs text-gray-400">Speed</div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">Energy</span>
                          <span className={getEnergyColor(staff.energy)}>{staff.energy}/100</span>
                        </div>
                        <Progress value={staff.energy} className="h-2" />
                      </div>
                      
                      {staff.genreAffinity && (
                        <div className="mb-3 text-sm">
                          <span className="text-purple-400">Genre Affinity: </span>
                          <span className="text-white">{staff.genreAffinity.genre} (+{staff.genreAffinity.bonus}%)</span>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        {staff.status === 'Idle' && gameState.activeProject && (
                          <Button 
                            size="sm" 
                            onClick={() => assignStaffToProject(staff.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Assign to Project
                          </Button>
                        )}
                        
                        {staff.status === 'Working' && (
                          <Button 
                            size="sm" 
                            onClick={() => unassignStaffFromProject(staff.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Unassign
                          </Button>
                        )}
                        
                        {staff.status !== 'Working' && (
                          <Button 
                            size="sm" 
                            onClick={() => toggleStaffRest(staff.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {staff.status === 'Resting' ? 'Stop Resting' : 'Rest'}
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          {gameState.playerData.level >= 2 && (
            <Dialog open={showRecruitmentModal} onOpenChange={setShowRecruitmentModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-gray-800/80 hover:bg-gray-700/80 text-white border-gray-600">
                  Recruit Staff 🎯
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-600 text-white max-w-4xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Recruitment Center</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {gameState.availableCandidates.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      No candidates available. Check back in a few days!
                    </div>
                  ) : (
                    gameState.availableCandidates.map((candidate, index) => (
                      <Card key={index} className="p-4 bg-gray-800 border-gray-600">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-lg font-bold text-white">{candidate.name}</h4>
                            <p className="text-gray-300">{candidate.role}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-red-400 font-bold">${candidate.salary * 2} signing fee</div>
                            <div className="text-sm text-gray-400">${candidate.salary}/week salary</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div className="text-center">
                            <div className="text-blue-400 font-bold">{candidate.primaryStats.creativity}</div>
                            <div className="text-xs text-gray-400">Creativity</div>
                          </div>
                          <div className="text-center">
                            <div className="text-green-400 font-bold">{candidate.primaryStats.technical}</div>
                            <div className="text-xs text-gray-400">Technical</div>
                          </div>
                          <div className="text-center">
                            <div className="text-yellow-400 font-bold">{candidate.primaryStats.speed}</div>
                            <div className="text-xs text-gray-400">Speed</div>
                          </div>
                        </div>
                        
                        {candidate.genreAffinity && (
                          <div className="mb-3 text-sm">
                            <span className="text-purple-400">Genre Affinity: </span>
                            <span className="text-white">{candidate.genreAffinity.genre} (+{candidate.genreAffinity.bonus}%)</span>
                          </div>
                        )}
                        
                        <Button 
                          onClick={() => hireStaff(index)}
                          disabled={gameState.money < candidate.salary * 2}
                          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                        >
                          {gameState.money < candidate.salary * 2 ? 'Insufficient Funds' : 'Hire'}
                        </Button>
                      </Card>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
          
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
            <h2 className="text-xl font-bold text-white">Available Projects</h2>
            <Button 
              onClick={() => setGameState(prev => ({ 
                ...prev, 
                availableProjects: [...prev.availableProjects, ...generateNewProjects(1)] 
              }))}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Refresh
            </Button>
          </div>

          {gameState.activeProject && (
            <Card className="p-4 bg-blue-900/80 border-blue-400 backdrop-blur-sm">
              <div className="text-sm text-blue-200 mb-2">Currently working on a project.</div>
              <div className="text-xs text-gray-300">Complete it before taking another.</div>
              
              {/* Show assigned staff */}
              <div className="mt-2 pt-2 border-t border-blue-400/30">
                <div className="text-xs text-blue-300 mb-1">Assigned Staff:</div>
                {gameState.hiredStaff.filter(s => s.assignedProjectId === gameState.activeProject?.id).map(staff => (
                  <div key={staff.id} className="text-xs text-gray-200">
                    {staff.name} ({staff.role})
                  </div>
                ))}
                {gameState.hiredStaff.filter(s => s.assignedProjectId === gameState.activeProject?.id).length === 0 && (
                  <div className="text-xs text-gray-400">No staff assigned</div>
                )}
              </div>
            </Card>
          )}

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {gameState.availableProjects.map(project => (
              <Card key={project.id} className="p-4 bg-gray-900/90 border-gray-600 hover:bg-gray-800/90 transition-colors backdrop-blur-sm">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-white">{project.title}</h3>
                  <span className="text-xs bg-red-600 px-2 py-1 rounded text-white">{project.clientType}</span>
                </div>
                <div className="text-sm space-y-1 text-gray-200">
                  <div>Genre: <span className="text-white">{project.genre}</span></div>
                  <div>Difficulty: <span className="text-orange-400">{project.difficulty}</span></div>
                  <div className="text-green-400 font-semibold">${project.payoutBase}</div>
                  <div className="text-blue-400 font-semibold">+{project.repGainBase} Rep</div>
                  <div className="text-yellow-400 font-semibold">{project.durationDaysTotal} days</div>
                </div>
                <Button 
                  onClick={() => startProject(project)}
                  disabled={!!gameState.activeProject}
                  className="w-full mt-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white"
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
              <Card className="p-6 bg-black/50 backdrop-blur-sm border-gray-600">
                <h2 className="text-2xl font-bold mb-2 text-white">Working on: {gameState.activeProject.title}</h2>
                <div className="text-lg mb-4 text-gray-200">
                  Stage {gameState.activeProject.currentStageIndex + 1} of {gameState.activeProject.stages.length}: {gameState.activeProject.stages[gameState.activeProject.currentStageIndex].stageName}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div id="creativity-points" className="text-center">
                    <div className="text-3xl mb-2">💙</div>
                    <div className="text-xl font-bold text-white">{gameState.activeProject.accumulatedCPoints}</div>
                    <div className="text-sm text-gray-300">Creativity</div>
                  </div>
                  <div id="technical-points" className="text-center">
                    <div className="text-3xl mb-2">💚</div>
                    <div className="text-xl font-bold text-white">{gameState.activeProject.accumulatedTPoints}</div>
                    <div className="text-sm text-gray-300">Technical</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Focus Allocation:</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-2 text-gray-200">
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
                      <div className="flex justify-between mb-2 text-gray-200">
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
                      <div className="flex justify-between mb-2 text-gray-200">
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

                  <Button onClick={processStageWork} className="w-full bg-purple-600 hover:bg-purple-700 text-white" size="lg">
                    Complete {gameState.activeProject.stages[gameState.activeProject.currentStageIndex].stageName} & Proceed
                  </Button>
                </div>

                <div className="mt-4">
                  <div className="text-sm text-gray-300 mb-2">Stage Progress</div>
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
              <Card className="p-8 text-center bg-black/50 backdrop-blur-sm border-gray-600">
                <div className="text-6xl mb-4">🎵</div>
                <h2 className="text-2xl font-bold mb-2 text-white">Studio Ready</h2>
                <p className="text-gray-300">Select a project from the left panel to get started</p>
                {gameState.playerData.level < 2 && (
                  <p className="text-yellow-400 mt-2 text-sm">Reach level 2 to unlock staff recruitment!</p>
                )}
              </Card>
            </div>
          )}
        </div>

        {/* Right Panel - Equipment & Upgrades */}
        <div className="w-80 space-y-4">
          <div className="space-y-2">
            <Dialog open={showSkillsModal} onOpenChange={setShowSkillsModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full bg-gray-800/80 hover:bg-gray-700/80 text-white border-gray-600">View Studio Skills</Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-600 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">Studio Skills</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  {Object.values(gameState.studioSkills).map(skill => (
                    <div key={skill.name} className="flex justify-between items-center">
                      <span className="text-gray-200">{skill.name}</span>
                      <div className="text-right">
                        <div className="font-bold text-white">Level {skill.level}</div>
                        <div className="text-sm text-gray-400">{skill.xp}/{skill.xpToNext}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAttributesModal} onOpenChange={setShowAttributesModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full bg-gray-800/80 hover:bg-gray-700/80 text-white border-gray-600">
                  Player Attributes ({gameState.playerData.perkPoints} points)
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-600 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">Player Attributes</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-sm text-gray-400">Available Perk Points: {gameState.playerData.perkPoints}</div>
                  {Object.entries(gameState.playerData.attributes).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="capitalize text-gray-200">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{value}</span>
                        <Button
                          size="sm"
                          onClick={() => spendPerkPoint(key as keyof PlayerAttributes)}
                          disabled={gameState.playerData.perkPoints <= 0}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            <Button onClick={advanceDay} className="w-full bg-orange-600 hover:bg-orange-700 text-white">Next Day</Button>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3 text-white">Equipment Shop</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {availableEquipment
                .filter(equipment => !gameState.ownedEquipment.some(owned => owned.id === equipment.id))
                .map(equipment => (
                <Card key={equipment.id} className="p-4 bg-gray-900/90 border-gray-600 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{equipment.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{equipment.name}</h4>
                      <p className="text-xs text-gray-300 mt-1">{equipment.description}</p>
                      
                      {/* Equipment bonuses */}
                      <div className="mt-2 space-y-1">
                        {equipment.bonuses.qualityBonus && (
                          <div className="text-xs text-blue-400">Quality: +{equipment.bonuses.qualityBonus}%</div>
                        )}
                        {equipment.bonuses.genreBonus && Object.entries(equipment.bonuses.genreBonus).map(([genre, bonus]) => (
                          <div key={genre} className="text-xs text-green-400">{genre}: +{bonus}</div>
                        ))}
                        {equipment.bonuses.creativityBonus && (
                          <div className="text-xs text-purple-400">Creativity: +{equipment.bonuses.creativityBonus}%</div>
                        )}
                        {equipment.bonuses.technicalBonus && (
                          <div className="text-xs text-orange-400">Technical: +{equipment.bonuses.technicalBonus}%</div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-green-400 font-bold">${equipment.price}</span>
                        <Button 
                          size="sm" 
                          onClick={() => purchaseEquipment(equipment.id)}
                          disabled={gameState.money < equipment.price}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                        >
                          Buy
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="bg-gray-900 border-gray-600 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Project Complete! 🎉</DialogTitle>
          </DialogHeader>
          {lastReview && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">{lastReview.projectTitle}</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl">💙</div>
                  <div className="font-bold text-white">{lastReview.creativityPoints}</div>
                  <div className="text-sm text-gray-400">Creativity</div>
                </div>
                <div>
                  <div className="text-2xl">💚</div>
                  <div className="font-bold text-white">{lastReview.technicalPoints}</div>
                  <div className="text-sm text-gray-400">Technical</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">⭐</div>
                <div className="text-xl font-bold text-white">Quality Score: {lastReview.qualityScore}%</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Payment:</span>
                  <span className="text-green-400 font-bold">${lastReview.payout}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Reputation:</span>
                  <span className="text-blue-400 font-bold">+{lastReview.repGain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Experience:</span>
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
