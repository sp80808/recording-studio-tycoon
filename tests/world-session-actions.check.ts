import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  describeConsoleSessionAction,
  describePhoneAnswerAction,
  describeWorldInterventionAction,
  worldTargetForIntervention,
} from '../src/session/worldSessionActions';
import { createNewGameState } from '../src/utils/newGameState';

const base = createNewGameState({ cityId: 'london', selectedEra: 'classic_rock' });
const project = {
  ...base.availableProjects[0],
  currentStageIndex: 0,
  stages: base.availableProjects[0].stages.map((stage, index) => ({
    ...stage,
    completed: false,
    workUnitsCompleted: index === 0 ? 0 : stage.workUnitsCompleted,
  })),
};

assert.equal(describePhoneAnswerAction(base).worldTarget, 'phone');
assert.equal(describePhoneAnswerAction(base).enabled, base.availableProjects.length > 0);
assert.equal(describePhoneAnswerAction({ ...base, availableProjects: [] }).disabledReason, 'No enquiries are waiting.');
assert.match(describePhoneAnswerAction({ ...base, activeProject: project }).disabledReason ?? '', /Finish the live session/);

assert.equal(describeConsoleSessionAction(base).enabled, false);
assert.equal(describeConsoleSessionAction(base).actionId, 'console:open-session');
assert.deepEqual(
  describeConsoleSessionAction({ ...base, activeProject: project }),
  {
    actionId: 'console:record',
    worldTarget: 'console',
    label: 'Record at console',
    enabled: true,
  },
);
assert.equal(
  describeConsoleSessionAction({ ...base, activeProject: { ...project, awaitingReview: true } }).actionId,
  'console:review',
);
const completedProject = {
  ...project,
  stages: project.stages.map((stage, index) => index === 0 ? { ...stage, completed: true } : stage),
};
assert.match(describeConsoleSessionAction({ ...base, activeProject: completedProject }).disabledReason ?? '', /stage is complete/);

assert.equal(worldTargetForIntervention('vocal'), 'liveRoom');
assert.equal(worldTargetForIntervention('fault-hunt'), 'shelf');
assert.equal(worldTargetForIntervention('mixing'), 'console');

const opportunity = {
  id: 'first-vocal-fix',
  projectId: project.id,
  stageIndex: project.currentStageIndex,
  type: 'vocal' as const,
  reason: 'Move the singer closer to the mic.',
};
assert.deepEqual(
  describeWorldInterventionAction({ ...base, activeProject: project }, opportunity),
  {
    actionId: 'intervention:first-vocal-fix',
    worldTarget: 'liveRoom',
    label: 'Move the singer closer to the mic.',
    enabled: true,
  },
);
assert.match(describeWorldInterventionAction(base, opportunity).disabledReason ?? '', /No live session/);
assert.match(
  describeWorldInterventionAction({ ...base, activeProject: completedProject }, opportunity).disabledReason ?? '',
  /stage is complete/,
);
assert.match(
  describeWorldInterventionAction(
    { ...base, activeProject: project },
    { ...opportunity, stageIndex: project.currentStageIndex + 1 },
  ).disabledReason ?? '',
  /another session stage/,
);

console.log('world session actions check passed');

// Intent presets must remain normalized focus allocations, not extra reward modifiers.
import { RECORDING_INTENTS, matchesRecordingIntent } from '../src/session/recordingIntent';
for (const preset of RECORDING_INTENTS) {
  assert.equal(Object.values(preset.focus).reduce((sum, value) => sum + value, 0), 100);
  assert.equal(matchesRecordingIntent({ ...preset.focus }, preset.focus), true);
  assert.equal(matchesRecordingIntent({ ...preset.focus, layering: preset.focus.layering + 1 }, preset.focus), false);
}
assert.equal(new Set(RECORDING_INTENTS.map(preset => JSON.stringify(preset.focus))).size, 3);

// #189/#197: the phone is the front door — it opens the compact in-room offer card, never the drawer — and every
// world object is reachable from the keyboard as a real button tagged for the evidence recorder.
{
  const room = fs.readFileSync('src/components/StudioRoom.tsx', 'utf8');
  const inspector = fs.readFileSync('src/components/StudioInspector.tsx', 'utf8');
  assert.ok(!/canonical === 'phone' && onBookings/.test(room), 'phone tap no longer redirects to the bookings drawer');
  assert.match(room, /aria-label="Studio objects"/);
  assert.match(room, /data-rst-action-id=\{`world:\$\{id\}`\}/);
  assert.match(inspector, /Compare all enquiries/, 'the full enquiry list stays one tap away from the offer card');
  assert.ok(!/bg-emerald-400|text-green-400|bg-red-600/.test(inspector.slice(inspector.indexOf("hotspot === 'phone'"), inspector.indexOf("hotspot === 'phone'") + 4000)), 'phone card uses palette tokens');
}
