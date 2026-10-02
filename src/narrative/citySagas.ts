/**
 * City sagas: one three-beat chain per home city (18 events), carried by studio memories.
 *
 * Beat 1 opens once the studio has a little reputation. Every option writes the memory that unlocks
 * the next beat. Same contract as the rest of the pool: typed capped effects, cooldowns,
 * maxOccurrences 1, delegable safe default. Gated on `facts.cityId`, so legacy saves never see them.
 */
import type { StudioEventDefinition } from './eventDirector';

type Effects = StudioEventDefinition['options'][number]['effects'];
type Row = [string, number][];
type Opt = [string, string, Row, string];
type Beat = [string, string, Opt, Opt];

const fx = (rows: Row): Effects => rows.map(([kind, amount]) => ({ kind, amount }) as Effects[number]);

const SAGAS: { code: string; city: string; place: string; name: string; beats: Beat[] }[] = [
  { code: "la", city: "los-angeles", place: "LOS ANGELES", name: "The Reel in the Wall", beats: [
    ["A Tape Behind the Plaster", "Rewiring the control room, an electrician finds a reel of tape sealed in the wall with a date from decades ago.", ["Play it before anyone else hears", "You thread it up alone, after midnight.", [["xp", 40], ["reputation", 1]], "Faint, warm, unmistakable. Someone very good once played in this room."], ["Hand it to a restoration lab", "Do it properly and pay for it.", [["money", -120], ["reputation", 2]], "The lab calls it a find and promises a clean transfer."]],
    ["Whose Voice Is on the Reel?", "The transfer is back. A singer, a band that never released a thing, and a name scrawled on the box.", ["Track down the family", "Letters, phone calls, an afternoon in an archive.", [["xp", 30], ["reputation", 3]], "A granddaughter cries on the phone, then asks you to come to dinner."], ["Keep it quiet and keep the tape", "Some things are better left in the vault.", [["money", 150]], "The tape goes in a drawer. The drawer feels heavier."]],
    ["The Reel Gets Its Release", "Word has spread. A reissue label wants the tape and the story of the room that kept it.", ["Release it with the family", "Split the credit and the proceeds fairly.", [["reputation", 8], ["money", 200]], "The reissue sells out. Your name is in the liner notes, near theirs."], ["License it outright", "Take the cheque and thank them kindly.", [["money", 450], ["reputation", 2]], "It pays well. The family never quite writes back."]],
  ] },
  { code: "nashville", city: "nashville", place: "NASHVILLE", name: "The Unfinished Song", beats: [
    ["A Chorus Without Verses", "A weathered songwriter leaves a cassette on your desk: one perfect chorus, no verses, no name.", ["Write the verses yourself", "Sit with it until it talks.", [["xp", 40], ["reputation", 1]], "By morning you have three verses. None feel like yours."], ["Ask around town", "Somebody on Music Row will know.", [["reputation", 2], ["xp", 15]], "Four different people recognise it. All four give a different name."]],
    ["The Songwriter Comes Back", "They are in the lobby, older than the tape suggested, and slightly offended you changed a word.", ["Let them rewrite it in the room", "Give them the good mic and the afternoon.", [["xp", 30], ["reputation", 3]], "The new lyric is plainer and much, much better."], ["Defend your version", "It works. Why break it?", [["reputation", 1], ["money", 120]], "They leave unconvinced, but the demo gets airplay."]],
    ["A Cover from the Top of the Charts", "A chart-topping act wants to cut the song. The songwriter has one condition: your room.", ["Record it all in your room", "Take the session and the spotlight.", [["reputation", 8], ["money", 250]], "It goes to number one. The songwriter sends a handwritten card."], ["Step back and take a credit in the notes", "Smaller fee, bigger friend.", [["money", 80], ["reputation", 4], ["xp", 40]], "The credit is a single line. People in town read it twice."]],
  ] },
  { code: "london", city: "london", place: "LONDON", name: "Radio Silence", beats: [
    ["A Pirate Signal Reaches the Roof", "Your aerial picks up a pirate station playing nothing but demos, and the DJ keeps naming your street.", ["Climb up and trace the signal", "Cold fingers, good view.", [["xp", 35], ["reputation", 1]], "A cheap transmitter, a stolen car battery, and a note addressed to the studio."], ["Send them a mixtape", "If they like unknown music, send them some.", [["reputation", 2], ["money", -60]], "It is on air within the hour."]],
    ["The DJ Asks to Meet", "The voice behind the station turns up with a thermos, two crates of tapes and a problem with the regulator.", ["Hide the crates until the heat passes", "A favour, off the books.", [["reputation", 3], ["xp", 20]], "The crates rest under your tape shelf. Nobody knocks."], ["Offer a legal broadcast slot", "Take it above ground.", [["money", -100], ["reputation", 4]], "They hate the paperwork and love the signal."]],
    ["A Legal Licence and a Live Session", "The station goes legal. The first broadcast is a live session in your room.", ["Make it a weekly show", "Regular airtime, regular hustle.", [["reputation", 8], ["xp", 50]], "By week three the queue of bands reaches the stairs."], ["Do it once, do it brilliantly", "One hour, no repeats.", [["reputation", 5], ["money", 300]], "It trends for a day and is quoted for a year."]],
  ] },
  { code: "berlin", city: "berlin", place: "BERLIN", name: "The Bunker Tape", beats: [
    ["A Key to a Concrete Door", "A promoter hands you a key to a cold bunker and says the acoustics are unreal.", ["Bring a field recorder and go", "No schedule, no safety net.", [["xp", 40], ["reputation", 1]], "The reverb tail lasts eleven seconds. You clap and listen to it ring."], ["Send an assistant and stay in the studio", "Someone has to mind the desk.", [["xp", 15], ["money", 60]], "The recording comes back muddy but full of promise."]],
    ["The Bunker Wants a Residency", "The promoter wants a monthly night. The crowd shows up before the sound system does.", ["Rig the room with your own gear", "Heavy, expensive and worth it.", [["money", -180], ["reputation", 4], ["gearCondition", -4]], "The first night, you hear the room before the music starts."], ["Rent them a system and stay home", "Cleaner books, smaller story.", [["money", 150], ["reputation", 1]], "Cheques arrive on time. The night still sounds wonderful."]],
    ["The Bunker Album", "A live album from the bunker is being cut. Press want a cover and a story.", ["Own the story", "Put the studio name on the front.", [["reputation", 8], ["xp", 30]], "The review calls it the sound of a concrete cathedral."], ["Let the venue take the credit", "Quiet pride, solid fee.", [["money", 350], ["reputation", 3]], "You are in the credits. You are not on the cover."]],
  ] },
  { code: "tokyo", city: "tokyo", place: "TOKYO", name: "The Last Kissaten", beats: [
    ["A Jazz Cafe Is Closing", "A tiny cafe with a legendary record collection is closing at the end of the month. The owner says you can choose three.", ["Pick three and record the owner talking", "Preserve the voice as well as the vinyl.", [["xp", 40], ["reputation", 2]], "Ninety minutes of stories about every record on the wall."], ["Buy the collection outright", "Too much to lose to a stranger.", [["money", -200], ["reputation", 3]], "The shelves arrive in a van. The whole room smells of old paper."]],
    ["One Last Night of Music", "The owner asks for one live night with the regulars, and wants it recorded properly.", ["Record the night in full", "Dedicated mics and a full multitrack.", [["xp", 35], ["reputation", 4]], "Forty people, one piano, no applause until the last chord fades."], ["Keep it small and hands-off", "Let the night be a night.", [["reputation", 2], ["money", 100]], "You sit in the back with the owner and drink the last cup."]],
    ["The Records Get a Second Home", "A label wants to build a listening room around the collection. They want your studio involved.", ["Co-curate the room", "Share the shelves with the public.", [["reputation", 8], ["xp", 40]], "The new listening room opens with a queue around the block."], ["Sell the story, keep the vinyl", "A generous fee, a private shelf.", [["money", 400], ["reputation", 3]], "The story sells beautifully. The vinyl stays yours."]],
  ] },
  { code: "rio", city: "rio", place: "RIO", name: "The Carnival Rehearsal Tape", beats: [
    ["A Tape from Last Year", "A samba teacher brings a rehearsal tape from last year, ruined by a leaking roof, and asks if anything can be saved.", ["Bake the tape and try", "Eight hours in a low oven, fingers crossed.", [["xp", 40], ["reputation", 1]], "It plays for ninety seconds before it dies. They are the best ninety seconds you have heard."], ["Rebuild it from memory", "Re-record with the same players.", [["money", -90], ["reputation", 3]], "They remember every beat, and add a few new ones."]],
    ["The Drummers Want a Proper Album", "The whole school wants the rebuilt song on an album, in time for carnival.", ["Rush to finish before carnival", "Overtime and espresso.", [["money", -120], ["reputation", 4], ["xp", 30]], "You finish at dawn, the same hour the parade begins to form."], ["Take the season, release after", "Done right, if late.", [["reputation", 3], ["money", 100]], "They are impatient but proud, and the final mix is stunning."]],
    ["The Parade Plays Your Record", "The song opens the parade. Half the city hears it from a truck, a window and a bar.", ["Join the parade with the mixing desk", "Obviously.", [["reputation", 8], ["xp", 40], ["gearCondition", -3]], "You push a flight case through the crowd and no one is annoyed."], ["Watch from the roof with a thermos", "The best seat in the city.", [["reputation", 5], ["money", 250]], "You hear your own mix a block away and it holds up."]],
  ] },
];

