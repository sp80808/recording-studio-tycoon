# Used gear slice (GH #17 / #62, bead j8z)

`Equipment` remains the owned-gear model. Its additive metadata lives in
`types.ts`; `EquipmentInstance` makes generated fields required. `id` is the
instance identity for new finds; `templateId` is the catalogue identity for
mods and synergies. Legacy equipment keeps its original id, stats, mod and
placement during migration. The box reveal uses `toBoxEquipmentItem` to adapt
this same instance to its existing visual rarity tiers.

Generation uses main's `simulation/seededRandom.ts`. Full run/day/source/event/
template/index coordinates form identity; hashes drive flavour and RNG. Earned
crate ids and their original year/price basis are saved, so waiting to open a
case cannot change its reward. Premium flight-case fulfilment is separate.

`refreshGearForDay(state)` finishes scheduled jobs and generates 3–4 listings
only when the saved day differs from `currentDay`. New games, migrations,
calendar advancement and the existing state setter call it. Stock and purchase
flags are inside the career save. One daily listing is a low-cost workhorse.
The game calendar advances in `useGameActions`, not `simulationClock`; idle
wall time retains the existing calendar behaviour.

`applyGearAction(state, action)` receives ids and applies buy, claim, inspect,
service, repair, calibration and sell atomically. Use it inside the latest
`setGameState` updater. Failed actions return the original state. Quotes expose
cost, condition improvement and downtime. Outsource service adds up to 15
condition in 1 day; repair adds up to 45 in 2 days, both topping out at 90.
Hands-on service reuses `GearMaintenanceGame`, charges parts and 1 energy,
then starts 1 day of downtime after successful calibration. Closing retains a
resumable job. Failure spends parts with no condition gain. Completion and XP
collection are guarded by the saved job id/status.

Resale is bounded by replacement price, condition and rarity. Repair parts
always cost more than the entire resale improvement. As-is bargains yield at
most $20 each, with at most four listings per day. Purchased flags prevent
repeated flips; claimed crates are removed in the same transaction as delivery.

The first reliability slice covers interfaces, microphones, mixers and outboard.
Manual takes, fractional desktop-idle work, ProjectService and ProjectManager
record small deterministic wear. Engineer familiarity caps at 5 and reduces
wear by up to 20%. Healthy gear (40+ condition) never rolls a fault; poor gear
can produce one noisy-contact fault at a stable completed usage milestone.
It removes the item from session eligibility for one game day and never deletes
it. Service/repair clear dirty contacts. Sweet spot (+2 equipment quality) and
dirty contacts (−2, +25% wear) are disclosed; combined character quality caps
at ±3 in the existing quality calculation. Session notes persist into reviews.

## Presentation hook

`StudioRecycler({gameState, setGameState})` is currently mounted in the existing
Gear management tab. The visual branch can mount this same component in a
phone/shelf surface. `reliabilityDescription`, `conditionBand`,
`gearForecastReasons`, `maintenanceQuote`, and saved `maintenance`/`fault` fields
are the APIs for forecast text, warning LEDs and workbench animations. Gear
selection and synergies use `resolveSessionEquipment`, including downtime.
No Pixi room, canvas, global CSS or asset pack changes are included.

## Spec boundaries

The approved spec assumes technical-aptitude XP, but current main has a raw
`technicalAptitude` attribute with no XP track. Calibration awards existing
producer XP and tracking skill XP (35 each), using `grantSkillXp`; it does not
invent a second progression track. The existing game returns a boolean and
0–20 quality impact rather than a 0–100 score; passing all three dials is the
success contract. This slice generates at most one trait and one quirk.

Project-level S/S+ settlements roll 15% salvage, or 40% for moonshots. The old
stage drop compared Gold/Silver/Bronze with S and could never fire. Settlement
now guards duplicate reports before rewards or crates are applied. The broader
GH issues remain open: client preferences, collector dilemmas, negotiation,
modding/bonus mojo, staff/event narration and a dedicated forecast surface are
follow-up work. S-grade salvage uses the era catalogue; broader reward balance
belongs to the economy harness.

## Verification

`pnpm test` registers `tests/used-gear.check.ts` using the existing esbuild +
Node assert check runner. It covers complete generation equality, daily reloads,
purchases/claims/sales, repair economics, legacy saves, downtime/calibration,
wear, familiarity, faults, desktop-idle work and duplicate settlement.

`tests/used-gear-smoke.check.cjs` follows the existing browser smoke convention:
new studio → buy → inspect/service → save/reload downtime → advance day →
work/settle → save/reload worn gear. Pass it a Playwright `page`, using the
already installed Playwright library and Chrome. `RST_BASE_URL` defaults to
`http://127.0.0.1:5194`. The test dispatches the game's existing `autoSave` event;
it reads the resulting save and never injects gameplay state.
