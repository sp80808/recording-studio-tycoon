import { 
  GameState, 
  Project, 
  StaffMember,
  ProjectReview, 
  ProjectStage,
  FocusArea,
  Upgrade,
  PlayerAttributes
} from './types';
import { availableUpgrades, purchaseUpgrade } from './gameState';
import { calculateStagePoints, processStageWork, completeProject } from './projectManager';
import { addPlayerXP, levelUpPlayer, spendPlayerPerkPoint } from './playerProgress';
import { hireEngineer } from './hiringSystem';
import { createOrb } from './animations';

/**
 * Initializes and sets up all UI elements and event listeners
 */
export function initializeUI(gameState: GameState, updateGameState: () => void): void {
  // Set up initial UI state
  updateUI(gameState);
  
  // Set up event listeners for UI interactions
  setupEventListeners(gameState, updateGameState);
}

/**
 * Updates all UI elements based on the current game state
 */
export function updateUI(gameState: GameState): void {
  updateTopBar(gameState);
  updateProjectsList(gameState);
  updateSkillsList(gameState);
  updateUpgradesList(gameState);
  updateStudioArea(gameState);
}

/**
 * Updates the top bar stats
 */
function updateTopBar(gameState: GameState): void {
  // Update money
  const moneyElement = document.getElementById('money-value');
  if (moneyElement) moneyElement.textContent = `$${gameState.money}`;
  
  // Update reputation
  const reputationElement = document.getElementById('reputation-value');
  if (reputationElement) reputationElement.textContent = gameState.reputation.toString();
  
  // Update day
  const dayElement = document.getElementById('day-value');
  if (dayElement) dayElement.textContent = `Day ${gameState.currentDay}`;
  
  // Update completed projects
  const completedElement = document.getElementById('completed-value');
  if (completedElement) completedElement.textContent = gameState.completedProjects.toString();
  
  // Update player level and XP bar
  const playerLevelElement = document.getElementById('player-level');
  if (playerLevelElement) playerLevelElement.textContent = `Level ${gameState.playerData.level}`;
  
  const xpBar = document.getElementById('xp-bar');
  if (xpBar) {
    const xpPercentage = (gameState.playerData.xp / gameState.playerData.xpToNextLevel) * 100;
    xpBar.style.width = `${xpPercentage}%`;
  }
}

/**
 * Updates the projects list in the left panel
 */
function updateProjectsList(gameState: GameState): void {
  const projectsList = document.getElementById('projects-list');
  if (!projectsList) return;
  
  // Clear existing projects
  projectsList.innerHTML = '';
  
  // Show warning if there's an active project
  if (gameState.activeProject) {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'warning-message';
    warningDiv.textContent = 'Currently working on a project. Complete it before taking another.';
    projectsList.appendChild(warningDiv);
  }
  
  // Add available projects
  gameState.availableProjects.forEach(project => {
    const projectCard = document.createElement('div');
    projectCard.className = 'project-card';
    projectCard.dataset.projectId = project.id;
    
    // Project header with title and match rating
    const projectHeader = document.createElement('div');
    projectHeader.className = 'project-header';
    
    const projectTitle = document.createElement('div');
    projectTitle.className = 'project-title';
    projectTitle.textContent = project.title;
    
    const projectMatch = document.createElement('div');
    projectMatch.className = `project-match match-${project.matchRating.toLowerCase()}`;
    projectMatch.textContent = project.matchRating;
    
    projectHeader.appendChild(projectTitle);
    projectHeader.appendChild(projectMatch);
    
    // Project details
    const projectDetails = document.createElement('div');
    projectDetails.className = 'project-details';
    
    const genreInfo = document.createElement('div');
    genreInfo.textContent = `Genre: ${project.genre}`;
    
    const difficultyInfo = document.createElement('div');
    difficultyInfo.textContent = `Difficulty: ${project.difficulty}`;
    
    projectDetails.appendChild(genreInfo);
    projectDetails.appendChild(difficultyInfo);
    
    // Project rewards
    const projectRewards = document.createElement('div');
    projectRewards.className = 'project-details';
    
    const payoutInfo = document.createElement('div');
    payoutInfo.className = 'project-payout';
    payoutInfo.textContent = `$${project.payoutBase}`;
    
    const repInfo = document.createElement('div');
    repInfo.className = 'project-rep';
    repInfo.textContent = `+${project.repGainBase} Rep`;
    
    projectRewards.appendChild(payoutInfo);
    projectRewards.appendChild(repInfo);
    
    // Project requirements
    const projectReq = document.createElement('div');
    projectReq.className = 'project-req';
    
    const reqSkills = Object.entries(project.requiredSkills)
      .map(([skill, level]) => `${skill} (Lvl ${level})`)
      .join(', ');
    
    projectReq.textContent = `Requires: ${reqSkills}`;
    
    // Add all elements to card
    projectCard.appendChild(projectHeader);
    projectCard.appendChild(projectDetails);
    projectCard.appendChild(projectRewards);
    projectCard.appendChild(projectReq);
    
    // Add click event for selecting the project
    if (!gameState.activeProject) {
      projectCard.addEventListener('click', () => {
        selectProject(gameState, project.id);
      });
    } else {
      projectCard.classList.add('disabled');
    }
    
    projectsList.appendChild(projectCard);
  });
  
  // Add message if no projects available
  if (gameState.availableProjects.length === 0) {
    const noProjects = document.createElement('p');
    noProjects.textContent = 'No available projects. Click Refresh to get new offers.';
    projectsList.appendChild(noProjects);
  }
}

