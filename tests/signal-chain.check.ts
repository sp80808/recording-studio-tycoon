import {
  availableForSlot, validateChain, evaluateChain, chainMultiplier, saveTemplate, resolveTemplates, growFamiliarity, activeChainSlots, busyGearIds,
  type SignalChain,
} from '../src/rpg/signalChain';
import { evaluateProjectSynergies } from '../src/utils/synergyUtils';
import { STUDIO_SYNERGIES } from '../src/data/synergies';
import type { Equipment, GameState, Project, StaffMember } from '../src/types/game';

let passed = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); passed++; console.log(`PASS: ${m}`); };

const gear = (id: string, category: Equipment['category'], condition = 100): Equipment => ({ id, name: id, category, price: 0, description: '', bonuses: {}, icon: '', condition });
const owned = [gear('ribbon_vintage_mic', 'microphone'), gear('api_the_wiser', 'outboard'), gear('fairychild_comp', 'outboard'), gear('audio_interface', 'interface'), gear('condenser_mic', 'microphone')];
const staff = (over: Partial<StaffMember> = {}): StaffMember => ({ id: 's1', name: 'Sam', role: 'Engineer', primaryStats: { creativity: 30, technical: 30, speed: 30 }, xpInRole: 0, levelInRole: 1, genreAffinity: null, energy: 100, mood: 80, salary: 0, status: 'Idle', assignedProjectId: null, skills: {} as StaffMember['skills'], ...over });
const base = (over: Partial<GameState> = {}) => ({ ownedEquipment: owned, activeProject: null, activeProjects: [], hiredStaff: [], studioRooms: [], ...over }) as unknown as GameState;
const chain: SignalChain = { id: 'c1', name: 'Warm', service: 'vocal-recording', roomId: 'studio-a', slots: { microphone: 'ribbon_vintage_mic', preamp: 'api_the_wiser', dynamics: 'fairychild_comp', recorderInterface: 'audio_interface' } };
const brief = { direction: 'intimate' as const, priority: 'quality' as const, genre: 'Soul' };

ok(availableForSlot(base(), 'microphone').length === 2 && availableForSlot(base(), 'dynamics').every((e) => e.id === 'fairychild_comp'), 'slots only offer matching owned gear');
ok(validateChain(chain, base()).valid, 'full chain validates');
ok(!validateChain({ ...chain, slots: { ...chain.slots, dynamics: 'sold_item' } }, base()).valid, 'unavailable gear cannot be selected');

const s = staff();
const a = evaluateChain(chain, base(), [s], brief);
ok(JSON.stringify(a) === JSON.stringify(evaluateChain(chain, base(), [s], brief)), 'same state/chain/brief gives same evaluation');
ok(a.reasons.length > 0 && a.traits.includes('warm'), 'evaluation is explainable');
const polished = evaluateChain(chain, base(), [s], { ...brief, direction: 'polished' });
ok(polished.compatibility !== a.compatibility, 'brief changes the evaluation of the same chain');

const worn = base({ ownedEquipment: owned.map((e) => (e.id === 'fairychild_comp' ? { ...e, condition: 30 } : e)) });
const w = evaluateChain(chain, worn, [s], brief);
ok(w.reliabilityRisk === 'high' && w.setupTime > a.setupTime && w.compatibility < a.compatibility, 'condition raises risk and setup time predictably');
const fam = evaluateChain(chain, base(), [staff({ gearFamiliarity: { ribbon_vintage_mic: 5, api_the_wiser: 5, fairychild_comp: 5, audio_interface: 5 } })], brief);
ok(fam.familiarity === 100 && fam.setupTime < a.setupTime, 'familiarity cuts setup time');
ok(chainMultiplier(a) >= 0.97 && chainMultiplier(fam) <= 1.06, 'output modifier is bounded');

const live = { id: 'p1', signalChain: chain } as unknown as Project;
ok(busyGearIds(base({ activeProject: live } as Partial<GameState>)).has('ribbon_vintage_mic'), 'gear in a live chain is busy');
ok(!validateChain(chain, base({ activeProject: live } as Partial<GameState>), 'other').valid, 'one instance cannot sit in two chains');
ok(validateChain(chain, base({ activeProject: live } as Partial<GameState>), 'p1').valid, 'a project may keep its own gear');

const tpls = saveTemplate([], chain, 'Warm Vocal A');
const st = base({ chainTemplates: tpls } as Partial<GameState>);
ok(JSON.parse(JSON.stringify(tpls))[0].name === 'Warm Vocal A' && resolveTemplates(st)[0].validation.valid, 'templates survive serialisation');
const sold = base({ chainTemplates: tpls, ownedEquipment: owned.filter((e) => e.id !== 'fairychild_comp') } as Partial<GameState>);
const r = resolveTemplates(sold)[0];
ok(!r.validation.valid && r.validation.broken.includes('dynamics'), 'sold gear surfaces a broken template slot');

const grown = growFamiliarity([s, staff({ id: 's2' })], chain, new Set(['s1']));
ok(grown[0].gearFamiliarity?.fairychild_comp === 1 && !grown[1].gearFamiliarity, 'only crew who worked gain familiarity');
let g = [s]; for (let i = 0; i < 20; i++) g = growFamiliarity(g, chain, new Set(['s1']));
ok(g[0].gearFamiliarity?.fairychild_comp === 10, 'familiarity is capped');

const proj = (c?: SignalChain) => ({ id: 'p9', genre: 'Soul', signalChain: c, bookingRoomId: 'studio-a' }) as unknown as Project;
const synState = base({ studioRooms: [], hiredStaff: [] } as Partial<GameState>);
const afe = STUDIO_SYNERGIES.filter((x) => x.id === 'analog_front_end');
ok(evaluateProjectSynergies(proj(), synState, afe).length === 1, 'without a chain, ownership still activates analog_front_end');
ok(evaluateProjectSynergies(proj(chain), synState, afe).length === 1, 'a valid chain activates analog_front_end');
ok(evaluateProjectSynergies(proj({ ...chain, slots: { microphone: 'ribbon_vintage_mic' } }), synState, afe).length === 0, 'an incomplete chain does not, even though the gear is owned');
ok(activeChainSlots(proj(), synState) === null, 'no chain means no chain slots');
console.log(`\n${passed} checks passed`);
