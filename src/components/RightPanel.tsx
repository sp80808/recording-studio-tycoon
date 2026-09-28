import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GameState, PlayerAttributes, StaffMember } from '@/types/game';
import { SkillsModal } from '@/components/modals/SkillsModal';
import { AttributesModal } from '@/components/modals/AttributesModal';
import { ResearchModal } from '@/components/modals/ResearchModal'; // Import ResearchModal
import { EquipmentModManagementModal } from '@/components/modals/EquipmentModManagementModal'; // Import new modal
import { availableMods } from '@/data/equipmentMods'; // Import availableMods
import { EquipmentList } from '@/components/EquipmentList';
import { BandManagement } from '@/components/BandManagement';
import { ChartsPanel } from '@/components/ChartsPanel';
import { StudioProgressionPanel } from '@/components/StudioProgressionPanel'; // Add Studio Progression Panel
import { toast } from '@/hooks/use-toast'; // Import toast
import { ProgressionSystem } from '@/services/ProgressionSystem';
import { getOperationalStudioRooms, getOccupiedRoomIds } from '@/utils/studioRoomUtils';
import { calculateStaffProjectFit } from '@/utils/staffFitUtils';

export interface RightPanelProps {
  requestedTab?: 'studio' | 'skills' | 'bands' | 'charts' | 'staff';
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
  const [activeTab, setActiveTab] = useState<'studio' | 'skills' | 'bands' | 'charts' | 'staff'>(requestedTab ?? 'studio');
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
      if (tab && ['studio', 'skills', 'bands', 'charts', 'staff'].includes(tab)) {
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
    const room = gameState.studioRooms.find(candidate => candidate.id === roomId);
    if (!room || room.unlocked) return;

    if (gameState.playerData.level < room.requiredPlayerLevel) {
      toast({
        title: "🔒 Room Not Available Yet",
        description: `Reach level ${room.requiredPlayerLevel} to consider this expansion.`,
        variant: "destructive"
      });
      return;
    }

    if (unlockedRooms.length >= roomExpansionLimit) {
      toast({
        title: "🏢 Expansion Milestone Required",
        description: "Grow your staff and studio track record before adding another production suite.",
        variant: "destructive"
      });
      return;
    }

    if (gameState.money < room.purchaseCost) {
      toast({
        title: "💰 Insufficient Funds",
        description: `You need $${room.purchaseCost.toLocaleString()} for ${room.name}.`,
        variant: "destructive"
      });
      return;
    }

    setGameState(prev => ({
      ...prev,
      money: prev.money - room.purchaseCost,
      studioRooms: prev.studioRooms.map(candidate =>
        candidate.id === room.id
          ? { ...candidate, unlocked: true }
          : candidate
      )
    }));

    toast({
      title: "🏢 Studio Expanded",
      description: `${room.name} is now operational. You have another physical booking lane.`
    });
  };
  const applyModToEquipment = (equipmentId: string, modId: string | null) => {
    setGameState(prev => ({
      ...prev,
      ownedEquipment: prev.ownedEquipment.map(eq => 
        eq.id === equipmentId 
          ? { ...eq, appliedModId: modId }
          : eq
      )
    }));
  };