/**
 * Updates the skills list in the right panel
 */
function updateSkillsList(gameState: GameState): void {
  const skillsList = document.getElementById('skills-list');
  if (!skillsList) return;
  
  // Clear existing skills
  skillsList.innerHTML = '';
  
  // Add each skill with progress bar
  Object.values(gameState.studioSkills).forEach(skill => {
    const skillItem = document.createElement('div');
    skillItem.className = 'skill-item';
    
    const skillHeader = document.createElement('div');
    skillHeader.className = 'skill-header';
    
    const skillName = document.createElement('div');
    skillName.className = 'skill-name';
    skillName.textContent = skill.name;
    
    const skillLevel = document.createElement('div');
    skillLevel.className = 'skill-level';
    skillLevel.textContent = `Level ${skill.level}`;
    
    skillHeader.appendChild(skillName);
    skillHeader.appendChild(skillLevel);
    
    const skillProgress = document.createElement('div');
    skillProgress.className = 'skill-progress';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'skill-progress-bar';
    progressBar.style.width = `${(skill.xp / skill.xpToNextLevel) * 100}%`;
    progressBar.style.backgroundColor = skill.color;
    
    skillProgress.appendChild(progressBar);
    
    const skillXp = document.createElement('div');
    skillXp.className = 'skill-xp';
    skillXp.textContent = `${skill.xp}/${skill.xpToNextLevel} XP`;
    
    skillItem.appendChild(skillHeader);
    skillItem.appendChild(skillProgress);
    skillItem.appendChild(skillXp);
    
    skillsList.appendChild(skillItem);
  });
}

/**
 * Updates the upgrades list in the right panel
 */
function updateUpgradesList(gameState: GameState): void {
  const upgradesList = document.getElementById('upgrades-list');
  if (!upgradesList) return;
  
  // Clear existing upgrades
  upgradesList.innerHTML = '';
  
  // Filter available upgrades the player can purchase
  const upgrades = availableUpgrades.filter(upgrade => 
    !gameState.ownedUpgrades.includes(upgrade.id)
  );
  
  // Add each upgrade
  upgrades.forEach(upgrade => {
    const upgradeCard = document.createElement('div');
    upgradeCard.className = 'upgrade-card';
    upgradeCard.dataset.upgradeId = upgrade.id;
    
    const upgradeHeader = document.createElement('div');
    upgradeHeader.className = 'upgrade-header';
    
    const upgradeTitle = document.createElement('div');
    upgradeTitle.className = 'upgrade-title';
    upgradeTitle.textContent = upgrade.name;
    
    const upgradeCost = document.createElement('div');
    upgradeCost.className = 'upgrade-cost';
    upgradeCost.textContent = `$${upgrade.cost}`;
    
    upgradeHeader.appendChild(upgradeTitle);
    upgradeHeader.appendChild(upgradeCost);
    
    const upgradeDescription = document.createElement('div');
    upgradeDescription.className = 'upgrade-description';
    upgradeDescription.textContent = upgrade.description;
    
    const upgradeSkills = document.createElement('div');
    upgradeSkills.className = 'upgrade-skills';
    
    const skillBonuses = Object.entries(upgrade.skillBonuses)
      .map(([skill, bonus]) => `${skill} +${bonus}`)
      .join(', ');
    
    upgradeSkills.textContent = `Skills: ${skillBonuses}`;
    
    const purchaseBtn = document.createElement('button');
    purchaseBtn.className = 'action-button';
    purchaseBtn.textContent = 'Purchase';
    
    if (gameState.money < upgrade.cost) {
      purchaseBtn.disabled = true;
      purchaseBtn.textContent = 'Not enough money';
    }
    
    purchaseBtn.addEventListener('click', () => {
      handleUpgradePurchase(gameState, upgrade.id);
    });
    
    upgradeCard.appendChild(upgradeHeader);
    upgradeCard.appendChild(upgradeDescription);
    upgradeCard.appendChild(upgradeSkills);
    upgradeCard.appendChild(purchaseBtn);
    
    upgradesList.appendChild(upgradeCard);
  });
  
  // Add message if no upgrades available
  if (upgrades.length === 0) {
    const noUpgrades = document.createElement('p');
    noUpgrades.textContent = 'No available upgrades.';
    upgradesList.appendChild(noUpgrades);
  }
}

