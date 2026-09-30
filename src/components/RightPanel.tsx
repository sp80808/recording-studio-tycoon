import { StudioRecycler } from '@/features/usedGear/StudioRecycler';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GamePanel } from '@/components/ui/GamePanel';
import { KenneyButton } from '@/components/ui/KenneyButton';
import { GameState, PlayerAttributes, StaffMember } from '@/types/game';
import { SkillsModal } from '@/components/modals/SkillsModal';
import { AttributesModal } from '@/components/modals/AttributesModal';
import { ResearchModal } from '@/components/modals/ResearchModal'; // Import ResearchModal
import { EquipmentModManagementModal } from '@/components/modals/EquipmentModManagementModal'; // Import new modal
import { availableMods } from '@/data/equipmentMods'; // Import availableMods
import { EquipmentList } from '@/components/EquipmentList';
import { GearRackBoard } from '@/components/equipment/GearRackBoard';
import { BandManagement } from '@/components/BandManagement';
import { ChartsPanel } from '@/components/ChartsPanel';
import { StudioProgressionPanel } from '@/components/StudioProgressionPanel'; // Add Studio Progression Panel
import { toast } from '@/hooks/use-toast'; // Import toast
import { ProgressionSystem } from '@/services/ProgressionSystem';
import { getOperationalStudioRooms, getOccupiedRoomIds, applyStudioRoomPurchase, getStudioRoomPurchaseAvailability } from '@/utils/studioRoomUtils';
import { calculateStaffProjectFit } from '@/utils/staffFitUtils';
import { SynergyEncyclopedia } from '@/components/synergy/SynergyEncyclopedia';
import { BarChart3, Building2, Guitar, Sparkles, TrendingUp, Users } from 'lucide-react';
import { gameAudio } from '@/utils/audioSystem';

type DashboardTab = 'studio' | 'skills' | 'bands' | 'charts' | 'staff' | 'synergies';

const DASHBOARD_TABS = [
  { id: 'studio', label: 'Studio', icon: Building2 },
  { id: 'skills', label: 'Skills', icon: TrendingUp },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'bands', label: 'Bands', icon: Guitar },
  { id: 'charts', label: 'Charts', icon: BarChart3 },
  { id: 'synergies', label: 'Recipes', icon: Sparkles },
] as const satisfies ReadonlyArray<{ id: DashboardTab; label: string; icon: typeof Building2 }>;