  return (
    <Card className="bg-slate-900/95 border-slate-700/80 p-3 h-full min-h-0 flex flex-col overflow-hidden backdrop-blur-md animate-slide-in-right">
      {/* Tab Navigation (Pinned) */}
      <div className="flex shrink-0 mb-2.5 bg-slate-950/80 border border-slate-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('studio')}
          className={`flex-1 py-1.5 px-1.5 rounded-md text-xs font-semibold transition-colors ${
            activeTab === 'studio'
              ? 'bg-blue-600 text-white shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🏢 Studio
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`flex-1 py-1.5 px-1.5 rounded-md text-xs font-semibold transition-colors ${
            activeTab === 'skills'
              ? 'bg-blue-600 text-white shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📊 Skills
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex-1 py-1.5 px-1.5 rounded-md text-xs font-semibold transition-colors ${
            activeTab === 'staff'
              ? 'bg-blue-600 text-white shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          👥 Staff
        </button>
        <button
          onClick={() => setActiveTab('bands')}
          className={`flex-1 py-1.5 px-1.5 rounded-md text-xs font-semibold transition-colors ${
            activeTab === 'bands'
              ? 'bg-blue-600 text-white shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🎸 Bands
        </button>
        <button
          onClick={() => setActiveTab('charts')}
          className={`flex-1 py-1.5 px-1.5 rounded-md text-xs font-semibold transition-colors ${
            activeTab === 'charts'
              ? 'bg-blue-600 text-white shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📈 Charts
        </button>
      </div>

      {/* Tab Content (Scrollable Container) */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {activeTab === 'studio' && (
          <div className="space-y-3">
            {/* Prominent Advance Day Action Banner */}
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-gradient-to-r from-purple-950/80 via-indigo-950/70 to-slate-900 border border-purple-500/50 shadow-md">
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="text-amber-300">☀ Day {gameState.currentDay}</span>
                  <span className="text-[10px] text-purple-300 font-medium">({gameState.currentYear})</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Advances calendar & restores producer sessions
                </div>
              </div>
              <Button 
                onClick={advanceDay} 
                size="sm" 
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 text-xs shrink-0 shadow-lg shadow-purple-950/50"
              >
                Advance Day ❯
              </Button>
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
                  const canAfford = gameState.money >= room.purchaseCost;

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
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={levelLocked || expansionLocked || !canAfford}
                            onClick={() => purchaseStudioRoom(room.id)}
                            className="h-6 text-[10px] px-2 border-gray-600"
                          >
                            {levelLocked
                              ? `Lvl ${room.requiredPlayerLevel}`
                              : expansionLocked
                                ? 'Milestone'
                                : `Buy $${room.purchaseCost.toLocaleString()}`}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Equipment Shop Section */}
            <div className="rounded-lg border border-gray-700 bg-gray-950/50 p-2.5 max-h-72 overflow-y-auto pr-1">
              <EquipmentList purchaseEquipment={purchaseEquipment} gameState={gameState} />
            </div>

            {/* Owned Equipment Section */}
            <div className="rounded-lg border border-gray-700 bg-gray-950/50 p-2.5">
              <h3 className="text-xs font-bold text-white mb-2">🛠️ My Gear ({gameState.ownedEquipment.length})</h3>
              {gameState.ownedEquipment.length === 0 ? (
                <p className="text-[11px] text-gray-400">No equipment owned yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
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
                          {gameState.researchedMods && gameState.researchedMods.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[10px] border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white px-2 py-0.5 h-6 bg-gray-800/50 shrink-0"
                              onClick={() => {
                                setSelectedEquipmentForModding(equip);
                                setShowEquipmentModModal(true);
                              }}
                            >
                              Mods
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      {activeTab === 'skills' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Player Progression</h2>
          <div className="text-gray-300">Level: {gameState.playerData.level}</div>
          <div className="text-gray-300">XP: {gameState.playerData.xp} / {gameState.playerData.xpToNextLevel}</div>
          <div className="text-green-400">Perk Points: {gameState.playerData.perkPoints}</div>

          <Button onClick={() => setShowAttributesModal(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Upgrade Attributes
          </Button>
          <Button onClick={() => setShowSkillsModal(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            View Studio Skills
          </Button>

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

          <Button 
            onClick={refreshCandidates} 
            className="w-full bg-green-600 hover:bg-green-700 text-white mb-4"
          >
            🔄 Refresh Candidates
          </Button>

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
                  <Button 
                    onClick={() => hireStaff(index)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-1"
                    disabled={gameState.money < candidate.salary * 3}
                  >
                    {gameState.money >= candidate.salary * 3 ? `Hire for $${candidate.salary * 3}` : 'Insufficient Funds'}
                  </Button>
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
                      <Button 
                        onClick={() => assignStaffToProject(staff.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1"
                      >
                        Assign to Project
                      </Button>
                    )}
                    {staff.status === 'Working' && (
                      <Button 
                        onClick={() => unassignStaffFromProject(staff.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1"
                      >
                        Unassign
                      </Button>
                    )}
                    <Button 
                      onClick={() => toggleStaffRest(staff.id)}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs py-1"
                    >
                      {staff.status === 'Resting' ? 'End Rest' : 'Rest'}
                    </Button>
                    {staff.status === 'Idle' && (
                      <Button 
                        onClick={() => openTrainingModal(staff)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs py-1"
                      >
                        Train
                      </Button>
                    )}
                    {staff.role === 'Engineer' && staff.status === 'Idle' && (
                      <Button
                        onClick={() => {
                          // setSelectedEngineerForResearch(staff); // ResearchModal will handle staff selection internally
                          setShowResearchModal(true);
                        }}
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs py-1"
                      >
                        Research Mod
                      </Button>
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
    </Card>
  );
};

export default RightPanel;