/**
 * Updates the studio area in the center
 */
function updateStudioArea(gameState: GameState): void {
  const studioView = document.getElementById('studio-view');
  const activeProjectDashboard = document.getElementById('active-project-dashboard');
  
  if (!studioView || !activeProjectDashboard) return;
  
  // Toggle visibility based on active project
  if (gameState.activeProject) {
    studioView.style.display = 'none';
    activeProjectDashboard.style.display = 'flex';
    
    // Update active project details
    const project = gameState.activeProject;
    const currentStage = project.stages[project.currentStageIndex];
    
    // Update title and stage
    const titleElement = document.getElementById('active-project-title');
    if (titleElement) titleElement.textContent = project.title;
    
    const stageElement = document.getElementById('active-project-stage');
    if (stageElement) {
      stageElement.textContent = `Stage ${project.currentStageIndex + 1} of ${project.stages.length}: ${currentStage.stageName}`;
    }
    
    // Update points
    const creativityValue = document.getElementById('creativity-value');
    if (creativityValue) creativityValue.textContent = project.accumulatedCPoints.toString();
    
    const technicalValue = document.getElementById('technical-value');
    if (technicalValue) technicalValue.textContent = project.accumulatedTPoints.toString();
    
    // Update focus sliders
    updateFocusSliders(currentStage.focusAreas);
    
    // Update complete stage button
    const completeButton = document.getElementById('complete-stage');
    if (completeButton) {
      const progress = currentStage.workUnitsCompleted / currentStage.workUnitsRequired;
      
      if (progress >= 1) {
        completeButton.textContent = 
          project.currentStageIndex < project.stages.length - 1 
            ? `Complete ${currentStage.stageName} & Proceed`
            : 'Complete Project';
        
        completeButton.disabled = false;
      } else {
        completeButton.textContent = 
          `Working... (${Math.floor(progress * 100)}%)`;
        completeButton.disabled = true;
      }
    }
  } else {
    studioView.style.display = 'flex';
    activeProjectDashboard.style.display = 'none';
  }
}

/**
 * Updates the focus sliders for the current project stage
 */
function updateFocusSliders(focusAreas: FocusArea[]): void {
  const focusSliders = document.getElementById('focus-sliders');
  if (!focusSliders) return;
  
  // Clear existing sliders
  focusSliders.innerHTML = '';
  
  // Add a slider for each focus area
  focusAreas.forEach(area => {
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'focus-slider';
    sliderContainer.dataset.areaName = area.name;
    
    const sliderHeader = document.createElement('div');
    sliderHeader.className = 'slider-header';
    
    const sliderName = document.createElement('div');
    sliderName.className = 'slider-name';
    sliderName.textContent = area.name;
    
    const sliderValue = document.createElement('div');
    sliderValue.className = 'slider-value';
    sliderValue.textContent = `${area.value}%`;
    
    sliderHeader.appendChild(sliderName);
    sliderHeader.appendChild(sliderValue);
    
    const sliderElement = document.createElement('div');
    sliderElement.className = 'slider';
    
    const sliderTrack = document.createElement('div');
    sliderTrack.className = 'slider-track';
    sliderTrack.style.width = `${area.value}%`;
    
    const sliderHandle = document.createElement('div');
    sliderHandle.className = 'slider-handle';
    
    sliderTrack.appendChild(sliderHandle);
    sliderElement.appendChild(sliderTrack);
    
    // Make slider interactive
    setupSliderInteraction(sliderElement, sliderValue, area);
    
    sliderContainer.appendChild(sliderHeader);
    sliderContainer.appendChild(sliderElement);
    
    focusSliders.appendChild(sliderContainer);
  });
}

