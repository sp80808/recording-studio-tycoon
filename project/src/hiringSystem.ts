import { GameState, Engineer } from './types';

// Engineer names for generation
const engineerFirstNames = [
  'Alex', 'Bailey', 'Casey', 'Dana', 'Eddie', 'Frankie', 'Gale', 'Harper',
  'Izzy', 'Jamie', 'Kelly', 'Lee', 'Morgan', 'Nico', 'Parker', 'Quinn', 
  'Riley', 'Sam', 'Taylor', 'Val'
];

const engineerLastNames = [
  'Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 
  'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 
  'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson'
];

/**
 * Checks if the hiring system can be unlocked
 */
export function canUnlockHiring(playerLevel: number, currentMoney: number): boolean {
  return playerLevel >= 2 && currentMoney >= 500;
}

/**
 * Generates a specified number of candidate engineers
 */
export function generateCandidateEngineers(count: number): Engineer[] {
  const engineers: Engineer[] = [];
  const genres = ['rock', 'pop', 'electronic', 'hiphop', 'acoustic'];
  
  for (let i = 0; i < count; i++) {
    // Generate random name
    const firstName = engineerFirstNames[Math.floor(Math.random() * engineerFirstNames.length)];
    const lastName = engineerLastNames[Math.floor(Math.random() * engineerLastNames.length)];
    const name = `${firstName} ${lastName}`;
    
    // Select primary skill
    const primarySkill = genres[Math.floor(Math.random() * genres.length)];
    
    // Determine skill level (1-5)
    const skillLevel = Math.floor(Math.random() * 3) + 1; // 1-3 for initial candidates
    
    // Calculate efficiency (70-100%)
    const efficiency = Math.floor(Math.random() * 31) + 70;
    
    // Calculate speed multiplier (0.8-1.2)
    const speedMultiplier = 0.8 + (Math.random() * 0.4);
    
    // Calculate salary based on skill level and efficiency
    const baseSalary = 100;
    const salary = Math.floor(
      baseSalary * skillLevel * (efficiency / 80)
    );
    
    // Create engineer
    const engineer: Engineer = {
      id: `engineer-${Date.now()}-${i}`,
      name,
      primarySkill,
      skillLevel,
      efficiency,
      speedMultiplier,
      salary,
      energy: 100,
      status: 'Idle'
    };
    
    engineers.push(engineer);
  }
  
  return engineers;
}

/**
 * Hires an engineer from the candidates list
 */
export function hireEngineer(gameState: GameState, engineerId: string): boolean {
  // Find the engineer in candidates
  const candidateIndex = gameState.candidateEngineers.findIndex(e => e.id === engineerId);
  
  if (candidateIndex === -1) {
    return false;
  }
  
  const engineer = gameState.candidateEngineers[candidateIndex];
  
  // Check if player has enough money (5x daily salary upfront)
  const hiringCost = engineer.salary * 5;
  
  if (gameState.money < hiringCost) {
    return false;
  }
  
  // Deduct money
  gameState.money -= hiringCost;
  
  // Remove from candidates and add to hired staff
  gameState.candidateEngineers.splice(candidateIndex, 1);
  gameState.hiredStaff.push(engineer);
  
  return true;
}

/**
 * Assigns an engineer to work on the active project
 */
export function assignEngineerToProject(gameState: GameState, engineerId: string): boolean {
  // Check if there's an active project
  if (!gameState.activeProject) {
    return false;
  }
  
  // Find the engineer
  const engineer = gameState.hiredStaff.find(e => e.id === engineerId);
  
  if (!engineer || engineer.status !== 'Idle' || engineer.energy < 30) {
    return false;
  }
  
  // Assign to project
  engineer.status = 'Working';
  
  return true;
}

/**
 * Calculates the bonus provided by working engineers for the active project
 */
export function calculateEngineerBonus(gameState: GameState): number {
  if (!gameState.activeProject) {
    return 1.0;
  }
  
  const projectGenre = gameState.activeProject.genre;
  let bonus = 1.0;
  
  // Find engineers working on this project
  const workingEngineers = gameState.hiredStaff.filter(e => e.status === 'Working');
  
  workingEngineers.forEach(engineer => {
    // Engineers get full bonus for matching primary skill, half bonus otherwise
    const skillMatch = engineer.primarySkill === projectGenre ? 1.0 : 0.5;
    
    // Calculate individual engineer bonus
    const engineerBonus = (engineer.skillLevel * 0.1) * (engineer.efficiency / 100) * skillMatch;
    
    // Add to total bonus
    bonus += engineerBonus;
  });
  
  return bonus;
}

/**
 * Updates engineer status (energy, pay salary, etc.) at the end of each day
 */
export function updateEngineersDaily(gameState: GameState): void {
  gameState.hiredStaff.forEach(engineer => {
    // Pay salary
    gameState.money -= engineer.salary;
    
    // Update energy based on status
    if (engineer.status === 'Working') {
      // Working engineers lose energy
      engineer.energy = Math.max(0, engineer.energy - 15);
      
      // If energy too low, automatically put to rest
      if (engineer.energy < 20) {
        engineer.status = 'Resting';
      }
    } else if (engineer.status === 'Resting') {
      // Resting engineers recover energy
      engineer.energy = Math.min(100, engineer.energy + 20);
      
      // If energy high enough, set to idle
      if (engineer.energy >= 80) {
        engineer.status = 'Idle';
      }
    } else {
      // Idle engineers recover energy slowly
      engineer.energy = Math.min(100, engineer.energy + 5);
    }
  });
}