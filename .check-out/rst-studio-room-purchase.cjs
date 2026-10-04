// src/utils/studioRoomUtils.ts
var createDefaultStudioRooms = () => [
  {
    id: "studio-a",
    name: "Studio A",
    type: "project-studio",
    unlocked: true,
    level: 1,
    purchaseCost: 0,
    requiredPlayerLevel: 1,
    supportedStageKinds: ["general", "tracking", "production", "mixing", "mastering"],
    qualityBonus: 0,
    speedBonus: 0
  },
  {
    id: "vocal-suite",
    name: "Vocal Suite",
    type: "vocal-suite",
    unlocked: false,
    level: 1,
    purchaseCost: 1800,
    requiredPlayerLevel: 3,
    supportedStageKinds: ["tracking", "production"],
    qualityBonus: 4,
    speedBonus: 2
  },
  {
    id: "live-room",
    name: "Live Room",
    type: "live-room",
    unlocked: false,
    level: 1,
    purchaseCost: 5200,
    requiredPlayerLevel: 5,
    supportedStageKinds: ["tracking", "production"],
    qualityBonus: 6,
    speedBonus: 3
  },
  {
    id: "mix-suite",
    name: "Mix Suite",
    type: "mix-suite",
    unlocked: false,
    level: 1,
    purchaseCost: 9e3,
    requiredPlayerLevel: 8,
    supportedStageKinds: ["mixing", "mastering", "production"],
    qualityBonus: 8,
    speedBonus: 5
  }
];
var getOperationalStudioRooms = (gameState) => (gameState.studioRooms || []).filter((room) => room.unlocked);
var getStudioRoomPurchaseAvailability = (gameState, roomId, roomExpansionLimit) => {
  const room = gameState.studioRooms.find((candidate) => candidate.id === roomId);
  if (!room) {
    return { available: false, reason: "not-found", explanation: "This studio room does not exist." };
  }
  if (room.unlocked) {
    return { available: false, room, reason: "already-owned", explanation: `${room.name} is already operational.` };
  }
  if (!Number.isFinite(gameState.money) || !Number.isFinite(gameState.playerData.level) || !Number.isFinite(room.purchaseCost) || room.purchaseCost < 0 || !Number.isFinite(room.requiredPlayerLevel) || !Number.isFinite(roomExpansionLimit) || roomExpansionLimit < 0) {
    return { available: false, room, reason: "invalid-state", explanation: "Room purchase data is invalid." };
  }
  if (gameState.playerData.level < room.requiredPlayerLevel) {
    return {
      available: false,
      room,
      reason: "level",
      explanation: `Reach level ${room.requiredPlayerLevel} to consider this expansion.`
    };
  }
  if (getOperationalStudioRooms(gameState).length >= Math.floor(roomExpansionLimit)) {
    return {
      available: false,
      room,
      reason: "expansion-limit",
      explanation: "Grow your staff and studio track record before adding another production suite."
    };
  }
  if (gameState.money < room.purchaseCost) {
    return {
      available: false,
      room,
      reason: "funds",
      explanation: `You need $${room.purchaseCost.toLocaleString()} for ${room.name}.`
    };
  }
  return { available: true, room };
};
var applyStudioRoomPurchase = (gameState, roomId, roomExpansionLimit) => {
  const availability = getStudioRoomPurchaseAvailability(gameState, roomId, roomExpansionLimit);
  if (!availability.available) return gameState;
  return {
    ...gameState,
    money: gameState.money - availability.room.purchaseCost,
    studioRooms: gameState.studioRooms.map(
      (room) => room.id === availability.room.id ? { ...room, unlocked: true } : room
    )
  };
};

// tests/studio-room-purchase.check.ts
var makeState = (overrides = {}) => ({
  money: 1e4,
  playerData: { level: 8 },
  studioRooms: createDefaultStudioRooms(),
  ...overrides
});
var initial = makeState();
var purchased = applyStudioRoomPurchase(initial, "vocal-suite", 4);
if (purchased.money !== 8200 || !purchased.studioRooms.find((room) => room.id === "vocal-suite")?.unlocked) {
  throw new Error("Valid room purchase did not unlock the room and charge its current cost");
}
var repeated = applyStudioRoomPurchase(purchased, "vocal-suite", 4);
if (repeated !== purchased || repeated.money !== 8200) {
  throw new Error("Repeated room purchase charged twice");
}
var staleAffordable = makeState({ money: 1e4 });
var latestUnaffordable = { ...staleAffordable, money: 1e3 };
var rejectedForFunds = applyStudioRoomPurchase(latestUnaffordable, "vocal-suite", 4);
if (rejectedForFunds !== latestUnaffordable || rejectedForFunds.money !== 1e3) {
  throw new Error("Purchase did not validate funds against the latest state");
}
var capped = makeState({
  studioRooms: createDefaultStudioRooms().map(
    (room) => room.id === "vocal-suite" ? { ...room, unlocked: true } : room
  )
});
var rejectedAtLimit = applyStudioRoomPurchase(capped, "live-room", 2);
if (rejectedAtLimit !== capped || rejectedAtLimit.money !== 1e4) {
  throw new Error("Purchase bypassed the latest expansion limit");
}
var levelExplanation = getStudioRoomPurchaseAvailability(
  makeState({ playerData: { level: 2 } }),
  "vocal-suite",
  4
);
if (levelExplanation.available || levelExplanation.reason !== "level") {
  throw new Error("Locked room did not explain its level requirement");
}
var invalid = makeState({ money: Number.NaN });
if (applyStudioRoomPurchase(invalid, "vocal-suite", 4) !== invalid) {
  throw new Error("Non-finite purchase state was accepted");
}
console.log("PASS: Studio room purchases are atomic, idempotent, and explain unavailable rooms");
