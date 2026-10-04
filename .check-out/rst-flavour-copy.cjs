var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// tests/flavour-copy.check.ts
var import_node_test = require("node:test");
var import_strict = __toESM(require("node:assert/strict"), 1);

// src/simulation/seededRandom.ts
var hashSeed = (value) => {
  const input = String(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};
var createSeededRandom = (seed) => {
  let state = hashSeed(seed);
  return () => {
    state += 1831565813;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
};

// src/data/flavour.ts
var INDUSTRY_TIPS = [
  "Every great record started as a bad demo with one good idea. Yours is in there somewhere.",
  '"Fix it in the mix" is a lovely thing to say and a terrible thing to plan around.',
  "Take 37 is usually where the magic happens, right after take 36 where everyone swore it was done.",
  "The tea is part of the signal chain. Nobody can prove otherwise.",
  "Clients remember how the room felt long after they forget the snare sound. Keep the room happy.",
  "The quietest person in the control room often has the best idea. Ask them.",
  "Drummers are timekeepers. Singers are weather. Plan the day accordingly.",
  "A rider with one bowl of only-the-blue-sweets is a test of your attention to detail. You passed it.",
  "Every cable in the drawer is tangled. This is a law of nature, not a management failure.",
  "A good engineer sounds like they did nothing. That's the craft.",
  "The song is the boss. Sometimes the boss wants a cowbell. Sometimes the boss is wrong, but you play the cowbell anyway.",
  "Tuning the room beats buying the gear. Your neighbour's vacuum cleaner is a mastering engineer of sorts.",
  "Charts move fast, but a great tune finds its people eventually. Patience is a plugin.",
  'Nobody ever said "I wish that session were shorter" about the good one.',
  "A happy accident is only an accident if you didn't hit record. You always hit record.",
  "Loud is a choice, and so is quiet. The best records know which one they're making.",
  "Everyone in the business started by carrying someone else's amp. Be kind to the new kid.",
  "Streaks are lovely, but rest is also a creative decision. The faders will wait.",
  "A studio is just a room where people agree to be brave for a few hours.",
  "The hit single and the B-side you love more are often the same band on different days."
];
var LOADING_LINES = [
  "Warming up the tubes\u2026",
  "Tuning the room\u2026",
  "Untangling cables\u2026",
  "Putting the kettle on\u2026",
  "Finding the good pencil\u2026",
  "Checking the talkback mic is, in fact, off\u2026",
  "Rolling tape\u2026"
];
var EMPTY_STATES = {
  staff: { title: "The couch is unoccupied.", hint: "Visit the Recruitment Center and find someone who loves this as much as you do." },
  skills: { title: "A blank tape, full of possibility.", hint: "Finish a session and something will stick." },
  crew: { title: "Just you and the faders.", hint: "Hire someone through the Staff panel while the studio is quiet. Somebody has to laugh at your jokes." },
  chronicle: { title: "The first page is still blank.", hint: "A story beat will find you, they always do." },
  chart: { title: "The charts are waiting for their next favourite.", hint: "Release a track with a band and they will find you the moment it lands." },
  sessionRoom: { title: "The live room is hushed.", hint: "Book a session and the amps will hum." },
  warehouse: { title: "The warehouse remembers every purchase.", hint: "Nothing is shelved here yet." }
};
var IDLE_CHATTER = [
  "Someone left a half-finished lyric on the whiteboard.",
  "The kettle clicks off. Nobody moves. Nobody ever moves.",
  "A guitarist is playing the same four bars. He thinks it's a new song.",
  "The intern is alphabetising the cables. Nobody asked.",
  "Through the wall, a drummer is playing the world's slowest fill.",
  "Someone asks whether it's too loud. It is never too loud. It is sometimes too loud.",
  "The couch has seen things. The couch has heard demos.",
  'A faint "one more take?" drifts in from the live room.',
  "The plant in the corner is thriving on a diet of second-hand bass.",
  "A tape op silently judges your label choices. Fondly."
];
function pickFlavour(pool, seed) {
  const rng = createSeededRandom(seed);
  return pool[Math.floor(rng() * pool.length)];
}

// tests/flavour-copy.check.ts
var banned = /\b(Spotify|Apple|Napster|TikTok|MTV|YouTube|Beatles|Phil Collins|Spector|Auto-Tune|Live Aid|Idol|Linn|Kate Bush|Fleetwood|Grammy|Grammys|Billboard|Pro Tools|Abbey Road|Neumann|Shure|Fender|Gibson|Van Halen|M&M|Rolling Stone|Motown|Sun Records)\b/i;
var all = [
  ...INDUSTRY_TIPS,
  ...LOADING_LINES,
  ...IDLE_CHATTER,
  ...Object.values(EMPTY_STATES).flatMap((e) => [e.title, e.hint])
];
(0, import_node_test.describe)("flavour copy", () => {
  (0, import_node_test.it)("avoids real brand and personal names", () => {
    for (const line of all) import_strict.default.ok(!banned.test(line), `real name in: ${line}`);
  });
  (0, import_node_test.it)("has unique lines of sane length and a healthy pool", () => {
    import_strict.default.equal(new Set(all).size, all.length);
    import_strict.default.ok(INDUSTRY_TIPS.length >= 15 && IDLE_CHATTER.length >= 8);
    for (const line of all) import_strict.default.ok(line.length > 8 && line.length <= 170, line);
  });
  (0, import_node_test.it)("picks deterministically per seed", () => {
    import_strict.default.equal(pickFlavour(INDUSTRY_TIPS, "a"), pickFlavour(INDUSTRY_TIPS, "a"));
  });
});
