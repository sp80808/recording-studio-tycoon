import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CITIES } from '../src/rpg/cities';
import { CityScene } from '../src/components/CityScene';
import { SKYLINES } from '../src/components/CitySkyline';
import { EquipmentList } from '../src/components/EquipmentList';
import { GameBonusesDisplay } from '../src/components/equipment/GameBonusesDisplay';
import { createNewGameState } from '../src/utils/newGameState';
import { getAvailableEquipmentForYear } from '../src/data/eraEquipment';
import { setDisplayCurrency } from '../src/utils/displayMoney';

const initial = createNewGameState({ cityId: 'london', selectedEra: 'classic_rock' });
const gear = getAvailableEquipmentForYear(initial.currentYear).find(item => !item.skillRequirement)!;
const state = { ...initial, money: 0, ownedEquipment: [{ ...gear, id: 'retail-instance-proof', templateId: gear.id }] };
setDisplayCurrency('london', 'analog60s');
const html = renderToStaticMarkup(<EquipmentList gameState={state} purchaseEquipment={() => {}} />);
assert.ok(!html.includes(gear.name), 'persisted template ownership hides already-owned retail gear');
assert.ok(html.includes('£') && !html.includes('$'), 'prices, budget and shortfall use local currency');
assert.ok(html.includes('Within budget') && html.includes('<select'), 'native filters are labelled');
assert.ok(html.includes('<details') && html.includes('What it adds to a session'), 'real bonuses are available without a modal');
assert.ok(html.includes('disabled=""') && html.includes('to go'), 'unaffordable offers show the shortfall and cannot be bought');
assert.ok(html.includes('1 in your collection') && html.includes('role="status"'), 'collection feedback announces the resulting state');
const bonuses = renderToStaticMarkup(<GameBonusesDisplay bonuses={{ speedBonus: -5, qualityBonus: 10, genreBonus: { Rock: -2 } }} />);
assert.ok(!bonuses.includes('+-') && bonuses.includes('-5') && bonuses.includes('-2'), 'bonus penalties have truthful signs');
for (const city of CITIES) {
  assert.ok(SKYLINES[city.id], `${city.id} has skyline artwork`);
  assert.ok(renderToStaticMarkup(<CityScene cityId={city.id} />).includes(`data-city="${city.id}"`), `${city.id} event scene renders`);
}
setDisplayCurrency(undefined, undefined);
console.log('gear shop check passed');