/**
 * Sets up interactive behavior for focus sliders
 */
function setupSliderInteraction(
  sliderElement: HTMLElement, 
  valueElement: HTMLElement, 
  area: FocusArea
): void {
  const slider = sliderElement;
  const handle = slider.querySelector('.slider-handle') as HTMLElement;
  const track = slider.querySelector('.slider-track') as HTMLElement;
  
  let isDragging = false;
  
  const updateSliderValue = (event: MouseEvent) => {
    const sliderRect = slider.getBoundingClientRect();
    const position = Math.min(Math.max(0, event.clientX - sliderRect.left), sliderRect.width);
    const percentage = Math.round((position / sliderRect.width) * 100);
    
    // Update the slider visually
    track.style.width = `${percentage}%`;
    
    // Update the value display
    valueElement.textContent = `${percentage}%`;
    
    // Update the focus area value
    area.value = percentage;
    
    // Ensure all focus areas add up to 100%
    balanceFocusAreas(area);
  };
  
  handle.addEventListener('mousedown', () => {
    isDragging = true;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      updateSliderValue(e);
    }
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
  
  // Allow clicking directly on the slider
  slider.addEventListener('click', (e) => {
    updateSliderValue(e);
  });
}

/**
 * Balances all focus areas to ensure they add up to 100%
 */
function balanceFocusAreas(changedArea: FocusArea): void {
  if (!document.getElementById('active-project-dashboard')?.style.display) return;
  
  // Get all focus area elements
  const focusSliders = document.querySelectorAll('.focus-slider');
  const areas: FocusArea[] = [];
  
  // Collect all areas
  focusSliders.forEach(slider => {
    const areaName = slider.getAttribute('data-area-name');
    if (areaName && areaName !== changedArea.name) {
      const valueElement = slider.querySelector('.slider-value') as HTMLElement;
      const trackElement = slider.querySelector('.slider-track') as HTMLElement;
      
      const area = {
        name: areaName,
        value: parseInt(valueElement.textContent!.replace('%', ''), 10),
        creativityWeight: 0, // We don't need this for balancing
        technicalWeight: 0   // We don't need this for balancing
      };
      
      areas.push(area);
      
      // Store elements for updating later
      (area as any).valueElement = valueElement;
      (area as any).trackElement = trackElement;
    }
  });
  
  // Calculate total and adjust other areas proportionally
  const total = areas.reduce((sum, area) => sum + area.value, changedArea.value);
  
  if (total !== 100 && areas.length > 0) {
    let remaining = 100 - changedArea.value;
    
    if (remaining <= 0) {
      // If changed area is 100%, set all others to 0
      areas.forEach(area => {
        area.value = 0;
        (area as any).valueElement.textContent = '0%';
        (area as any).trackElement.style.width = '0%';
      });
    } else {
      // Distribute remaining percentage proportionally
      const totalOthers = areas.reduce((sum, area) => sum + area.value, 0);
      
      if (totalOthers === 0) {
        // If all others are 0, distribute evenly
        const evenShare = Math.floor(remaining / areas.length);
        
        areas.forEach((area, index) => {
          if (index === areas.length - 1) {
            // Last area gets whatever is left to ensure sum is exactly 100
            area.value = remaining;
          } else {
            area.value = evenShare;
            remaining -= evenShare;
          }
          
          (area as any).valueElement.textContent = `${area.value}%`;
          (area as any).trackElement.style.width = `${area.value}%`;
        });
      } else {
        // Distribute proportionally based on current values
        let totalAdjusted = 0;
        
        areas.forEach((area, index) => {
          if (index === areas.length - 1) {
            // Last area gets whatever is left to ensure sum is exactly 100
            area.value = remaining - totalAdjusted;
          } else {
            const proportion = area.value / totalOthers;
            area.value = Math.floor(proportion * remaining);
            totalAdjusted += area.value;
          }
          
          (area as any).valueElement.textContent = `${area.value}%`;
          (area as any).trackElement.style.width = `${area.value}%`;
        });
      }
    }
  }
}

/**
 * Sets up all event listeners for UI interactions
 */
function setupEventListeners(gameState: GameState, updateGameState: () => void): void {
  // Refresh projects button
  const refreshButton = document.getElementById('refresh-projects');
  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      handleRefreshProjects(gameState);
      updateGameState();
    });
  }
  
  // Complete stage button
  const completeStageButton = document.getElementById('complete-stage');
  if (completeStageButton) {
    completeStageButton.addEventListener('click', () => {
      handleCompleteStage(gameState);
      updateGameState();
    });
  }
  
  // View staff button
  const viewStaffButton = document.getElementById('view-staff');
  if (viewStaffButton) {
    viewStaffButton.addEventListener('click', () => {
      openStaffModal(gameState);
      updateGameState();
    });
  }
  
  // Modal close buttons
  const modalCloseButtons = document.querySelectorAll('.modal-close, #modal-close');
  modalCloseButtons.forEach(button => {
    button.addEventListener('click', closeAllModals);
  });
  
  // Tab buttons
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const tabId = target.getAttribute('data-tab');
      
      // Update active tab button
      document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
      });
      target.classList.add('active');
      
      // Update active tab content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(tabId!)?.classList.add('active');
    });
  });
  
  // Accept review button
  const acceptReviewButton = document.getElementById('accept-review');
  if (acceptReviewButton) {
    acceptReviewButton.addEventListener('click', () => {
      closeAllModals();
      updateGameState();
    });
  }
  
  // Close level up button
  const closeLevelUpButton = document.getElementById('close-level-up');
  if (closeLevelUpButton) {
    closeLevelUpButton.addEventListener('click', () => {
      closeAllModals();
      updateGameState();
    });
  }
}

