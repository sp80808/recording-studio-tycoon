import { GameState, StaffMember, StaffRole, GenreAffinity } from './types';

const firstNames = [
  'Alex', 'Bailey', 'Casey', 'Dana', 'Eddie', 'Frankie', 'Gale', 'Harper',
  'Izzy', 'Jamie', 'Kelly', 'Lee', 'Morgan', 'Nico', 'Parker', 'Quinn'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller',
  'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White'
];

const genres = ['rock', 'pop', 'electronic', 'hiphop', 'acoustic'];

/**
 * Generates a specified number of staff candidates
 */
export function generateCandidates(count: number): StaffMember[] {
  const candidates: StaffMember[] = [];
  const roles: StaffRole[] = ['Engineer', 'Producer', 'Songwriter'];

  for (let i = 0; i < count; i++) {
    // Generate random name
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;

    // Assign random role
    const role = roles[Math.floor(Math.random() * roles.length)];

    // Generate base stats (1-50 for early game)
    const creativity = Math.floor(Math.random() * 30) + 20;
    const technical = Math.floor(Math.random() * 30) + 20;
    const speed = Math.floor(Math.random() * 30) + 20;

    // Maybe assign genre affinity (30% chance)
    let genreAffinity: GenreAffinity | null = null;
    if (Math.random() < 0.3) {
      const genre = genres[Math.floor(Math.random() * genres.length)];
      genreAffinity = {
        genre,
        bonus: Math.floor(Math.random() * 15) + 5 // 5-20% bonus
      };
    }

    // Calculate salary based on stats
    const totalStats = creativity + technical + speed;
    const baseSalary = 50;
    const salary = Math.floor(baseSalary * (1 + totalStats / 300));

    const candidate: StaffMember = {
      id: '', // Will be assigned when hired
      name,
      role,
      primaryStats: {
        creativity,
        technical,
        speed
      },
      xpInRole: 0,
      levelInRole: 1,
      genreAffinity,
      energy: 100,
      salary,
      status: 'Idle',
      assignedProjectId: null
    };

    candidates.push(candidate);
  }

  return candidates;
}

/**
 * Hires a staff member from the candidates list
 */
export function hireStaff(gameState: GameState, candidateIndex: number): boolean {
  const candidate = gameState.availableCandidates[candidateIndex];
  
  if (!candidate) return false;

  // Check if player can afford signing fee
  const signingFee = candidate.salary * 2;
  if (gameState.money < signingFee) return false;

  // Deduct signing fee
  gameState.money -= signingFee;

  // Assign unique ID
  const newStaff = {
    ...candidate,
    id: `staff-${Date.now()}-${gameState.hiredStaff.length}`
  };

  // Add to hired staff and remove from candidates
  gameState.hiredStaff.push(newStaff);
  gameState.availableCandidates.splice(candidateIndex, 1);

  return true;
}

/**
 * Assigns a staff member to the active project
 */
export function assignStaffToProject(gameState: GameState, staffId: string): boolean {
  if (!gameState.activeProject) return false;

  const staff = gameState.hiredStaff.find(s => s.id === staffId);
  if (!staff || staff.status !== 'Idle' || staff.energy < 20) return false;

  // Check if project has room for this role
  const roleCount = gameState.activeProject.assignedStaff.length;
  if (roleCount >= 2) return false; // Max 2 staff per project for now

  // Assign to project
  staff.status = 'Working';
  staff.assignedProjectId = gameState.activeProject.id;
  gameState.activeProject.assignedStaff.push(staffId);

  return true;
}

/**
 * Updates staff energy and status
 */
export function updateStaffDaily(gameState: GameState): void {
  const today = gameState.currentDay;

  // Process salary payments every 7 days
  if (today % 7 === 0) {
    const totalSalaries = gameState.hiredStaff.reduce((sum, staff) => sum + staff.salary, 0);
    gameState.money -= totalSalaries;
  }

  // Update each staff member
  gameState.hiredStaff.forEach(staff => {
    switch (staff.status) {
      case 'Working':
        staff.energy = Math.max(0, staff.energy - 10);
        if (staff.energy < 20) {
          staff.status = 'Resting';
          staff.assignedProjectId = null;
        }
        break;
      case 'Resting':
        staff.energy = Math.min(100, staff.energy + 15);
        if (staff.energy >= 80) {
          staff.status = 'Idle';
        }
        break;
      case 'Idle':
        staff.energy = Math.min(100, staff.energy + 5);
        break;
    }
  });
}

/**
 * Adds XP to a staff member and handles level ups
 */
export function addStaffXP(gameState: GameState, staffId: string, amount: number): void {
  const staff = gameState.hiredStaff.find(s => s.id === staffId);
  if (!staff) return;

  staff.xpInRole += amount;

  // Check for level up
  const xpNeeded = staff.levelInRole * 100;
  if (staff.xpInRole >= xpNeeded) {
    levelUpStaff(staff);
  }
}

/**
 * Levels up a staff member
 */
function levelUpStaff(staff: StaffMember): void {
  staff.levelInRole++;
  staff.xpInRole = 0;

  // Improve stats
  staff.primaryStats.creativity += 2;
  staff.primaryStats.technical += 2;
  staff.primaryStats.speed += 1;
}

/**
 * Calculates staff contribution to project work
 */
export function calculateStaffContribution(
  gameState: GameState,
  projectId: string
): { creativityBonus: number; technicalBonus: number; speedBonus: number } {
  const project = gameState.activeProject;
  if (!project || project.id !== projectId) {
    return { creativityBonus: 0, technicalBonus: 0, speedBonus: 0 };
  }

  let creativityBonus = 0;
  let technicalBonus = 0;
  let speedBonus = 0;

  // Get assigned staff
  const assignedStaff = gameState.hiredStaff.filter(
    staff => staff.assignedProjectId === projectId && staff.status === 'Working'
  );

  assignedStaff.forEach(staff => {
    // Calculate energy efficiency (reduced contribution when tired)
    const energyMultiplier = staff.energy / 100;

    // Base contribution
    creativityBonus += staff.primaryStats.creativity * energyMultiplier;
    technicalBonus += staff.primaryStats.technical * energyMultiplier;
    speedBonus += staff.primaryStats.speed * energyMultiplier;

    // Apply genre affinity bonus if applicable
    if (staff.genreAffinity && staff.genreAffinity.genre === project.genre) {
      const affinityBonus = staff.genreAffinity.bonus / 100;
      creativityBonus *= (1 + affinityBonus);
      technicalBonus *= (1 + affinityBonus);
    }
  });

  return {
    creativityBonus: Math.floor(creativityBonus / 100), // Convert to percentage
    technicalBonus: Math.floor(technicalBonus / 100),
    speedBonus: Math.floor(speedBonus / 100)
  };
}