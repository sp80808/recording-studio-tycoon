import {
  deriveBrief, evaluateBriefFit, evaluateProjectBriefFit, getProjectBrief, topReasons, recordBriefDiscoveries,
  BRIEF_RULE_COUNT, PRODUCTION_APPROACHES, BRIEF_FIT_MULTIPLIER,
} from '../src/rpg/projectBrief';
import type { Equipment, Project, StaffMember, StudioRoom } from '../src/types/game';

let passed = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); passed++; console.log(`PASS: ${m}`); };

const room = (type: StudioRoom['type'], name: string): StudioRoom => ({ id: type, name, type, unlocked: true, level: 1, purchaseCost: 0, requiredPlayerLevel: 1, supportedStageKinds: ['general'], qualityBonus: 0, speedBonus: 0 });
const gear = (category: Equipment['category'], condition = 100): Equipment => ({ id: category, name: category, category, price: 0, description: '', bonuses: {}, icon: '', condition });
const staff = (over: Partial<StaffMember> = {}): StaffMember => ({
  id: 's1', name: 'Sam', role: 'Producer', primaryStats: { creativity: 40, technical: 40, speed: 40 }, xpInRole: 0, levelInRole: 1,
  genreAffinity: { genre: 'Soul', bonus: 30 }, energy: 100, mood: 80, salary: 100, status: 'Idle', assignedProjectId: null, skills: {} as StaffMember['skills'], ...over,
});
const brief = { serviceType: 'vocal-production' as const, direction: 'intimate' as const, priority: 'quality' as const, genre: 'Soul' };
const base = { room: room('vocal-suite', 'Vocal Suite'), staff: [staff()], equipment: [gear('microphone')] };

const a = evaluateBriefFit(brief, base);
const b = evaluateBriefFit(brief, base);
ok(JSON.stringify(a) === JSON.stringify(b), 'same brief + state gives identical fit and reasons');
ok(a.grade === 'excellent' && a.discoveries.some((d) => d.name === 'Intimate Vocal Chain'), 'authored recipe grades excellent and discovers Intimate Vocal Chain');
ok(topReasons(a).length === 2, 'preview shows at most two reasons');
ok(BRIEF_RULE_COUNT >= 10, 'at least 10 authored rules');

const wrongRoom = evaluateBriefFit(brief, { ...base, room: room('live-room', 'Live Room') });
ok(wrongRoom.score < a.score, 'changing room lowers fit predictably');
const noStaff = evaluateBriefFit(brief, { ...base, staff: [] });
ok(noStaff.score < a.score, 'removing the specialist lowers fit');
ok(evaluateBriefFit(brief, { ...base, equipment: [gear('microphone', 10)] }).discoveries.length === 0, 'worn-out gear does not count');
ok(a.score <= 100 && wrongRoom.score >= 0, 'score is bounded');

const exp = evaluateBriefFit({ ...brief, direction: 'raw' }, { ...base, approachId: 'experimental-layers' });
ok(exp.grade === 'experimental' || exp.grade === 'excellent' || exp.grade === 'strong', 'experimental approach is evaluated as experimental direction');
ok(PRODUCTION_APPROACHES.length === 3 && PRODUCTION_APPROACHES.every((p) => p.focus.performance + p.focus.soundCapture + p.focus.layering === 100), 'three approaches with valid focus splits');
ok(BRIEF_FIT_MULTIPLIER.excellent <= 1.1 && BRIEF_FIT_MULTIPLIER.poor >= 0.9, 'output modifier is bounded');

const p1 = { id: 'project-1', genre: 'Rock' };
ok(JSON.stringify(deriveBrief(p1)) === JSON.stringify(deriveBrief(p1)), 'deriveBrief is deterministic');
const legacy = { ...p1, title: 't', clientType: 'Independent', difficulty: 1 } as unknown as Project;
ok(getProjectBrief(legacy).genre === 'Rock', 'legacy project without brief defaults safely');

// Market popularity is not an input: fit is identical regardless of any market state.
const state = { studioRooms: [room('vocal-suite', 'Vocal Suite')], hiredStaff: [staff()], ownedEquipment: [gear('microphone')], clientRelationships: {} };
const f1 = evaluateProjectBriefFit({ ...legacy, genre: 'Soul' }, state);
const f2 = evaluateProjectBriefFit({ ...legacy, genre: 'Soul' }, { ...state, marketTrends: { Soul: 0.1 } } as typeof state);
ok(f1.score === f2.score, 'market state cannot change technical fit');

const d1 = recordBriefDiscoveries([], a);
ok(d1.added.length > 0 && recordBriefDiscoveries(d1.list, a).added.length === 0, 'discoveries persist and do not repeat');
console.log(`\n${passed} checks passed`);
