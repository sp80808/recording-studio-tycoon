import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RoomVignette } from '../src/components/studio/RoomVignette';
import { StudioRoomTabs } from '../src/components/studio/StudioRoomTabs';
import { createDefaultStudioRooms, getOperationalStudioRooms } from '../src/utils/studioRoomUtils';

const rooms = createDefaultStudioRooms();
const noop = () => {};

// Only the original studio at the start: no tabs, nothing changes.
const start = getOperationalStudioRooms({ studioRooms: rooms });
assert.equal(start.length, 1);
assert.equal(renderToStaticMarkup(<StudioRoomTabs rooms={start} activeId="studio-a" occupied={new Set()} onSelect={noop} />), '');

// Unlock extras: tabs list Studio A first, the active tab is selected, busy rooms are marked.
const all = rooms.map((r) => ({ ...r, unlocked: true }));
const html = renderToStaticMarkup(<StudioRoomTabs rooms={all} activeId="live-room" occupied={new Set(['live-room'])} onSelect={noop} />);
assert.ok(html.indexOf('Studio A') < html.indexOf('Vocal Suite'), 'original studio is the first tab');
assert.equal((html.match(/aria-selected="true"/g) ?? []).length, 1);
assert.ok(html.includes('in session'));

// Every extra room type has its own themed view with stats and booking state.
for (const room of all.filter((r) => r.id !== 'studio-a')) {
  const free = renderToStaticMarkup(<RoomVignette room={room} />);
  assert.ok(free.includes(room.name) && free.includes('Free'), `${room.id} free view`);
  assert.ok(free.includes(`Quality +${room.qualityBonus}`));
  const busy = renderToStaticMarkup(<RoomVignette room={room} occupiedBy="Midnight Demo" />);
  assert.ok(busy.includes('Booked: Midnight Demo'), `${room.id} busy view`);
}
console.log('room switcher check passed');
