import { money } from '@/utils/displayMoney';
import { ArtistRoster } from '@/components/ArtistRoster';
import type { ArtistProspect, ContractTerms, NegotiationOutcome } from '@/simulation/artistContracts';
import { ShowPlan } from '@/simulation/liveShows';
import { StudioRecycler } from '@/features/usedGear/StudioRecycler';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GamePanel } from '@/components/ui/GamePanel';
import { KenneyButton } from '@/components/ui/KenneyButton';
import { promoteStaffInState, startCrossTrainingInState, startMentoringInState, stopMentoringInState } from '@/rpg/staffCareer';
import { spend } from '@/economy/ledger';
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
import { PremisesPanel } from '@/components/PremisesPanel';
import { StudioProgressionPanel } from '@/components/StudioProgressionPanel'; // Add Studio Progression Panel
import { toast } from '@/hooks/use-toast'; // Import toast
import { ProgressionSystem } from '@/services/ProgressionSystem';
import { getOperationalStudioRooms, getOccupiedRoomIds, applyStudioRoomPurchase, getStudioRoomPurchaseAvailability } from '@/utils/studioRoomUtils';
import { SynergyEncyclopedia } from '@/components/synergy/SynergyEncyclopedia';
import { Sparkles, TrendingUp } from 'lucide-react';
import { gameAudio } from '@/utils/audioSystem';
import { CrewRecruitmentPortal } from '@/components/crew/CrewRecruitmentPortal';
import { SkillPracticePanel } from '@/components/skills/SkillPracticePanel';

type DashboardTab = 'studio' | 'skills' | 'bands' | 'charts' | 'staff' | 'synergies';

/** Only Skills/Recipes live here; Gear/Crew/Artists/Charts open from the dock/hotspots. */
const SECONDARY_TABS = [
  { id: 'skills', label: 'Skills', icon: TrendingUp },
  { id: 'synergies', label: 'Recipes', icon: Sparkles },
] as const satisfies ReadonlyArray<{ id: Extract<DashboardTab, 'skills' | 'synergies'>; label: string; icon: typeof TrendingUp }>;

