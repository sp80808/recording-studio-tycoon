
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GameState, StaffMember } from '@/types/game';
import { Band } from '@/types/bands';
import MoodIndicator from './MoodIndicator'; // Import MoodIndicator
import { CreateBandModal } from './modals/CreateBandModal';
import { RecordTrackModal } from './modals/RecordTrackModal';
import { canGoOnTour } from '@/utils/bandUtils';
import { ShowPlan, VENUES, MARKETING_OPTIONS, MarketingTier, SoundcheckTier, SOUNDCHECK_OPTIONS, venueDisplayName, canPlayShow, suggestedTicketPrice, totalCost, getVenue } from '@/simulation/liveShows';
import { toast } from '@/hooks/use-toast';

interface BandManagementProps {
  gameState: GameState;
  onCreateBand: (bandName: string, memberIds: string[]) => void;
  onStartTour: (bandId: string) => void;
  onPlayShow?: (bandId: string, plan: ShowPlan) => void;
  onCreateOriginalTrack: (bandId: string) => void;
}

export const BandManagement: React.FC<BandManagementProps> = ({
  gameState,
  onCreateBand,
  onStartTour,
  onPlayShow,
  onCreateOriginalTrack
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRecordTrackModal, setShowRecordTrackModal] = useState(false);
  const [selectedBandForTrack, setSelectedBandForTrack] = useState<Band | null>(null);

  const [showPlanBandId, setShowPlanBandId] = useState<string | null>(null);
  const [venueId, setVenueId] = useState(VENUES[0].id);
  const [marketing, setMarketing] = useState<MarketingTier>('flyers');
  const [soundcheck, setSoundcheck] = useState<SoundcheckTier>('quick');
  const [ticketPrice, setTicketPrice] = useState(suggestedTicketPrice(VENUES[0]));

  const canCreateBand = gameState.playerData.level >= 4 && gameState.hiredStaff.length >= 1;

  const getBandMembers = (band: Band) => {
    return gameState.hiredStaff.filter(staff => band.memberIds.includes(staff.id));
  };

  const getReviewEmoji = (score: number) => {
    if (score >= 8) return '😍';
    if (score >= 6) return '😊';
    if (score >= 4) return '😐';
    return '😞';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">🎸 Band Management</h2>
        {canCreateBand && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-400/[0.14] ring-1 ring-inset ring-purple-400/45 hover:bg-purple-400/[0.24]"
          >
            Create Band
          </Button>
        )}
      </div>

      {!canCreateBand && (
        <Card className="p-4 bg-stone-800/50 border-stone-600">
          <div className="text-center text-stone-400">
            <div className="text-4xl mb-2">🔒</div>
            <h3 className="font-semibold mb-1">Band Management Locked</h3>
            <p className="text-sm">
              Reach Level 4 and hire at least 1 staff member to unlock band creation.
            </p>
            <div className="mt-2 text-xs">
              Current: Level {gameState.playerData.level}, {gameState.hiredStaff.length} staff
            </div>
          </div>
        </Card>
      )}

      {gameState.playerBands.length === 0 && canCreateBand && (
        <Card className="p-4 bg-stone-800/50 border-stone-600">
          <div className="text-center text-stone-400">
            <div className="text-4xl mb-2">🎤</div>
            <h3 className="font-semibold mb-1">No Bands Created</h3>
            <p className="text-sm">Create your first band to start making original music!</p>
          </div>
        </Card>
      )}

      {gameState.playerBands.map(band => {
        const members = getBandMembers(band);
        const canTour = canGoOnTour(band);
        
        return (
          <Card key={band.id} className="p-4 bg-stone-800/50 border-stone-600">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{band.bandName}</h3>
                <p className="text-stone-300 text-sm">{band.genre}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-yellow-400">⭐ {band.fame}</span>
                  <span className="text-red-400">💀 {band.notoriety}</span>
                </div>
              </div>
            </div>

            {/* Tour Status */}
            {band.tourStatus.isOnTour && (
              <div className="mb-3 p-2 bg-stone-900/50 border border-amber-500 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-amber-200">🚌 On Tour</span>
                  <span className="text-amber-200">{band.tourStatus.daysRemaining} days left</span>
                </div>
                <div className="text-xs text-amber-300">
                  Earning ${band.tourStatus.dailyIncome} per day
                </div>
              </div>
            )}

            {/* Band Members */}
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-stone-300 mb-1">Members:</h4>
              <div className="flex flex-wrap gap-2">
                {members.map(member => (
                  <span
                    key={member.id}
                    className="text-xs bg-stone-700 px-2 py-1 rounded flex items-center"
                  >
                    {member.name} ({member.role})
                    <MoodIndicator mood={member.mood} />
                  </span>
                ))}
              </div>
            </div>

            {/* Past Releases */}
            {band.pastReleases.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-stone-300 mb-1">Past Releases:</h4>
                <div className="space-y-1">
                  {band.pastReleases.slice(-3).map(release => (
                    <div key={release.id} className="flex justify-between items-center text-xs">
                      <span className="text-stone-300">{release.trackTitle}</span>
                      <div className="flex items-center gap-2">
                        <span>{getReviewEmoji(release.reviewScore)}</span>
                        <span className="text-stone-400">{release.reviewScore}/10</span>
                        <span className="text-green-400">${release.totalSales}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setSelectedBandForTrack(band);
                  setShowRecordTrackModal(true);
                }}
                disabled={gameState.activeProject !== null || gameState.activeOriginalTrack !== null || band.tourStatus.isOnTour}
                className="flex-1 bg-emerald-400/[0.14] ring-1 ring-inset ring-emerald-400/45 hover:bg-emerald-400/[0.24]"
              >
                🎵 Record Track
              </Button>
              {canTour && (
                <Button
                  size="sm"
                  onClick={() => onStartTour(band.id)}
                  disabled={band.tourStatus.isOnTour}
                  className="bg-amber-400/[0.14] ring-1 ring-inset ring-amber-400/45 hover:bg-amber-400/[0.24]"
                >
                  🚌 Tour
                </Button>
              )}
              {onPlayShow && (
                <Button
                  size="sm"
                  onClick={() => setShowPlanBandId(showPlanBandId === band.id ? null : band.id)}
                  disabled={band.tourStatus.isOnTour}
                  className="bg-sky-400/[0.14] ring-1 ring-inset ring-sky-400/45 hover:bg-sky-400/[0.24]"
                >
                  🎤 Show
                </Button>
              )}
            </div>

            {onPlayShow && showPlanBandId === band.id && (() => {
              const plan: ShowPlan = { venueId, marketing, ticketPrice, soundcheck };
              const check = canPlayShow(
                { fame: band.fame, isOnTour: band.tourStatus.isOnTour, lastShowDay: band.lastShowDay },
                gameState.reputation, plan, gameState.money, gameState.currentDay
              );
              return (
                <div className="mt-3 space-y-2 rounded border border-stone-600 p-2 text-xs text-stone-300" data-testid="live-show-planner">
                  <div className="flex gap-2">
                    <label className="flex-1">Venue
                      <select
                        className="mt-1 w-full rounded bg-stone-800 p-1"
                        value={venueId}
                        onChange={e => {
                          setVenueId(e.target.value);
                          const v = getVenue(e.target.value);
                          if (v) setTicketPrice(suggestedTicketPrice(v));
                        }}
                      >
                        {VENUES.map(v => (
                          <option key={v.id} value={v.id}>
                            {venueDisplayName(v, gameState.currentEra)} ({v.capacity}) — fame {v.minFame}+, rep {v.minReputation}+
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex-1">Marketing
                      <select
                        className="mt-1 w-full rounded bg-stone-800 p-1"
                        value={marketing}
                        onChange={e => setMarketing(e.target.value as MarketingTier)}
                      >
                        {MARKETING_OPTIONS.map(m => (
                          <option key={m.id} value={m.id}>{m.label} (${m.cost})</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex-1">Soundcheck
                      <select
                        className="mt-1 w-full rounded bg-stone-800 p-1"
                        value={soundcheck}
                        onChange={e => setSoundcheck(e.target.value as SoundcheckTier)}
                      >
                        {SOUNDCHECK_OPTIONS.map(o => (
                          <option key={o.id} value={o.id}>{o.label} (${o.cost}, {Math.round(o.mishapChance * 100)}% mishap)</option>
                        ))}
                      </select>
                    </label>
                    <label className="w-20">Ticket $
                      <input
                        type="number"
                        min={1}
                        className="mt-1 w-full rounded bg-stone-800 p-1"
                        value={ticketPrice}
                        onChange={e => setTicketPrice(Math.max(1, Number(e.target.value) || 1))}
                      />
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Up-front cost ${totalCost(plan)}{!check.ok && <span className="ml-2 text-red-300">{check.reason}</span>}</span>
                    <Button
                      size="sm"
                      disabled={!check.ok}
                      onClick={() => { onPlayShow(band.id, plan); setShowPlanBandId(null); }}
                    >
                      Play the night
                    </Button>
                  </div>
                </div>
              );
            })()}
          </Card>
        );
      })}

      <CreateBandModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        gameState={gameState}
        onCreateBand={onCreateBand}
      />

      {selectedBandForTrack && (
        <RecordTrackModal
          isOpen={showRecordTrackModal}
          onClose={() => {
            setShowRecordTrackModal(false);
            setSelectedBandForTrack(null);
          }}
          band={selectedBandForTrack}
          onCreateOriginalTrack={onCreateOriginalTrack}
        />
      )}
    </div>
  );
};
