import { money } from '@/utils/displayMoney';
import React, { useMemo, useState } from 'react';
import { Briefcase, MapPin, Sparkles, Users, FileText, RefreshCw, Battery } from 'lucide-react';
import type { GameState, StaffMember } from '@/types/game';
import { KenneyButton } from '@/components/ui/KenneyButton';
import { calculateStaffProjectFit } from '@/utils/staffFitUtils';
import { getEnergyColor, getStaffStatusColor } from '@/utils/staffUtils';
import { StaffPortrait } from '@/components/crew/StaffPortrait';
import { getHiringLimits, hiringBlockMessage, type HiringLimits } from '@/rpg/hiringLimits';
import { gameAudio } from '@/utils/audioSystem';
import { DISCIPLINE_LABEL, getPromotionOffer, getStaffCareer, experienceIn } from '@/rpg/staffCareer';

interface CrewRecruitmentPortalProps {
  gameState: GameState;
  hireStaff: (candidateIndex: number) => boolean;
  refreshCandidates: () => void;
  assignStaffToProject: (staffId: string) => void;
  unassignStaffFromProject: (staffId: string) => void;
  toggleStaffRest: (staffId: string) => void;
  openTrainingModal: (staff: StaffMember) => boolean;
  /** Deliberate promotion (#67). Applies exactly the previewed salary. */
  promoteStaff?: (staffId: string) => void;
}

type PortalView = 'board' | 'roster';

const signingFeeFor = (candidate: StaffMember) => candidate.salary * 3;