/**
 * Handles selecting a project
 */
function selectProject(gameState: GameState, projectId: string): void {
  if (gameState.activeProject) return;
  
  // Find the project in available projects
  const projectIndex = gameState.availableProjects.findIndex(p => p.id === projectId);
  
  if (projectIndex !== -1) {
    // Set as active project
    gameState.activeProject = gameState.availableProjects[projectIndex];
    
    // Remove from available projects
    gameState.availableProjects.splice(projectIndex, 1);
    
    // Update UI
    updateUI(gameState);
  }
}

/**
 * Handles refreshing the projects list
 */
function handleRefreshProjects(gameState: GameState): void {
  // Only refresh if player has money
  if (gameState.money >= 100) {
    gameState.money -= 100;
    gameState.availableProjects = [];
    
    // Generate new projects
    const { generateNewProjects } = require('./projectManager');
    gameState.availableProjects = generateNewProjects(3, gameState);
    
    // Update UI
    updateUI(gameState);
  }
}

/**
 * Handles completing a stage of the active project
 */
export function handleCompleteStage(gameState: GameState): void {
  if (!gameState.activeProject) return;
  
  const project = gameState.activeProject;
  const currentStage = project.stages[project.currentStageIndex];
  
  // Ensure stage is complete
  if (currentStage.workUnitsCompleted >= currentStage.workUnitsRequired) {
    // Check if this was the last stage
    if (project.currentStageIndex === project.stages.length - 1) {
      // Complete the project
      const review = completeProject(gameState);
      showReviewModal(review);
    } else {
      // Move to next stage
      project.currentStageIndex++;
    }
    
    // Update UI
    updateUI(gameState);
  }
}

/**
 * Handles purchasing an upgrade
 */
function handleUpgradePurchase(gameState: GameState, upgradeId: string): void {
  const success = purchaseUpgrade(gameState, upgradeId);
  
  if (success) {
    // Update UI
    updateUI(gameState);
  }
}

/**
 * Opens the staff management modal
 */
function openStaffModal(gameState: GameState): void {
  const staffModal = document.getElementById('staff-modal');
  if (!staffModal) return;
  
  // Update hired staff list
  const hiredStaffList = document.getElementById('hired-staff-list');
  if (hiredStaffList) {
    hiredStaffList.innerHTML = '';
    
    if (gameState.hiredStaff.length === 0) {
      hiredStaffList.textContent = 'No staff hired yet.';
    } else {
      gameState.hiredStaff.forEach(engineer => {
        const staffCard = createStaffCard(engineer, gameState);
        hiredStaffList.appendChild(staffCard);
      });
    }
  }
  
  // Update candidates list
  const candidatesList = document.getElementById('candidates-list');
  if (candidatesList) {
    candidatesList.innerHTML = '';
    
    if (gameState.availableCandidates.length === 0) {
      candidatesList.textContent = 'No candidates available.';
    } else {
      gameState.availableCandidates.forEach(engineer => {
        const candidateCard = createCandidateCard(engineer, gameState);
        candidatesList.appendChild(candidateCard);
      });
    }
  }
  
  // Show modal
  staffModal.classList.remove('hidden');
}

/**
 * Creates a staff card element for an engineer
 */
