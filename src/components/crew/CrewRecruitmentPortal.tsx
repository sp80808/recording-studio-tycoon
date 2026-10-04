import { money } from '@/utils/displayMoney';
import { tc } from '@/i18n/content';
import React, { useMemo, useState } from 'react';
import { Briefcase, MapPin, Sparkles, Users, FileText, Battery } from 'lucide-react';
import type { GameState, StaffMember } from '@/types/game';
import { KenneyButton } from '@/components/ui/KenneyButton';
import { calculateStaffProjectFit } from '@/utils/staffFitUtils';
import { getEnergyColor, getStaffStatusColor } from '@/utils/staffUtils';
import { StaffPortrait } from '@/components/crew/StaffPortrait';
import { getHiringLimits, hiringBlockMessage, type HiringLimits } from '@/rpg/hiringLimits';
import { RECRUITMENT_CHANNELS, CHANNEL_ORDER, searchBlocker, getRecruitmentSearch, channelCandidateCount, type RecruitmentChannelId } from '@/rpg/recruitment';
import { gameAudio } from '@/utils/audioSystem';
import { DISCIPLINE_LABEL, getPromotionOffer, getStaffCareer, experienceIn, crossTrainOptions, canMentor, type StaffDiscipline } from '@/rpg/staffCareer';

interface CrewRecruitmentPortalProps {
  gameState: GameState;
  hireStaff: (candidateIndex: number) => boolean;
  refreshCandidates: (channelId?: import('@/rpg/recruitment').RecruitmentChannelId) => void;
  assignStaffToProject: (staffId: string) => void;
  unassignStaffFromProject: (staffId: string) => void;
  toggleStaffRest: (staffId: string) => void;
  openTrainingModal: (staff: StaffMember) => boolean;
  /** Deliberate promotion (#67). Applies exactly the previewed salary. */
  promoteStaff?: (staffId: string) => void;
  crossTrainStaff?: (staffId: string, discipline: StaffDiscipline) => void;
  setMentor?: (juniorId: string, mentorId: string | null) => void;
}

type PortalView = 'board' | 'roster';

const P = 'crew.CrewRecruitmentPortal.';
const disciplineLabel = (d: StaffDiscipline) => tc(`${P}discipline_${d}`, DISCIPLINE_LABEL[d]);
const seniorityLabel = (k: keyof typeof SENIORITY_LABEL) => tc(`${P}seniority_${k}`, SENIORITY_LABEL[k]);
const statusLabel = (st: string) => tc(`${P}status_${st.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`, st);

