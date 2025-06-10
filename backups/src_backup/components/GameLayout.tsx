import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameHeader } from './GameHeader'
import { RightPanel } from './RightPanel'
import { NotificationSystem } from './NotificationSystem'
import { GameModals } from './GameModals'
import { useGameState } from '../hooks/useGameState'
import { usePlayerProgression } from '../hooks/usePlayerProgression'
import { useStaffManagement } from '../hooks/useStaffManagement'
import { useProjectManagement } from '../hooks/useProjectManagement'
import { useGameActions } from '../hooks/useGameActions'
import { FloatingRewardOrb } from './FloatingRewardOrb'
import { FloatingXPOrb } from './FloatingXPOrb'
import { XPProgressBar } from './XPProgressBar'
import { SkillProgressDisplay } from './SkillProgressDisplay'
import { AnimatedStatBlobs } from './AnimatedStatBlobs'
import { ActiveProject } from './ActiveProject'
import { ProjectList } from './ProjectList'
import { StaffAssignmentSection } from './StaffAssignmentSection'
import { BandManagement } from './BandManagement'
import { EquipmentList } from './EquipmentList'
import { MinigameManager } from './minigames/MinigameManager'
import { useMiniGame } from '../contexts/MiniGameContext'
import { useTheme } from '../hooks/useTheme'
import { useSound } from '../hooks/useSound'

export const GameLayout = () => {
  const { gameState, setGameState } = useGameState()
  const { playerLevel, playerXP, xpToNextLevel, playerAttributes, playerSkills, playerPerks } = usePlayerProgression(gameState)
  const { staff, assignStaffToProject, unassignStaffFromProject, hireStaff, trainStaff } = useStaffManagement(gameState, setGameState)
  const { projects, activeProject, startProject, completeProject, advanceProjectStage, assignStaffToStage, unassignStaffFromStage } = useProjectManagement(gameState, setGameState)
  const { advanceDay, collectMoney, addMoney, addReputation, addXP, addAttributePoints, addSkillXP, addPerkPoint } = useGameActions(gameState, setGameState)
  const { currentGame, startGame, endGame } = useMiniGame()
  const { currentTheme, changeTheme } = useTheme()
  const { playSound, stopSound, toggleMute } = useSound()

  const [showProjectList, setShowProjectList] = useState(true)
  const [showStaffAssignment, setShowStaffAssignment] = useState(false)
  const [showBandManagement, setShowBandManagement] = useState(false)
  const [showEquipmentList, setShowEquipmentList] = useState(false)
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([])

  // Theme-based styles
  const themeStyles = {
    modern: {
      background: 'bg-gradient-to-br from-gray-900 to-black',
      card: 'bg-gray-800/80 backdrop-blur-sm',
      text: 'text-white',
      accent: 'text-blue-400'
    },
    vintage: {
      background: 'bg-gradient-to-br from-amber-900 to-yellow-900',
      card: 'bg-amber-800/80 backdrop-blur-sm',
      text: 'text-amber-100',
      accent: 'text-amber-400'
    },
    dark: {
      background: 'bg-gradient-to-br from-gray-950 to-black',
      card: 'bg-gray-900/80 backdrop-blur-sm',
      text: 'text-gray-100',
      accent: 'text-purple-400'
    },
    light: {
      background: 'bg-gradient-to-br from-gray-100 to-white',
      card: 'bg-white/80 backdrop-blur-sm',
      text: 'text-gray-900',
      accent: 'text-blue-600'
    }
  }

  const handleStartProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      startProject(project)
      setShowProjectList(false)
      playSound('click')
      addNotification('Project started: ' + project.name, 'success')
    }
  }

  const handleCompleteProject = (projectId: string) => {
    const result = completeProject(gameState)
    if (result) {
      setShowProjectList(true)
      playSound('success')
      addNotification('Project completed successfully!', 'success')
    }
  }

  const handleAdvanceDay = () => {
    advanceDay()
    playSound('click')
    addNotification('Advanced to next day', 'info')
  }

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3000)
  }

  return (
    <div className={`min-h-screen ${themeStyles[currentTheme].background} ${themeStyles[currentTheme].text} font-inter`}>
      <GameHeader
        money={gameState.playerData.money}
        reputation={gameState.playerData.reputation}
        currentDay={gameState.currentDay}
        playerLevel={playerLevel}
        playerXP={playerXP}
        xpToNextLevel={xpToNextLevel}
        staffCount={staff.length}
        onAdvanceDay={handleAdvanceDay}
        currentTheme={currentTheme}
        onThemeChange={changeTheme}
        onToggleMute={toggleMute}
      />

      <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <motion.div 
          className={`lg:col-span-2 ${themeStyles[currentTheme].card} rounded-lg shadow-lg p-6`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-4">Studio Overview</h2>

          {activeProject ? (
            <ActiveProject
              project={activeProject}
              staff={staff}
              onCompleteProject={handleCompleteProject}
              onAdvanceProjectStage={advanceProjectStage}
              onAssignStaffToStage={assignStaffToStage}
              onUnassignStaffFromStage={unassignStaffFromStage}
              playerSkills={playerSkills}
              currentTheme={currentTheme}
            />
          ) : (
            <motion.div 
              className={`${themeStyles[currentTheme].card} p-4 rounded-md text-center`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-lg text-gray-400">No Active Project</p>
              <p className="text-sm text-gray-500">Select a project from the Projects tab to begin work</p>
            </motion.div>
          )}

          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-3">Available Projects</h3>
            <ProjectList
              projects={projects}
              onStartProject={handleStartProject}
              currentTheme={currentTheme}
            />
          </div>
        </motion.div>

        {/* Right Panel */}
        <RightPanel
          gameState={gameState}
          showSkillsModal={false}
          setShowSkillsModal={() => {}}
          showAttributesModal={false}
          setShowAttributesModal={() => {}}
          spendPerkPoint={addAttributePoints}
          advanceDay={handleAdvanceDay}
          purchaseEquipment={() => {}}
          currentTheme={currentTheme}
        />
      </div>

      {/* Modals and Overlays */}
      <GameModals
        showReviewModal={false}
        setShowReviewModal={() => {}}
        lastReview={null}
        showProgressionModal={false}
        setShowProgressionModal={() => {}}
        showSkillsModal={false}
        setShowSkillsModal={() => {}}
        showAttributesModal={false}
        setShowAttributesModal={() => {}}
        gameState={gameState}
        spendPerkPoint={addAttributePoints}
        currentTheme={currentTheme}
      />

      <NotificationSystem
        notifications={notifications}
        removeNotification={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
        currentTheme={currentTheme}
      />

      {/* Minigame Overlay */}
      <AnimatePresence>
        {currentGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          >
            <MinigameManager
              minigameType={currentGame.type}
              onComplete={(score) => endGame(score)}
              difficulty={Number(currentGame.difficulty)}
              currentTheme={currentTheme}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Orbs and Blobs */}
      <FloatingRewardOrb currentTheme={currentTheme} />
      <FloatingXPOrb amount={0} type="xp" currentTheme={currentTheme} />
      <XPProgressBar xp={playerXP} xpToNextLevel={xpToNextLevel} level={playerLevel} currentTheme={currentTheme} />
      <SkillProgressDisplay skills={playerSkills} currentTheme={currentTheme} />
      <AnimatedStatBlobs
        creativityGain={0}
        technicalGain={0}
        onComplete={() => {}}
        containerRef={null}
        currentTheme={currentTheme}
      />
    </div>
  )
}