function createStaffCard(engineer: StaffMember, gameState: GameState): HTMLElement {
  const staffCard = document.createElement('div');
  staffCard.className = 'staff-card';
  
  const staffHeader = document.createElement('div');
  staffHeader.className = 'staff-header';
  
  const staffName = document.createElement('div');
  staffName.className = 'staff-name';
  staffName.textContent = engineer.name;
  
  const staffStatus = document.createElement('div');
  staffStatus.className = `staff-status status-${engineer.status.toLowerCase()}`;
  staffStatus.textContent = engineer.status;
  
  staffHeader.appendChild(staffName);
  staffHeader.appendChild(staffStatus);
  
  const staffDetails = document.createElement('div');
  staffDetails.className = 'staff-details';
  
  const staffSkill = document.createElement('div');
  staffSkill.className = 'staff-skill';
  staffSkill.textContent = `${engineer.genreAffinity?.genre || 'N/A'} (Lvl ${engineer.levelInRole})`;
  
  const staffSalary = document.createElement('div');
  staffSalary.className = 'staff-salary';
  staffSalary.textContent = `$${engineer.salary}/day`;
  
  staffDetails.appendChild(staffSkill);
  staffDetails.appendChild(staffSalary);
  
  const energyBar = document.createElement('div');
  energyBar.className = 'skill-progress';
  
  const energyProgress = document.createElement('div');
  energyProgress.className = 'skill-progress-bar';
  energyProgress.style.width = `${engineer.energy}%`;
  energyProgress.style.backgroundColor = 
    engineer.energy > 70 ? '#4caf50' : 
    engineer.energy > 30 ? '#ff9800' : '#f44336';
  
  energyBar.appendChild(energyProgress);
  
  const energyLabel = document.createElement('div');
  energyLabel.className = 'skill-xp';
  energyLabel.textContent = `Energy: ${engineer.energy}%`;
  
  // Action buttons
  const actionButtons = document.createElement('div');
  actionButtons.style.marginTop = '8px';
  actionButtons.style.display = 'flex';
  actionButtons.style.gap = '8px';
  
  // Assign button (if engineer is idle and there's an active project)
  if (engineer.status === 'Idle' && gameState.activeProject) {
    const assignButton = document.createElement('button');
    assignButton.className = 'action-button';
    assignButton.textContent = 'Assign to Project';
    const assignButtonElement: HTMLButtonElement = assignButton as HTMLButtonElement;
    assignButtonElement.disabled = false;
    assignButtonElement.addEventListener('click', () => {
      engineer.status = 'Working';
      closeAllModals();
      updateUI(gameState);
    });
    actionButtons.appendChild(assignButtonElement);
  }
  
  // Rest button (if engineer is working)
  if (engineer.status === 'Working') {
    const restButton = document.createElement('button');
    restButton.className = 'action-button';
    restButton.textContent = 'Send to Rest';
    const restButtonElement: HTMLButtonElement = restButton as HTMLButtonElement;
    restButtonElement.disabled = false;
    restButtonElement.addEventListener('click', () => {
      engineer.status = 'Resting';
      closeAllModals();
      updateUI(gameState);
    });
    actionButtons.appendChild(restButtonElement);
  }
  
  staffCard.appendChild(staffHeader);
  staffCard.appendChild(staffDetails);
  staffCard.appendChild(energyBar);
  energyBar.appendChild(energyLabel);
  staffCard.appendChild(actionButtons);
  
  return staffCard;
}

/**
 * Creates a candidate card element for an engineer
 */
function createCandidateCard(engineer: StaffMember, gameState: GameState): HTMLElement {
  const candidateCard = document.createElement('div');
  candidateCard.className = 'staff-card';
  
  const staffHeader = document.createElement('div');
  staffHeader.className = 'staff-header';
  
  const staffName = document.createElement('div');
  staffName.className = 'staff-name';
  staffName.textContent = engineer.name;
  
  const staffEfficiency = document.createElement('div');
  staffEfficiency.textContent = `Efficiency: ${engineer.primaryStats.speed}%`;
  
  staffHeader.appendChild(staffName);
  staffHeader.appendChild(staffEfficiency);
  
  const staffDetails = document.createElement('div');
  staffDetails.className = 'staff-details';
  
  const staffSkill = document.createElement('div');
  staffSkill.className = 'staff-skill';
  staffSkill.textContent = `${engineer.genreAffinity?.genre || 'N/A'} (Lvl ${engineer.levelInRole})`;
  
  const staffSalary = document.createElement('div');
  staffSalary.className = 'staff-salary';
  staffSalary.textContent = `$${engineer.salary}/day`;
  
  staffDetails.appendChild(staffSkill);
  staffDetails.appendChild(staffSalary);
  
  // Hire button
  const hireButton = document.createElement('button');
  hireButton.className = 'action-button';
  hireButton.textContent = 'Hire';
  const hireButtonElement: HTMLButtonElement = hireButton as HTMLButtonElement;
  hireButtonElement.disabled = gameState.money < engineer.salary * 5;
  if (hireButtonElement.disabled) {
    hireButtonElement.textContent = 'Not enough money';
  }

  hireButtonElement.addEventListener('click', () => {
    closeAllModals();
  });
  
  candidateCard.appendChild(staffHeader);
  candidateCard.appendChild(staffDetails);
  candidateCard.appendChild(hireButtonElement);
  
  return candidateCard;
}