/** The second option is always the safer pick (smaller swing) and doubles as the delegate default. */
export const CITY_SAGA_EVENTS: readonly StudioEventDefinition[] = SAGAS.flatMap((s) =>
  s.beats.map((beat, i): StudioEventDefinition => {
    const [title, context, a, b] = beat;
    const n = i + 1;
    const key = `saga.${s.code}.${n}`;
    const optionFor = (letter: string, o: Opt) => ({
      id: `saga_${s.code}_${n}_${letter}`,
      label: o[0],
      flavorText: o[1],
      effects: fx(o[2]),
      memories: [{ scope: 'studio' as const, key, ttlDays: 400 }],
      outcome: o[3],
    });
    return {
      id: `saga_${s.code}_${n}`,
      family: `city-saga-${s.code}`,
      baseWeight: 14,
      cooldownDays: 20 + i * 4,
      maxOccurrences: 1,
      eligible: (f) => f.cityId === s.city && (n > 1 || f.reputation >= 12),
      requiredMemories: n > 1 ? [`studio/saga.${s.code}.${n - 1}`] : undefined,
      narrativeKey: `city.${key}`,
      kicker: `${s.place} // ${s.name.toUpperCase()} (${n}/3)`,
      title,
      context: () => context,
      options: [optionFor('a', a), optionFor('b', b)],
      delegable: true,
      defaultOptionId: `saga_${s.code}_${n}_b`,
    };
  }),
);

/** Saga event id -> city id, so the decision card can show the right scene. */
export const SAGA_CITY_BY_EVENT: Record<string, string> = Object.fromEntries(
  SAGAS.flatMap((s) => [1, 2, 3].map((n) => [`saga_${s.code}_${n}`, s.city])),
);