export const CrewRecruitmentPortal: React.FC<CrewRecruitmentPortalProps> = ({
  gameState,
  hireStaff,
  refreshCandidates,
  assignStaffToProject,
  unassignStaffFromProject,
  toggleStaffRest,
  openTrainingModal,
  promoteStaff,
}) => {
  const [view, setView] = useState<PortalView>('board');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const eraId = gameState.selectedEra || gameState.currentEra;
  const year = gameState.currentYear;
  const limits = useMemo(
    () => getHiringLimits(gameState),
    [gameState.hiredStaff, gameState.reputation, gameState.premisesTier],
  );
  const blockMessage = hiringBlockMessage(limits);

  const selected = useMemo(() => {
    const pool = view === 'board' ? gameState.availableCandidates : gameState.hiredStaff;
    return pool.find(member => member.id === selectedId) ?? pool[0] ?? null;
  }, [view, gameState.availableCandidates, gameState.hiredStaff, selectedId]);

  const openProfile = (member: StaffMember) => {
    setSelectedId(member.id);
    void gameAudio.playTactileClick().catch(() => {});
  };

  return (
    <div className="crew-portal space-y-4">
      <header className="crew-portal__header">
        <div>
          <p className="rst-kicker">Studio Talent Exchange</p>
          <h2 className="text-xl font-bold text-white tracking-tight">Crew Board</h2>
          <p className="text-sm text-stone-400 mt-1">
            Era-aware listings · {limits.premisesName} · {limits.hired}/{limits.effectiveCap} seats
            {limits.canHire ? ` · ${limits.remaining} open` : ''}
          </p>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Cap is the tighter of space ({limits.spaceCap}) and reputation ({limits.reputationCap})
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            className={`crew-portal__tab ${view === 'board' ? 'is-active' : ''}`}
            onClick={() => { setView('board'); setSelectedId(null); }}
          >
            <Briefcase size={14} /> Open roles
          </button>
          <button
            type="button"
            className={`crew-portal__tab ${view === 'roster' ? 'is-active' : ''}`}
            onClick={() => { setView('roster'); setSelectedId(null); }}
          >
            <Users size={14} /> Your crew
          </button>
        </div>
      </header>

      {view === 'board' && !limits.canHire && (
        <div className="crew-portal__banner" role="status">
          {blockMessage}
        </div>
      )}

      {view === 'board' && (
        <KenneyButton
          onClick={() => { void gameAudio.playGearSwitch(0.25); refreshCandidates(); }}
          variant={gameState.money >= 50 ? 'green' : 'grey'}
          size="md"
          className="w-full"
          disabled={gameState.money < 50}
        >
          <RefreshCw size={14} className="inline mr-2" />
          {gameState.money >= 50 ? 'Post a fresh search · $50' : 'Need $50 to refresh listings'}
        </KenneyButton>
      )}

      <div className="crew-portal__layout">
        <section className="crew-portal__list" aria-label={view === 'board' ? 'Open candidates' : 'Hired crew'}>
          {view === 'board' ? (
            gameState.availableCandidates.length === 0 ? (
              <div className="crew-portal__empty">
                <Users className="mx-auto mb-2 opacity-40" />
                No applicants on the board. Refresh the search to pull era-matched talent.
              </div>
            ) : (
              gameState.availableCandidates.map((candidate, index) => {
                const fee = signingFeeFor(candidate);
                const active = selected?.id === candidate.id;
                return (
                  <button
                    key={candidate.id || index}
                    type="button"
                    className={`crew-card ${active ? 'is-active' : ''}`}
                    onClick={() => openProfile(candidate)}
                  >
                    <StaffPortrait member={candidate} eraId={eraId} year={year} scale={1.75} />
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">{candidate.name}</div>
                          <div className="text-amber-200/90 text-xs">{candidate.role} · Lv {candidate.levelInRole}</div>
                        </div>
                        <div className="text-emerald-400 text-xs font-bold whitespace-nowrap">{money(candidate.salary)}/day</div>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1 line-clamp-2">
                        {candidate.cv?.headline ?? 'Studio professional seeking a room that listens.'}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-stone-500">
                        <FileText size={11} /> View CV
                        <span className="ml-auto text-stone-400">Sign ${fee}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )
          ) : (
            gameState.hiredStaff.length === 0 ? (
              <div className="crew-portal__empty">
                Your roster is empty. Hire from the open board to fill the room.
              </div>
            ) : (
              gameState.hiredStaff.map(staff => {
                const active = selected?.id === staff.id;
                return (
                  <button
                    key={staff.id}
                    type="button"
                    className={`crew-card ${active ? 'is-active' : ''}`}
                    onClick={() => openProfile(staff)}
                  >
                    <StaffPortrait member={staff} eraId={eraId} year={year} scale={1.75} />
                    <div className="min-w-0 flex-1 text-left">
                      <div className="text-white font-semibold truncate">{staff.name}</div>
                      <div className="text-amber-200/90 text-xs">{staff.role}</div>
                      <div className={`text-[11px] mt-1 ${getStaffStatusColor(staff.status)}`}>{staff.status}</div>
                    </div>
                  </button>
                );
              })
            )
          )}
        </section>

        <aside className="crew-portal__cv" aria-live="polite">
          {!selected ? (
            <div className="crew-portal__empty">Select a candidate to open their CV.</div>
          ) : (
            <CrewCvPanel
              member={selected}
              gameState={gameState}
              eraId={eraId}
              year={year}
              isCandidate={view === 'board'}
              candidateIndex={view === 'board' ? gameState.availableCandidates.findIndex(c => c.id === selected.id) : -1}
              limits={limits}
              onHire={hireStaff}
              onAssign={assignStaffToProject}
              onUnassign={unassignStaffFromProject}
              onToggleRest={toggleStaffRest}
              onTrain={openTrainingModal}
              onPromote={promoteStaff}
            />
          )}
        </aside>
      </div>
    </div>
  );
};

const CrewCvPanel: React.FC<{
  member: StaffMember;
  gameState: GameState;
  eraId?: string;
  year?: number;
  isCandidate: boolean;
  candidateIndex: number;
  limits: HiringLimits;
  onHire: (index: number) => boolean;
  onAssign: (id: string) => void;
  onUnassign: (id: string) => void;
  onToggleRest: (id: string) => void;
  onTrain: (staff: StaffMember) => boolean;
  onPromote?: (id: string) => void;
}> = ({
  member,
  gameState,
  eraId,
  year,
  isCandidate,
  candidateIndex,
  limits,
  onHire,
  onAssign,
  onUnassign,
  onToggleRest,
  onTrain,
  onPromote,
}) => {
  const fee = signingFeeFor(member);
  const cv = member.cv;
  const fit = gameState.activeProject ? calculateStaffProjectFit(member, gameState.activeProject) : null;
  const canAfford = gameState.money >= fee;
  const canHire = limits.canHire && canAfford && candidateIndex >= 0;
  const hireLabel = !limits.canHire
    ? hiringBlockMessage(limits)
    : !canAfford
      ? `Need ${money(fee)} to hire`
      : `Hire · signing fee ${money(fee)}`;

  return (
    <div className="crew-cv">
      <div className="crew-cv__hero">
        <StaffPortrait member={member} eraId={eraId} year={year} scale={2.4} />
        <div className="min-w-0">
          <p className="rst-kicker">Profile</p>
          <h3 className="text-lg font-bold text-white leading-tight">{member.name}</h3>
          <p className="text-amber-200 text-sm">{member.role} · {cv?.yearsExperience ?? member.levelInRole} yrs</p>
          <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
            <MapPin size={11} /> {eraId?.replace(/_/g, ' ') || 'studio circuit'}
          </p>
        </div>
      </div>

      <p className="text-sm text-stone-200 font-medium">{cv?.headline}</p>
      <p className="text-xs text-stone-400 leading-relaxed">{cv?.summary}</p>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Creativity" value={member.primaryStats.creativity} tone="text-amber-300" />
        <Stat label="Technical" value={member.primaryStats.technical} tone="text-emerald-400" />
        <Stat label="Speed" value={member.primaryStats.speed} tone="text-yellow-300" />
      </div>

      {member.genreAffinity && (
        <div className="crew-cv__chip">
          <Sparkles size={12} />
          {member.genreAffinity.genre} specialist · +{member.genreAffinity.bonus}%
        </div>
      )}

      {fit && (
        <div className="text-[11px] text-amber-200/90">
          Current session fit {fit.score}/100 · {fit.reasons.slice(0, 2).join(' · ')}
        </div>
      )}

      {!isCandidate && <CareerBlock member={member} money={gameState.money} onPromote={onPromote} />}

      {cv && (
        <>
          <CvBlock title="Traits" items={cv.traits} />
          <CvBlock title="Previous rooms" items={cv.previousStudios} />
          <CvBlock title="Notable credits" items={cv.notableCredits} />
          <div className="crew-cv__block">
            <h4>Background</h4>
            <p>{cv.education}</p>
            <p className="mt-1 text-stone-500">Looking for: {cv.lookingFor}</p>
          </div>
        </>
      )}

      <div className="crew-cv__actions">
        {isCandidate ? (
          <>
            <p className="text-[11px] text-stone-500 mb-2">
              {limits.canHire
                ? `${limits.remaining} seat${limits.remaining === 1 ? '' : 's'} left (${limits.hired}/${limits.effectiveCap})`
                : hiringBlockMessage(limits)}
            </p>
            <KenneyButton
              onClick={() => { void gameAudio.playGearSwitch(0.35); onHire(candidateIndex); }}
              variant={canHire ? 'green' : 'grey'}
              size="md"
              className="w-full"
              disabled={!canHire}
            >
              {hireLabel}
            </KenneyButton>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-xs text-stone-400 mb-2">
              <Battery className={`w-3.5 h-3.5 ${getEnergyColor(member.energy)}`} />
              <span className={getEnergyColor(member.energy)}>{member.energy}% energy</span>
              <span className="ml-auto">{money(member.salary)}/day</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {member.status === 'Idle' && gameState.activeProject && (
                <KenneyButton onClick={() => onAssign(member.id)} variant="blue" size="sm" className="flex-1">Assign</KenneyButton>
              )}
              {member.status === 'Working' && (
                <KenneyButton onClick={() => onUnassign(member.id)} variant="red" size="sm" className="flex-1">Unassign</KenneyButton>
              )}
              <KenneyButton onClick={() => onToggleRest(member.id)} variant="yellow" size="sm" className="flex-1">
                {member.status === 'Resting' ? 'Wake' : 'Rest'}
              </KenneyButton>
              {member.status === 'Idle' && (
                <KenneyButton onClick={() => onTrain(member)} variant="blue" size="sm" className="flex-1">Train</KenneyButton>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number; tone: string }> = ({ label, value, tone }) => (
  <div className="rounded-lg bg-black/25 border border-white/10 px-2 py-2 text-center">
    <div className={`text-sm font-bold ${tone}`}>{value}</div>
    <div className="text-[10px] text-stone-500 uppercase tracking-wide">{label}</div>
  </div>
);

const CvBlock: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div className="crew-cv__block">
    <h4>{title}</h4>
    <ul>
      {items.map(item => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </div>
);

const SENIORITY_LABEL = { junior: 'Junior', regular: 'Regular', senior: 'Senior', lead: 'Lead' } as const;

/** Career summary and the deliberate promotion preview (#67): requirements and the exact salary change. */
const CareerBlock: React.FC<{ member: StaffMember; money: number; onPromote?: (id: string) => void }> = ({ member, onPromote }) => {
  const career = getStaffCareer(member);
  const offer = getPromotionOffer(member);
  const active = experienceIn(career, career.activeDiscipline);
  return (
    <div className="crew-cv__block" data-testid="staff-career">
      <h4>Career</h4>
      <p>
        {SENIORITY_LABEL[career.seniority]} {DISCIPLINE_LABEL[career.activeDiscipline].toLowerCase()} · level {active.level} · {active.creditedSessions} credited session{active.creditedSessions === 1 ? '' : 's'}
      </p>
      {offer && (
        <div className="mt-1.5 space-y-1">
          <p className="text-amber-200">Promotion: {offer.title}</p>
          <ul className="text-[11px]">
            {offer.requirements.map(r => (
              <li key={r.label} className={r.met ? 'text-emerald-300' : 'text-stone-500'}>{r.met ? '✓' : '○'} {r.label}</li>
            ))}
          </ul>
          <p className="text-[11px] text-stone-300">Salary ${offer.salaryBefore}/day → ${offer.salaryAfter}/day</p>
          {onPromote && (
            <KenneyButton
              onClick={() => { void gameAudio.playGearSwitch(0.35); onPromote(member.id); }}
              variant={offer.eligible ? 'green' : 'grey'}
              size="sm"
              className="w-full"
              disabled={!offer.eligible}
            >
              {offer.eligible ? `Promote to ${offer.title}` : 'Requirements not met'}
            </KenneyButton>
          )}
        </div>
      )}
    </div>
  );
};
