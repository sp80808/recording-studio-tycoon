import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EquipmentList } from '../src/components/EquipmentList';
import { GameBonusesDisplay } from '../src/components/equipment/GameBonusesDisplay';
import { gearEffectParts, GEAR_NO_EFFECT_TEXT } from '../src/rpg/gearEffects';
import { describeStakeUnlock, STAKE_MIN_LEVEL, isStakeUnlocked } from '../src/rpg/contractStakes';
import { createNewGameState } from '../src/utils/newGameState';
import { getAvailableEquipmentForYear } from '../src/data/eraEquipment';

assert.deepEqual(gearEffectParts({ qualityBonus: 10, speedBonus: -5, genreBonus: { Rock: 2 } }), ['+10 quality', '−5 speed', 'Rock +2']);
assert.deepEqual(gearEffectParts({ qualityBonus: 0 }), []);
assert.deepEqual(gearEffectParts(undefined), []);
assert.ok(renderToStaticMarkup(<GameBonusesDisplay bonuses={{ qualityBonus: 0 }} />).includes(GEAR_NO_EFFECT_TEXT), 'empty bonuses explain themselves');

const state = { ...createNewGameState({ cityId: 'london', selectedEra: 'classic_rock' }), money: 100000, ownedEquipment: [] };
const html = renderToStaticMarkup(<EquipmentList gameState={state} purchaseEquipment={() => {}} />);
const cards = html.split('gear-shop__card').length - 1;
const effects = html.split('data-testid="gear-effects"').length - 1;
assert.ok(cards > 0 && cards === effects, 'every shop card shows a visible effect line');
const first = getAvailableEquipmentForYear(state.currentYear).find(item => gearEffectParts(item.bonuses).length > 0 && !item.skillRequirement);
if (first) assert.ok(html.includes(gearEffectParts(first.bonuses)[0]), 'effect line carries real gear stats');

assert.equal(describeStakeUnlock('ambitious'), `Unlocks at producer level ${STAKE_MIN_LEVEL.ambitious}`);
assert.ok(isStakeUnlocked('ambitious', STAKE_MIN_LEVEL.ambitious) && !isStakeUnlocked('moonshot', STAKE_MIN_LEVEL.ambitious));
console.log('shop effects + stake hints check passed');