export interface RightPanelProps {
  requestedTab?: DashboardTab;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  spendPerkPoint: (attribute: keyof PlayerAttributes) => void;
  purchaseEquipment: (equipmentId: string) => void;
  hireStaff: (candidateIndex: number) => boolean;
  refreshCandidates: (channelId?: import('@/rpg/recruitment').RecruitmentChannelId) => void;
  assignStaffToProject: (staffId: string) => void;
  unassignStaffFromProject: (staffId: string) => void;
  toggleStaffRest: (staffId: string) => void;
  openTrainingModal: (staff: StaffMember) => boolean;
  contactArtist: (artistId: string, offer: number) => void;
  onEraTransition: () => { fromEra?: string; toEra?: string } | void;
  createBand: (bandName: string, memberIds: string[]) => void;
  startTour: (bandId: string) => void;
  playShow: (bandId: string, plan: ShowPlan) => void;
  artistContracts: {
    makeOffer: (prospect: ArtistProspect, offer: ContractTerms) => NegotiationOutcome;
    signContract: (prospect: ArtistProspect, terms: ContractTerms) => boolean;
    passOnProspect: (prospectId: string) => void;
  };
  createOriginalTrack: (bandId: string) => void;
  startResearchMod?: (staffId: string, modId: string) => boolean;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  gameState,
  setGameState,
  spendPerkPoint,
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
  playShow,
  artistContracts,
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
      {/* Secondary destinations only — Gear/Crew/Artists/Charts come from the floor dock. */}
      <nav
        aria-label="Skills and recipes"
        className="grid grid-cols-2 shrink-0 mb-2.5 overflow-hidden rounded-lg border border-stone-700/80 bg-black/25 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_14px_rgba(0,0,0,0.3)]"
      >
        {SECONDARY_TABS.map(({ id, label, icon: Icon }) => {
          const selected = activeTab === id;
          const discoveryCount = id === 'synergies' ? (gameState.discoveredSynergies?.length ?? 0) : 0;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={selected}
              onClick={() => selectTab(id)}
              title={id === 'synergies' ? 'Studio Recipe & Synergy Codex' : label}
              className={`relative flex min-w-0 flex-row items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-bold leading-none transition-all focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-1 focus-visible:ring-offset-stone-950 ${
                selected
                  ? 'bg-[rgba(230,184,102,0.13)] text-amber-200 shadow-[inset_0_2px_5px_rgba(0,0,0,0.9),inset_0_-1px_0_rgba(255,255,255,0.08)]'
                  : 'text-stone-400 hover:bg-white/5 hover:text-stone-100 active:translate-y-px'
              }`}
            >
              <Icon aria-hidden="true" className={`h-4 w-4 ${selected ? 'drop-shadow-[0_0_5px_rgba(251,191,36,0.45)]' : ''}`} strokeWidth={2.1} />
              <span className="truncate">{label}</span>
              {discoveryCount > 0 && (
                <span className="absolute right-1.5 top-1 min-w-3.5 rounded-full bg-amber-400 px-1 text-[8px] leading-3.5 text-stone-950 shadow">
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
            {/* Studio Progression Panel */}
            <StudioProgressionPanel gameState={gameState} />
            <PremisesPanel gameState={gameState} setGameState={setGameState} />

            {/* Studio Rooms */}
            <div className="rounded-lg border border-stone-700 bg-stone-950/50 p-2.5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-bold text-white">🏢 Studio Rooms</h3>
                  <p className="text-[10px] text-stone-400">
                    {unlockedRooms.length} owned · {roomExpansionLimit} allowed
                  </p>
                </div>
                <div className="text-[10px] text-stone-400">
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
                            ? 'border-amber-500/40 bg-stone-950/20'
                            : 'border-green-500/30 bg-green-950/10'
                          : 'border-stone-700 bg-stone-900/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-stone-100">{room.name}</div>
                          <div className="text-[10px] text-stone-500 capitalize">
                            {room.type.replace('-', ' ')} · Q+{room.qualityBonus} · S+{room.speedBonus}
                          </div>
                        </div>
                        {room.unlocked ? (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                            occupied ? 'bg-amber-500/15 text-amber-200' : 'bg-green-500/15 text-green-300'
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
                                : `Buy ${money(room.purchaseCost)}`}
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
            <div className="rounded-lg border border-stone-700 bg-stone-950/50 p-2.5">
              <EquipmentList purchaseEquipment={purchaseEquipment} gameState={gameState} />
            </div>

            <StudioRecycler gameState={gameState} setGameState={setGameState} />

            {/* Slot-based gear racks (bead 8om) — drag owned gear into room chassis */}
            <GearRackBoard gameState={gameState} setGameState={setGameState} />

            {/* Quick mod access when research unlocks hardware mods */}
            {gameState.researchedMods && gameState.researchedMods.length > 0 && gameState.ownedEquipment.length > 0 && (
              <div className="rounded-lg border border-stone-700 bg-stone-950/50 p-2.5">
                <h3 className="text-xs font-bold text-white mb-2">🛠️ Gear mods</h3>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {gameState.ownedEquipment.map(equip => {
                    const currentMod = equip.appliedModId ? availableMods.find(m => m.id === equip.appliedModId) : null;
                    return (
                      <Card key={equip.id} className="p-2 bg-stone-800/60 border-stone-700">
                        <div className="flex justify-between items-center text-xs">
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-stone-200 truncate">
                              {equip.icon} {equip.name}
                              {currentMod && <span className="text-[10px] text-yellow-400 ml-1">{currentMod.nameSuffix || `(${currentMod.name})`}</span>}
                            </p>
                            <p className="text-[10px] text-stone-400">Condition: {equip.condition}%</p>
                          </div>
                          <KenneyButton
                            size="sm"
                            variant="yellow"
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
          <SkillPracticePanel gameState={gameState} setGameState={setGameState} />

          <div className="rounded-[3px] border border-stone-700/80 bg-stone-950/50 p-2.5 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Producer desk</div>
            <div className="text-xs text-stone-300 flex flex-wrap gap-x-3 gap-y-1">
              <span>Level {gameState.playerData.level}</span>
              <span>XP {gameState.playerData.xp}/{gameState.playerData.xpToNextLevel}</span>
              <span className="text-amber-300">{gameState.playerData.perkPoints} talent pts</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <KenneyButton onClick={() => setShowAttributesModal(true)} variant="blue" size="sm" className="w-full">
                Talents
              </KenneyButton>
              <KenneyButton onClick={() => setShowSkillsModal(true)} variant="grey" size="sm" className="w-full">
                Genre skills
              </KenneyButton>
            </div>
          </div>

          <StudioProgressionPanel gameState={gameState} />
        </div>
      )}

      {activeTab === 'staff' && (
        <div className="space-y-4">
          <CrewRecruitmentPortal
            gameState={gameState}
            hireStaff={hireStaff}
            refreshCandidates={refreshCandidates}
            assignStaffToProject={assignStaffToProject}
            unassignStaffFromProject={unassignStaffFromProject}
            toggleStaffRest={toggleStaffRest}
            openTrainingModal={openTrainingModal}
            promoteStaff={(staffId) => { void gameAudio.playGearSwitch(); setGameState(prev => promoteStaffInState(prev, staffId)); }}
            crossTrainStaff={(staffId, d) => setGameState(prev => startCrossTrainingInState(prev, staffId, d, (g, cost, id, memo) => spend(g, cost, { category: 'training', staffId: id, memo })))}
            setMentor={(juniorId, mentorId) => setGameState(prev => mentorId ? startMentoringInState(prev, mentorId, juniorId) : stopMentoringInState(prev, juniorId))}
          />
          {gameState.hiredStaff.some(s => s.role === 'Engineer' && s.status === 'Idle') && (
            <KenneyButton
              onClick={() => setShowResearchModal(true)}
              variant="green"
              size="md"
              className="w-full"
            >
              Open gear research lab
            </KenneyButton>
          )}
        </div>
      )}

      {activeTab === 'bands' && (
        <BandManagement
          gameState={gameState}
          onCreateBand={createBand}
          onStartTour={startTour}
          onPlayShow={playShow}
          onCreateOriginalTrack={createOriginalTrack}
        />
      )}

      {activeTab === 'bands' && (
        <ArtistRoster
          gameState={gameState}
          onMakeOffer={artistContracts.makeOffer}
          onSignContract={artistContracts.signContract}
          onPass={artistContracts.passOnProspect}
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
          <div className="text-center text-stone-400 py-8">
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