export interface RightPanelProps {
  requestedTab?: DashboardTab;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  spendPerkPoint: (attribute: keyof PlayerAttributes) => void;
  advanceDay: () => void;
  purchaseEquipment: (equipmentId: string) => void;
  hireStaff: (candidateIndex: number) => boolean;
  refreshCandidates: () => void;
  assignStaffToProject: (staffId: string) => void;
  unassignStaffFromProject: (staffId: string) => void;
  toggleStaffRest: (staffId: string) => void;
  openTrainingModal: (staff: StaffMember) => boolean;
  contactArtist: (artistId: string, offer: number) => void;
  onEraTransition: () => { fromEra?: string; toEra?: string } | void;
  createBand: (bandName: string, memberIds: string[]) => void;
  startTour: (bandId: string) => void;
  createOriginalTrack: (bandId: string) => void;
  startResearchMod?: (staffId: string, modId: string) => boolean;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  gameState,
  setGameState,
  spendPerkPoint,
  advanceDay,
  purchaseEquipment,
  hireStaff,
  refreshCandidates,
  assignStaffToProject,
  unassignStaffFromProject,
  toggleStaffRest,
  openTrainingModal,
  contactArtist,
  onEraTransition,
  createBand,
  startTour,
  createOriginalTrack,
  startResearchMod,
  requestedTab
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(requestedTab ?? 'studio');
  useEffect(() => { if (requestedTab) setActiveTab(requestedTab); }, [requestedTab]);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showAttributesModal, setShowAttributesModal] = useState(false);
  const [showResearchModal, setShowResearchModal] = useState(false);
  const [showEquipmentModModal, setShowEquipmentModModal] = useState(false);
  const [selectedEquipmentForModding, setSelectedEquipmentForModding] = useState<GameState['ownedEquipment'][0] | null>(null);

  // Room inspectors (goj.2) can request a dashboard tab via a DOM event,
  // e.g. clicking the Charts TV swaps this panel to 'charts' without
  // needing to lift tab state up through MainGameContent.
  useEffect(() => {
    const onOpenTab = (e: Event) => {
      const tab = (e as CustomEvent).detail as typeof activeTab | undefined;
      if (tab && ['studio', 'skills', 'bands', 'charts', 'staff', 'synergies'].includes(tab)) {
        setActiveTab(tab);
      }
    };
    window.addEventListener('rst:open-dashboard-tab', onOpenTab);
    return () => window.removeEventListener('rst:open-dashboard-tab', onOpenTab);
  }, []);

  const handleEraTransition = () => {
    const result = onEraTransition();
    if (result && result.fromEra && result.toEra) {
      toast({
        title: "Era Transition",
        description: `Transitioning from ${result.fromEra} to ${result.toEra}`,
      });
    }
  };

  const unlockedRooms = getOperationalStudioRooms(gameState);
  const occupiedRoomIds = getOccupiedRoomIds(gameState);
  const roomExpansionLimit = ProgressionSystem.getRoomExpansionLimit(gameState);

  const purchaseStudioRoom = (roomId: string) => {
    void gameAudio.playGearSwitch();
    setGameState(prev => applyStudioRoomPurchase(prev, roomId, ProgressionSystem.getRoomExpansionLimit(prev)));
  };
  const applyModToEquipment = (equipmentId: string, modId: string | null) => {
    void gameAudio.playGearSwitch();
    setGameState(prev => ({
      ...prev,
      ownedEquipment: prev.ownedEquipment.map(eq => 
        eq.id === equipmentId 
          ? { ...eq, appliedModId: modId }
          : eq
      )
    }));
  };

  const selectTab = (tab: DashboardTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    void gameAudio.playTactileClick();
  };

  return (
    <GamePanel className="p-3 flex-1 min-h-0 w-full flex flex-col overflow-hidden backdrop-blur-md animate-slide-in-right">
      {/* Tab Navigation (Pinned) */}
      <nav
        aria-label="Management panels"
        className="grid grid-cols-6 shrink-0 mb-2.5 overflow-hidden rounded-lg border border-slate-700/80 bg-gradient-to-b from-slate-700/70 to-slate-950 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_14px_rgba(0,0,0,0.3)]"
      >
        {DASHBOARD_TABS.map(({ id, label, icon: Icon }) => {
          const selected = activeTab === id;
          const discoveryCount = id === 'synergies' ? (gameState.discoveredSynergies?.length ?? 0) : 0;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={selected}
              onClick={() => selectTab(id)}
              title={id === 'synergies' ? 'Studio Recipe & Synergy Codex' : label}
              className={`relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1.5 text-[10px] font-bold leading-none transition-all focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950 ${
                selected
                  ? 'bg-gradient-to-b from-slate-950 to-slate-800 text-amber-200 shadow-[inset_0_2px_5px_rgba(0,0,0,0.9),inset_0_-1px_0_rgba(255,255,255,0.08)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-100 active:translate-y-px'
              }`}
            >
              <Icon aria-hidden="true" className={`h-4 w-4 ${selected ? 'drop-shadow-[0_0_5px_rgba(251,191,36,0.45)]' : ''}`} strokeWidth={2.1} />
              <span className="truncate">{label}</span>
              {discoveryCount > 0 && (
                <span className="absolute right-1 top-1 min-w-3.5 rounded-full bg-amber-400 px-1 text-[8px] leading-3.5 text-slate-950 shadow">
                  {discoveryCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Tab Content (Scrollable Container) */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {activeTab === 'studio' && (
          <div className="space-y-3">
            {/* Prominent Advance Day Action Banner */}
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-gradient-to-r from-purple-950/80 via-indigo-950/70 to-slate-900 border border-purple-500/50 shadow-md">
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="text-amber-300 font-extrabold">☀ Day {gameState.currentDay}</span>
                  <span className="text-[10px] text-purple-300 font-medium">({gameState.currentYear})</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Advances calendar & restores producer sessions
                </div>
              </div>
              <KenneyButton 
                onClick={advanceDay} 
                size="sm" 
                variant="yellow"
                className="shrink-0"
              >
                Advance Day ❯
              </KenneyButton>
            </div>

            {/* Studio Progression Panel */}
            <StudioProgressionPanel gameState={gameState} />

            {/* Studio Rooms */}
            <div className="rounded-lg border border-gray-700 bg-gray-950/50 p-2.5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-bold text-white">🏢 Studio Rooms</h3>
                  <p className="text-[10px] text-gray-400">
                    {unlockedRooms.length} owned · {roomExpansionLimit} allowed
                  </p>
                </div>
                <div className="text-[10px] text-gray-400">
                  {occupiedRoomIds.size}/{unlockedRooms.length} occupied
                </div>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {gameState.studioRooms.map(room => {
                  const occupied = occupiedRoomIds.has(room.id);
                  const levelLocked = gameState.playerData.level < room.requiredPlayerLevel;
                  const expansionLocked = !room.unlocked && unlockedRooms.length >= roomExpansionLimit;
                  const availability = getStudioRoomPurchaseAvailability(gameState, room.id, roomExpansionLimit);

                  return (
                    <div
                      key={room.id}
                      className={`rounded border p-2 ${
                        room.unlocked
                          ? occupied
                            ? 'border-blue-500/40 bg-blue-950/20'
                            : 'border-green-500/30 bg-green-950/10'
                          : 'border-gray-700 bg-gray-900/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-gray-100">{room.name}</div>
                          <div className="text-[10px] text-gray-500 capitalize">
                            {room.type.replace('-', ' ')} · Q+{room.qualityBonus} · S+{room.speedBonus}
                          </div>
                        </div>
                        {room.unlocked ? (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                            occupied ? 'bg-blue-500/15 text-blue-300' : 'bg-green-500/15 text-green-300'
                          }`}>
                            {occupied ? 'In session' : 'Available'}
                          </span>
                        ) : (
                          <KenneyButton
                            size="sm"
                            variant={availability.available ? 'green' : 'grey'}
                            disabled={!availability.available}
                            onClick={() => purchaseStudioRoom(room.id)}
                            className="text-[10px] py-0.5 px-2"
                          >
                            {levelLocked
                              ? `Lvl ${room.requiredPlayerLevel}`
                              : expansionLocked
                                ? 'Milestone'
                                : `Buy $${room.purchaseCost.toLocaleString()}`}
                          </KenneyButton>
                        )}
                      </div>
                      {!room.unlocked && availability.available === false && (
                        <p className="mt-2 text-[10px] leading-relaxed text-amber-200/80">{availability.explanation}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Equipment Shop Section */}
            <div className="rounded-lg border border-gray-700 bg-gray-950/50 p-2.5 max-h-72 overflow-y-auto pr-1">
              <EquipmentList purchaseEquipment={purchaseEquipment} gameState={gameState} />
            </div>

            <StudioRecycler gameState={gameState} setGameState={setGameState} />

            {/* Slot-based gear racks (bead 8om) — drag owned gear into room chassis */}
            <GearRackBoard gameState={gameState} setGameState={setGameState} />

            {/* Quick mod access when research unlocks hardware mods */}
            {gameState.researchedMods && gameState.researchedMods.length > 0 && gameState.ownedEquipment.length > 0 && (
              <div className="rounded-lg border border-gray-700 bg-gray-950/50 p-2.5">
                <h3 className="text-xs font-bold text-white mb-2">🛠️ Gear mods</h3>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {gameState.ownedEquipment.map(equip => {
                    const currentMod = equip.appliedModId ? availableMods.find(m => m.id === equip.appliedModId) : null;
                    return (
                      <Card key={equip.id} className="p-2 bg-gray-800/60 border-gray-700">
                        <div className="flex justify-between items-center text-xs">
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-gray-200 truncate">
                              {equip.icon} {equip.name}
                              {currentMod && <span className="text-[10px] text-yellow-400 ml-1">{currentMod.nameSuffix || `(${currentMod.name})`}</span>}
                            </p>
                            <p className="text-[10px] text-gray-400">Condition: {equip.condition}%</p>
                          </div>
                          <KenneyButton
                            size="sm"
                            variant="blue"
                            className="text-[10px] py-0.5 px-2 shrink-0"
                            onClick={() => {
                              setSelectedEquipmentForModding(equip);
                              setShowEquipmentModModal(true);
                            }}
                          >
                            Mods
                          </KenneyButton>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      {activeTab === 'skills' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Player Progression</h2>
          <div className="text-gray-300">Level: {gameState.playerData.level}</div>
          <div className="text-gray-300">XP: {gameState.playerData.xp} / {gameState.playerData.xpToNextLevel}</div>
          <div className="text-green-400">Perk Points: {gameState.playerData.perkPoints}</div>

          <KenneyButton onClick={() => setShowAttributesModal(true)} variant="blue" size="md" className="w-full">
            Upgrade Attributes
          </KenneyButton>
          <KenneyButton onClick={() => setShowSkillsModal(true)} variant="blue" size="md" className="w-full">
            View Studio Skills
          </KenneyButton>

          <div className="mt-4">
            <StudioProgressionPanel gameState={gameState} />
          </div>
        </div>
      )}

      {activeTab === 'staff' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">👥 Staff Management</h2>
          
          <div className="text-sm text-gray-400 mb-4">
            Hire and manage studio staff to help with projects
          </div>

          <KenneyButton 
            onClick={refreshCandidates} 
            variant="green"
            size="md"
            className="w-full mb-4"
          >
            🔄 Refresh Candidates
          </KenneyButton>

          {/* Staff candidates section */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Available Staff</h3>
            {gameState.availableCandidates && gameState.availableCandidates.length > 0 ? (
              gameState.availableCandidates.map((candidate, index) => (
                <div key={candidate.id || index} className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-white font-medium">{candidate.name}</div>
                      <div className="text-gray-400 text-sm">{candidate.role}</div>
                    </div>
                    <div className="text-green-400 font-bold">${candidate.salary}/day</div>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    Creativity: {candidate.primaryStats.creativity}, Technical: {candidate.primaryStats.technical}, Speed: {candidate.primaryStats.speed}
                  </div>
                  {gameState.activeProject && (() => {
                    const fit = calculateStaffProjectFit(candidate, gameState.activeProject!);
                    return (
                      <div className="text-[11px] text-blue-300 mb-2">
                        Current-session fit {fit.score}/100 · {fit.reasons.slice(0, 2).join(' · ')}
                      </div>
                    );
                  })()}
                  {candidate.genreAffinity && (
                    <div className="text-xs text-purple-400 mb-2">
                      Specialty: {candidate.genreAffinity.genre} (+{candidate.genreAffinity.bonus}%)
                    </div>
                  )}
                  <KenneyButton 
                    onClick={() => hireStaff(index)}
                    variant={gameState.money >= candidate.salary * 3 ? 'green' : 'grey'}
                    size="sm"
                    className="w-full"
                    disabled={gameState.money < candidate.salary * 3}
                  >
                    {gameState.money >= candidate.salary * 3 ? `Hire for $${candidate.salary * 3}` : 'Insufficient Funds'}
                  </KenneyButton>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-center py-4">
                No candidates available. Click refresh to find new staff!
              </div>
            )}
          </div>

          {/* Hired staff section */}
          {gameState.hiredStaff && gameState.hiredStaff.length > 0 && (
            <div className="space-y-2 mt-6">
              <h3 className="text-lg font-semibold text-white">Current Staff</h3>
              {gameState.hiredStaff.map(staff => (
                <div key={staff.id} className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-white font-medium">{staff.name}</div>
                      <div className="text-gray-400 text-sm">{staff.role}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 text-sm">${staff.salary}/day</div>
                      <div className={`text-xs ${
                        staff.status === 'Working' ? 'text-blue-400' : 
                        staff.status === 'Idle' ? 'text-gray-400' : 
                        staff.status === 'Resting' ? 'text-yellow-400' : 'text-purple-400'
                      }`}>
                        {staff.status}
                      </div>
                    </div>
                  </div>
                  {gameState.activeProject && (() => {
                    const fit = calculateStaffProjectFit(staff, gameState.activeProject!);
                    return (
                      <div className="text-[11px] text-blue-300 mb-2">
                        Session fit {fit.score}/100 · {fit.reasons.slice(0, 3).join(' · ')}
                      </div>
                    );
                  })()}
                  <div className="flex gap-2 mt-2">
                    {staff.status === 'Idle' && (
                      <KenneyButton 
                        onClick={() => { void gameAudio.playGearSwitch(0.3); assignStaffToProject(staff.id); }}
                        variant="blue"
                        size="sm"
                        className="flex-1 text-xs"
                      >
                        Assign
                      </KenneyButton>
                    )}
                    {staff.status === 'Working' && (
                      <KenneyButton 
                        onClick={() => { void gameAudio.playTactileClick(); unassignStaffFromProject(staff.id); }}
                        variant="red"
                        size="sm"
                        className="flex-1 text-xs"
                      >
                        Unassign
                      </KenneyButton>
                    )}
                    <KenneyButton 
                      onClick={() => { void gameAudio.playGearSwitch(0.2); toggleStaffRest(staff.id); }}
                      variant="yellow"
                      size="sm"
                      className="flex-1 text-xs"
                    >
                      {staff.status === 'Resting' ? 'Wake' : 'Rest'}
                    </KenneyButton>
                    {staff.status === 'Idle' && (
                      <KenneyButton 
                        onClick={() => openTrainingModal(staff)}
                        variant="blue"
                        size="sm"
                        className="flex-1 text-xs"
                      >
                        Train
                      </KenneyButton>
                    )}
                    {staff.role === 'Engineer' && staff.status === 'Idle' && (
                      <KenneyButton
                        onClick={() => {
                          // setSelectedEngineerForResearch(staff); // ResearchModal will handle staff selection internally
                          setShowResearchModal(true);
                        }}
                        variant="green"
                        size="sm"
                        className="flex-1 text-xs"
                      >
                        Research
                      </KenneyButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bands' && (
        <BandManagement
          gameState={gameState}
          onCreateBand={createBand}
          onStartTour={startTour}
          onCreateOriginalTrack={createOriginalTrack}
        />
      )}

      {activeTab === 'charts' && gameState.playerData.level >= 1 && (
        <ChartsPanel
          gameState={gameState}
          onContactArtist={contactArtist}
        />
      )}

      {activeTab === 'charts' && gameState.playerData.level < 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">📈 Industry Charts</h2>
          <div className="text-center text-gray-400 py-8">
            <div className="text-4xl mb-2">🔒</div>
            <div className="text-sm">Charts access unlocks at Level 1</div>
            <div className="text-xs mt-1">Complete projects to access industry charts!</div>
          </div>
        </div>
      )}

      {activeTab === 'synergies' && (
        <SynergyEncyclopedia gameState={gameState} />
      )}
      </div>

      <SkillsModal
        isOpen={showSkillsModal}
        onClose={() => setShowSkillsModal(false)}
        studioSkills={gameState.studioSkills}
      />

      <AttributesModal
        isOpen={showAttributesModal}
        onClose={() => setShowAttributesModal(false)}
        playerData={gameState.playerData}
        spendPerkPoint={spendPerkPoint}
      />
      {/* Render ResearchModal if startResearchMod is available */}
      {startResearchMod && (
        <ResearchModal
          isOpen={showResearchModal}
          onClose={() => {
            setShowResearchModal(false);
            // setSelectedEngineerForResearch(null); // No longer needed as modal handles selection
          }}
          gameState={gameState}
          startResearchMod={startResearchMod}
        />
      )}

      {selectedEquipmentForModding && applyModToEquipment && ( // Ensure applyModToEquipment is available
        <EquipmentModManagementModal
          isOpen={showEquipmentModModal}
          onClose={() => {
            setShowEquipmentModModal(false);
            setSelectedEquipmentForModding(null);
          }}
          equipment={selectedEquipmentForModding}
          gameState={gameState}
          onApplyMod={applyModToEquipment} // Pass the actual function
        />
      )}
    </GamePanel>
  );
};

export default RightPanel;