const WHY_IDS: Record<string, string> = {
  'Trainee placement: low pay, fast early growth': 'why_trainee_placement',
  'Recommended by a friend of the studio': 'why_friend_of_studio',
  'Specialist engineer from the industry network: strong in one area, narrower elsewhere': 'why_specialist_engineer',
  'Headhunted senior: proven, expensive, and expects a good room': 'why_headhunted_senior',
  'Answered your job-board listing': 'why_job_board_listing',
};
const sourceWhy = (why: string) => {
  const m = /^Recommended by your crew \((.+) work\)$/.exec(why);
  if (m) return tc(`${P}why_crew_recommended`, 'Recommended by your crew ({{role}} work)', { role: m[1] });
  const id = WHY_IDS[why];
  return id ? tc(`${P}${id}`, why) : why;
};

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
  crossTrainStaff,
  setMentor,
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
          <p className="rst-kicker">{tc(`${P}kicker_studio_talent_exchange`, 'Studio Talent Exchange')}</p>
          <h2 className="text-xl font-bold text-white tracking-tight">{tc(`${P}heading_crew_board`, 'Crew Board')}</h2>
          <p className="text-sm text-stone-400 mt-1">
            {tc(`${P}era_listings`, 'Era-aware listings · {{premises}} · {{hired}}/{{cap}} seats', { premises: limits.premisesName, hired: limits.hired, cap: limits.effectiveCap })}
            {limits.canHire ? tc(`${P}seats_open_suffix`, ' · {{remaining}} open', { remaining: limits.remaining }) : ''}
          </p>
          <p className="text-[11px] text-stone-500 mt-0.5">
            {tc(`${P}cap_explainer`, 'Cap is the tighter of space ({{space}}) and reputation ({{reputation}})', { space: limits.spaceCap, reputation: limits.reputationCap })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            className={`crew-portal__tab ${view === 'board' ? 'is-active' : ''}`}
            onClick={() => { setView('board'); setSelectedId(null); }}
          >
            <Briefcase size={14} /> {tc(`${P}tab_open_roles`, 'Open roles')}
          </button>
          <button
            type="button"
            className={`crew-portal__tab ${view === 'roster' ? 'is-active' : ''}`}
            onClick={() => { setView('roster'); setSelectedId(null); }}
          >
            <Users size={14} /> {tc(`${P}tab_your_crew`, 'Your crew')}
          </button>
        </div>
      </header>

      {view === 'board' && !limits.canHire && (
        <div className="crew-portal__banner" role="status">
          {blockMessage}
        </div>
      )}

      {view === 'board' && <SearchChannels gameState={gameState} onSearch={refreshCandidates} />}

      <div className="crew-portal__layout">
        <section className="crew-portal__list" aria-label={view === 'board' ? tc(`${P}aria_open_candidates`, 'Open candidates') : tc(`${P}aria_hired_crew`, 'Hired crew')}>
          {view === 'board' ? (
            gameState.availableCandidates.length === 0 ? (
              <div className="crew-portal__empty">
                <Users className="mx-auto mb-2 opacity-40" />
                {tc(`${P}empty_board`, 'No applicants on the board. Choose a search above to bring in talent.')}
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
                          <div className="text-amber-200/90 text-xs">{candidate.role} · {tc(`${P}level_short`, 'Lv {{level}}', { level: candidate.levelInRole })}</div>
                        </div>
                        <div className="text-emerald-400 text-xs font-bold whitespace-nowrap">{money(candidate.salary)}{tc(`${P}per_day`, '/day')}</div>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1 line-clamp-2">
                        {candidate.cv?.headline ?? tc(`${P}default_headline`, 'Studio professional seeking a room that listens.')}
                      </p>
                      {candidate.career && (
                        <p className="text-[10px] text-amber-200/80 mt-1" data-testid="candidate-career">
                          {seniorityLabel(candidate.career.seniority)} {disciplineLabel(candidate.career.activeDiscipline).toLowerCase()}
                        </p>
                      )}
                      {candidate.source && (
                        <p className="text-[10px] text-sky-300 mt-1" data-testid="candidate-source">
                          {candidate.apprentice ? tc(`${P}apprentice_prefix`, 'Apprentice · ') : ''}{sourceWhy(candidate.source.why)}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-stone-500">
                        <FileText size={11} /> {tc(`${P}view_cv`, 'View CV')}
                        <span className="ml-auto text-stone-400">{tc(`${P}sign_fee`, 'Sign ${{fee}}', { fee })}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )
          ) : (
            gameState.hiredStaff.length === 0 ? (
              <div className="crew-portal__empty">
                {tc(`${P}empty_roster`, 'Your roster is empty. Hire from the open board to fill the room.')}
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
                      <div className={`text-[11px] mt-1 ${getStaffStatusColor(staff.status)}`}>{statusLabel(staff.status)}</div>
                    </div>
                  </button>
                );
              })
            )
          )}
        </section>

        <aside className="crew-portal__cv" aria-live="polite">
          {!selected ? (
            <div className="crew-portal__empty">{tc(`${P}select_candidate`, 'Select a candidate to open their CV.')}</div>
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
              onCrossTrain={crossTrainStaff}
              onSetMentor={setMentor}
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
  onCrossTrain?: (id: string, d: StaffDiscipline) => void;
  onSetMentor?: (juniorId: string, mentorId: string | null) => void;
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
  onCrossTrain,
  onSetMentor,
}) => {
  const fee = signingFeeFor(member);
  const cv = member.cv;
  const fit = gameState.activeProject ? calculateStaffProjectFit(member, gameState.activeProject) : null;
  const canAfford = gameState.money >= fee;
  const canHire = limits.canHire && canAfford && candidateIndex >= 0;
  const hireLabel = !limits.canHire
    ? hiringBlockMessage(limits)
    : !canAfford
      ? tc(`${P}need_to_hire`, 'Need {{amount}} to hire', { amount: money(fee) })
      : tc(`${P}hire_signing_fee`, 'Hire · signing fee {{amount}}', { amount: money(fee) });

  return (
    <div className="crew-cv">
      <div className="crew-cv__hero">
        <StaffPortrait member={member} eraId={eraId} year={year} scale={2.4} />
        <div className="min-w-0">
          <p className="rst-kicker">{tc(`${P}kicker_profile`, 'Profile')}</p>
          <h3 className="text-lg font-bold text-white leading-tight">{member.name}</h3>
          <p className="text-amber-200 text-sm">{member.role} · {tc(`${P}years_short`, '{{n}} yrs', { n: cv?.yearsExperience ?? member.levelInRole })}</p>
          <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
            <MapPin size={11} /> {eraId?.replace(/_/g, ' ') || tc(`${P}studio_circuit`, 'studio circuit')}
          </p>
        </div>
      </div>

      <p className="text-sm text-stone-200 font-medium">{cv?.headline}</p>
      <p className="text-xs text-stone-400 leading-relaxed">{cv?.summary}</p>

      <div className="grid grid-cols-3 gap-2">
        <Stat label={tc(`${P}stat_creativity`, 'Creativity')} value={member.primaryStats.creativity} tone="text-amber-300" />
        <Stat label={tc(`${P}stat_technical`, 'Technical')} value={member.primaryStats.technical} tone="text-emerald-400" />
        <Stat label={tc(`${P}stat_speed`, 'Speed')} value={member.primaryStats.speed} tone="text-yellow-300" />
      </div>

      {member.genreAffinity && (
        <div className="crew-cv__chip">
          <Sparkles size={12} />
          {tc(`${P}genre_specialist`, '{{genre}} specialist · +{{bonus}}%', { genre: member.genreAffinity.genre, bonus: member.genreAffinity.bonus })}
        </div>
      )}

      {fit && (
        <div className="text-[11px] text-amber-200/90">
          {tc(`${P}session_fit`, 'Current session fit {{score}}/100 · {{reasons}}', { score: fit.score, reasons: fit.reasons.slice(0, 2).join(' · ') })}
        </div>
      )}

      {!isCandidate && <CareerBlock member={member} cash={gameState.money} staff={gameState.hiredStaff} onPromote={onPromote} onCrossTrain={onCrossTrain} onSetMentor={onSetMentor} />}

      {cv && (
        <>
          <CvBlock title={tc(`${P}block_traits`, 'Traits')} items={cv.traits} />
          <CvBlock title={tc(`${P}block_previous_rooms`, 'Previous rooms')} items={cv.previousStudios} />
          <CvBlock title={tc(`${P}block_notable_credits`, 'Notable credits')} items={cv.notableCredits} />
          <div className="crew-cv__block">
            <h4>{tc(`${P}heading_background`, 'Background')}</h4>
            <p>{cv.education}</p>
            <p className="mt-1 text-stone-500">{tc(`${P}looking_for`, 'Looking for: {{what}}', { what: cv.lookingFor })}</p>
          </div>
        </>
      )}

      <div className="crew-cv__actions">
        {isCandidate ? (
          <>
            <p className="text-[11px] text-stone-500 mb-2">
              {limits.canHire
                ? (limits.remaining === 1
                  ? tc(`${P}seats_left_one`, '{{remaining}} seat left ({{hired}}/{{cap}})', { remaining: limits.remaining, hired: limits.hired, cap: limits.effectiveCap })
                  : tc(`${P}seats_left_other`, '{{remaining}} seats left ({{hired}}/{{cap}})', { remaining: limits.remaining, hired: limits.hired, cap: limits.effectiveCap }))
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
              <span className={getEnergyColor(member.energy)}>{tc(`${P}energy_pct`, '{{pct}}% energy', { pct: member.energy })}</span>
              <span className="ml-auto">{money(member.salary)}{tc(`${P}per_day`, '/day')}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {member.status === 'Idle' && gameState.activeProject && (
                <KenneyButton onClick={() => onAssign(member.id)} variant="blue" size="sm" className="flex-1">{tc(`${P}btn_assign`, 'Assign')}</KenneyButton>
              )}
              {member.status === 'Working' && (
                <KenneyButton onClick={() => onUnassign(member.id)} variant="red" size="sm" className="flex-1">{tc(`${P}btn_unassign`, 'Unassign')}</KenneyButton>
              )}
              <KenneyButton onClick={() => onToggleRest(member.id)} variant="yellow" size="sm" className="flex-1">
                {member.status === 'Resting' ? tc(`${P}btn_wake`, 'Wake') : tc(`${P}btn_rest`, 'Rest')}
              </KenneyButton>
              {member.status === 'Idle' && (
                <KenneyButton onClick={() => onTrain(member)} variant="blue" size="sm" className="flex-1">{tc(`${P}btn_train`, 'Train')}</KenneyButton>
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

const SearchChannels: React.FC<{ gameState: GameState; onSearch: (id: RecruitmentChannelId) => void }> = ({ gameState, onSearch }) => {
  const running = getRecruitmentSearch(gameState);
  return (
    <div className="space-y-1" data-testid="recruitment-channels" aria-label={tc(`${P}aria_choose_search`, 'Choose a search')}>
      <h4 className="text-xs font-semibold text-stone-300">{tc(`${P}heading_choose_search`, 'Choose a search')}</h4>
      {running && (
        <p className="text-[11px] text-amber-200" role="status">
          {tc(`${P}search_reports_back`, '{{name}} reports back on day {{day}}.', { name: tc(`crew.channel_${running.channelId}_name`, RECRUITMENT_CHANNELS[running.channelId].name), day: running.resolvesDay })}
        </p>
      )}
      {CHANNEL_ORDER.map(id => {
        const ch = RECRUITMENT_CHANNELS[id];
        const blocker = searchBlocker(gameState, id);
        const chName = tc(`crew.channel_${id}_name`, ch.name);
        const blockerText = !blocker ? null
          : blocker === ch.unlockHint ? tc(`crew.channel_${id}_unlock`, ch.unlockHint)
          : blocker === 'A search is already running' ? tc(`${P}search_already_running`, 'A search is already running')
          : blocker === `Need $${ch.cost}` ? tc(`${P}need_cost`, 'Need ${{cost}}', { cost: ch.cost })
          : blocker;
        return (
          <KenneyButton
            key={id}
            onClick={() => { void gameAudio.playGearSwitch(0.25); onSearch(id); }}
            variant={blocker ? 'grey' : 'green'}
            size="sm"
            className="w-full text-left"
            disabled={!!blocker}
            title={tc(`crew.channel_${id}_blurb`, ch.blurb)}
          >
            {chName} · {money(ch.cost)} · {tc(`${P}n_candidates`, '{{n}} candidates', { n: channelCandidateCount(gameState, id) })} · {ch.days === 1 ? tc(`${P}n_days_one`, '{{n}} day', { n: ch.days }) : tc(`${P}n_days_other`, '{{n}} days', { n: ch.days })}
            {blockerText ? ` — ${blockerText}` : ''}
          </KenneyButton>
        );
      })}
    </div>
  );
};

const SENIORITY_LABEL = { junior: 'Junior', regular: 'Regular', senior: 'Senior', lead: 'Lead' } as const;

/** Career summary and the deliberate promotion preview (#67): requirements and the exact salary change. */
const CareerBlock: React.FC<{
  member: StaffMember; cash: number; staff: StaffMember[];
  onPromote?: (id: string) => void;
  onCrossTrain?: (id: string, d: StaffDiscipline) => void;
  onSetMentor?: (juniorId: string, mentorId: string | null) => void;
}> = ({ member, cash, staff, onPromote, onCrossTrain, onSetMentor }) => {
  const career = getStaffCareer(member);
  const offer = getPromotionOffer(member);
  const active = experienceIn(career, career.activeDiscipline);
  return (
    <div className="crew-cv__block" data-testid="staff-career">
      <h4>{tc(`${P}heading_career`, 'Career')}</h4>
      <p>
        {seniorityLabel(career.seniority)} {disciplineLabel(career.activeDiscipline).toLowerCase()} · {tc(`${P}career_level`, 'level {{level}}', { level: active.level })} · {active.creditedSessions === 1 ? tc(`${P}credited_session_one`, '{{n}} credited session', { n: active.creditedSessions }) : tc(`${P}credited_session_other`, '{{n}} credited sessions', { n: active.creditedSessions })}
      </p>
      {offer && (
        <div className="mt-1.5 space-y-1">
          <p className="text-amber-200">{tc(`${P}promotion_label`, 'Promotion: {{title}}', { title: offer.title })}</p>
          <ul className="text-[11px]">
            {offer.requirements.map(r => (
              <li key={r.label} className={r.met ? 'text-emerald-300' : 'text-stone-500'}>{r.met ? '✓' : '○'} {r.label}</li>
            ))}
          </ul>
          <p className="text-[11px] text-stone-300">{tc(`${P}salary_change`, 'Salary ${{before}}/day → ${{after}}/day', { before: offer.salaryBefore, after: offer.salaryAfter })}</p>
          {onPromote && (
            <KenneyButton
              onClick={() => { void gameAudio.playGearSwitch(0.35); onPromote(member.id); }}
              variant={offer.eligible ? 'green' : 'grey'}
              size="sm"
              className="w-full"
              disabled={!offer.eligible}
            >
              {offer.eligible ? tc(`${P}promote_to`, 'Promote to {{title}}', { title: offer.title }) : tc(`${P}requirements_not_met`, 'Requirements not met')}
            </KenneyButton>
          )}
        </div>
      )}
      {onCrossTrain && (
        <div className="mt-2 space-y-1" data-testid="staff-cross-train">
          <p className="text-[11px] text-stone-400">
            {career.secondaryDiscipline
              ? tc(`${P}cross_train_also`, 'Cross-train (now also {{discipline}}): off the floor for days, experience is kept.', { discipline: disciplineLabel(career.secondaryDiscipline).toLowerCase() })
              : tc(`${P}cross_train`, 'Cross-train: off the floor for days, experience is kept.')}
          </p>
          <div className="flex flex-wrap gap-1">
            {crossTrainOptions(member).map(o => (
              <KenneyButton
                key={o.discipline}
                onClick={() => { void gameAudio.playGearSwitch(0.35); onCrossTrain(member.id, o.discipline); }}
                variant="grey"
                size="sm"
                disabled={member.status !== 'Idle' || cash < o.cost}
              >
                {disciplineLabel(o.discipline)} · {tc(`${P}days_short`, '{{n}}d', { n: o.days })} · {money(o.cost)}
              </KenneyButton>
            ))}
          </div>
        </div>
      )}
      {onSetMentor && <MentorRow member={member} career={career} staff={staff} onSetMentor={onSetMentor} />}
    </div>
  );
};

const MentorRow: React.FC<{ member: StaffMember; career: ReturnType<typeof getStaffCareer>; staff: StaffMember[]; onSetMentor: (j: string, m: string | null) => void }> = ({ member, career, staff, onSetMentor }) => {
  const mentor = career.mentorId ? staff.find(s => s.id === career.mentorId) : undefined;
  if (mentor) {
    return (
      <div className="mt-2 text-[11px] text-stone-300" data-testid="staff-mentor">
        {tc(`${P}mentored_by`, 'Mentored by {{name}}: +30% discipline XP while they are working (their own XP −15%).', { name: mentor.name })}{' '}
        <button className="underline" onClick={() => onSetMentor(member.id, null)}>{tc(`${P}btn_end_mentor`, 'End')}</button>
      </div>
    );
  }
  const mentors = staff.filter(s => canMentor(s, member) && !staff.some(o => getStaffCareer(o).mentorId === s.id));
  if (mentors.length === 0) return null;
  return (
    <div className="mt-2 text-[11px] text-stone-300" data-testid="staff-mentor">
      {tc(`${P}mentor_label`, 'Mentor:')} {mentors.map(m => (
        <button key={m.id} className="underline mr-2" onClick={() => onSetMentor(member.id, m.id)}>{m.name}</button>
      ))}
    </div>
  );
};