/**
 * Shows the project review modal
 */
function showReviewModal(review: ProjectReview): void {
  const reviewModal = document.getElementById('review-modal');
  const reviewContent = document.getElementById('review-content');
  
  if (!reviewModal || !reviewContent) return;
  
  // Clear existing content
  reviewContent.innerHTML = '';
  
  // Create review sections
  const ratingSection = document.createElement('div');
  ratingSection.className = 'review-section';
  
  const ratingTitle = document.createElement('h3');
  ratingTitle.textContent = 'Project Rating';
  
  const ratingDisplay = document.createElement('div');
  ratingDisplay.className = 'review-rating';
  ratingDisplay.textContent = '⭐'.repeat(review.rating);
  
  ratingSection.appendChild(ratingTitle);
  ratingSection.appendChild(ratingDisplay);
  
  // Project stats
  const statsSection = document.createElement('div');
  statsSection.className = 'review-section';
  
  const statsTitle = document.createElement('h3');
  statsTitle.textContent = 'Project Stats';
  
  const statsDisplay = document.createElement('div');
  statsDisplay.className = 'review-stats';
  
  // Create stat boxes
  const scoreBox = createStatBox('Score', review.finalScore.toString());
  const payoutBox = createStatBox('Payout', `$${review.payout}`);
  const repBox = createStatBox('Reputation', `+${review.repGain}`);
  
  statsDisplay.appendChild(scoreBox);
  statsDisplay.appendChild(payoutBox);
  statsDisplay.appendChild(repBox);
  
  statsSection.appendChild(statsTitle);
  statsSection.appendChild(statsDisplay);
  
  // Comments
  const commentsSection = document.createElement('div');
  commentsSection.className = 'review-section';
  
  const commentsTitle = document.createElement('h3');
  commentsTitle.textContent = 'Client Feedback';
  
  const commentsDisplay = document.createElement('div');
  commentsDisplay.className = 'review-comments';
  commentsDisplay.textContent = review.comments;
  
  commentsSection.appendChild(commentsTitle);
  commentsSection.appendChild(commentsDisplay);
  
  // Rewards
  const rewardsSection = document.createElement('div');
  rewardsSection.className = 'review-section';
  
  const rewardsTitle = document.createElement('h3');
  rewardsTitle.textContent = 'Rewards';
  
  const rewardsDisplay = document.createElement('div');
  rewardsDisplay.className = 'review-rewards';
  
  const playerXp = document.createElement('p');
  playerXp.textContent = `Player XP: +${review.playerXp}`;
  
  const skillXpText = Object.entries(review.skillXp)
    .map(([skill, xp]) => `${skill}: +${xp} XP`)
    .join(', ');
  
  const skillXp = document.createElement('p');
  skillXp.textContent = `Skill XP: ${skillXpText}`;
  
  rewardsDisplay.appendChild(playerXp);
  rewardsDisplay.appendChild(skillXp);
  
  rewardsSection.appendChild(rewardsTitle);
  rewardsSection.appendChild(rewardsDisplay);
  
  // Add all sections to content
  reviewContent.appendChild(ratingSection);
  reviewContent.appendChild(statsSection);
  reviewContent.appendChild(commentsSection);
  reviewContent.appendChild(rewardsSection);
  
  // Show modal
  reviewModal.classList.remove('hidden');
}

/**
 * Creates a stat box for the review modal
 */
function createStatBox(label: string, value: string): HTMLElement {
  const statBox = document.createElement('div');
  statBox.className = 'review-stat';
  
  const statValue = document.createElement('span');
  statValue.className = 'review-stat-value';
  statValue.textContent = value;
  
  const statLabel = document.createElement('span');
  statLabel.className = 'review-stat-label';
  statLabel.textContent = label;
  
  statBox.appendChild(statValue);
  statBox.appendChild(statLabel);
  
  return statBox;
}

/**
 * Shows the level up modal
 */
export function showLevelUpModal(gameState: GameState): void {
  const levelUpModal = document.getElementById('level-up-modal');
  const closeLevelUpButton = document.getElementById('close-level-up');
  if (!levelUpModal) return;
  
  // Update level information
  const newLevelElement = document.getElementById('new-level');
  if (newLevelElement) {
    newLevelElement.textContent = `Level ${gameState.playerData.level}`;
  }
  
  const perkPointsElement = document.getElementById('perk-points');
  if (perkPointsElement) {
    perkPointsElement.textContent = gameState.playerData.perkPoints.toString();
  }
  
  // Update attributes
  const attributesContainer = document.getElementById('player-attributes');
  if (attributesContainer) {
    attributesContainer.innerHTML = '';
    
    // Add each attribute with upgrade button
    (Object.keys(gameState.playerData.attributes) as (keyof PlayerAttributes)[]).forEach(attrId => {
      const value = gameState.playerData.attributes[attrId];

      const attrItem = document.createElement('div');
      attrItem.className = 'attribute-item';
      
      // Format attribute name for display
      const displayName = attrId
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
      
      const attrName = document.createElement('div');
      attrName.className = 'attribute-name';
      attrName.textContent = displayName;
      
      const attrValue = document.createElement('div');
      attrValue.className = 'attribute-value';
      attrValue.textContent = value.toString();
      
      const upgradeButton = document.createElement('button');
      upgradeButton.className = 'attribute-upgrade';
      upgradeButton.textContent = '+';
      const upgradeButtonElement: HTMLButtonElement = upgradeButton as HTMLButtonElement;
      upgradeButtonElement.disabled = gameState.playerData.perkPoints <= 0;
      
      upgradeButtonElement.addEventListener('click', () => {
        if (spendPlayerPerkPoint(gameState, attrId)) {
          // Update the UI
          attrValue.textContent = gameState.playerData.attributes[attrId].toString();
          perkPointsElement.textContent = gameState.playerData.perkPoints.toString();
          
          // Disable button if no more perk points
          if (gameState.playerData.perkPoints <= 0) {
            document.querySelectorAll('.attribute-upgrade').forEach(btn => {
              (btn as HTMLButtonElement).disabled = true;
            });
          }
        }
      });
      
      attrItem.appendChild(attrName);
      attrItem.appendChild(attrValue);
      attrItem.appendChild(upgradeButtonElement);
      
      attributesContainer.appendChild(attrItem);
    });
  }
  
  // Set up close button event listener
  if (closeLevelUpButton) {
    // Remove existing event listeners
    const newCloseButton = closeLevelUpButton.cloneNode(true);
    closeLevelUpButton.parentNode?.replaceChild(newCloseButton, closeLevelUpButton);
    
    // Add new event listener
    newCloseButton.addEventListener('click', () => {
      levelUpModal.classList.add('hidden');
    });
  }
  
  // Show modal
  levelUpModal.classList.remove('hidden');
}

/**
 * Closes all modals
 */
function closeAllModals(): void {
  document.querySelectorAll('#modal-container, #staff-modal, #review-modal, #level-up-modal').forEach(modal => {
    modal.classList.add('hidden');
  });
}

/**
 * Simulates working on a project for one day.
 * Calculates points, processes work, and determines if stages or projects are completed.
 * Returns the updated game state and completion flags.
 */
export function simulateProjectWork(
  gameState: GameState
): { newState: GameState, stageCompleted: boolean, projectCompleted: boolean } {
  if (!gameState.activeProject) return { newState: gameState, stageCompleted: false, projectCompleted: false };

  // Calculate points based on focus allocation (this function is pure)
  const { creativityPoints, technicalPoints } = calculateStagePoints(gameState, gameState.activeProject.stages[gameState.activeProject.currentStageIndex].focusAreas);
  
  // Process work and get the new state and completion flags (this function is now refactored to be immutable)
  const { newState, stageCompleted, projectCompleted } = processStageWork(gameState, creativityPoints, technicalPoints);
  
  // Note: Orb animation logic removed here as it involved direct DOM manipulation.
  // It should be reimplemented using a React-compatible animation library or approach.

  // The UI update is now handled by React in StudioTycoon.tsx based on the returned newState.

  return { newState, stageCompleted, projectCompleted };
}