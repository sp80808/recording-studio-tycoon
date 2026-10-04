// src/rpg/labelInterest.ts
var LABEL_ACCOUNTS = [
  { id: "major_label_001", name: "Stellar Records", tier: "global", genres: ["pop", "rock", "hip-hop", "tiktok", "soul", "motown"] },
  { id: "indie_label_001", name: "Underground Sounds", tier: "indie", genres: ["indie", "punk", "emo", "folk", "lo-fi", "blues"] },
  { id: "electronic_label_001", name: "Digital Waves Music", tier: "regional", genres: ["electronic", "edm", "disco", "new wave", "digital"] },
  { id: "hiphop_label_001", name: "Street Crown Entertainment", tier: "national", genres: ["hip-hop", "trap", "drill"] }
];
var INTEREST_CAP = 100;
var INTEREST_LINES = [25, 50, 75];
var BAND_INTEREST = { quiet: 0, solid: 0, breakthrough: 4, prestige: 8 };
var labelsForGenre = (genre) => {
  const g = genre.toLowerCase();
  return LABEL_ACCOUNTS.filter((l) => l.genres.some((frag) => g.includes(frag)));
};
var interestOf = (interest2, labelId) => interest2?.[labelId] ?? 0;
function applyLabelSignals(interest2, signals) {
  const gains = signals.filter((s) => BAND_INTEREST[s.band] > 0);
  if (gains.length === 0) return { interest: interest2, notifications: [] };
  const next = { ...interest2 ?? {} };
  const notifications = [];
  for (const s of gains) {
    for (const label of labelsForGenre(s.genre)) {
      const before = next[label.id] ?? 0;
      const after = Math.min(INTEREST_CAP, before + BAND_INTEREST[s.band]);
      next[label.id] = after;
      const crossed2 = INTEREST_LINES.filter((line) => before < line && after >= line).pop();
      if (crossed2) {
        notifications.push({
          id: `label-${label.id}-${crossed2}`,
          message: `${label.name} is asking about ${s.clientName}'s ${s.title}. The studio's name is getting around.`,
          type: "info",
          timestamp: 0,
          duration: 6e3
        });
      }
    }
  }
  return { interest: next, notifications };
}
var labelInterestLines = (interest2, limit = 3) => LABEL_ACCOUNTS.map((l) => ({ id: l.id, name: l.name, interest: interestOf(interest2, l.id) })).filter((l) => l.interest > 0).sort((a2, b) => b.interest - a2.interest || a2.name.localeCompare(b.name)).slice(0, limit);

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
var randomInt = (rng, minInclusive, maxInclusive) => {
  if (maxInclusive <= minInclusive) return minInclusive;
  return minInclusive + Math.floor(rng() * (maxInclusive - minInclusive + 1));
};

// src/data/subGenreData.ts
var subGenres = [
  // Pop Subgenres
  { id: "synthPop", name: "Synth Pop", parentGenre: "pop", description: "Characterized by prominent synthesizer use, often with a retro 80s feel.", typicalElements: ["Synthesizers", "Drum Machines", "Catchy Hooks", "Reverb Vocals"] },
  { id: "dancePop", name: "Dance Pop", parentGenre: "pop", description: "Upbeat pop music designed for dancing, common in clubs.", typicalElements: ["Four-on-the-floor Beat", "Strong Basslines", "Repetitive Choruses"] },
  { id: "indiePop", name: "Indie Pop", parentGenre: "pop", description: "Pop music produced independently, often with a lo-fi or quirky aesthetic.", typicalElements: ["Jangly Guitars", "Softer Vocals", "Unconventional Song Structures"] },
  // Rock Subgenres
  { id: "altRock90s", name: "90s Alt-Rock", parentGenre: "rock", description: "Alternative rock that gained mainstream popularity in the 1990s.", typicalElements: ["Distorted Guitars", "Angsty Lyrics", "Dynamic Shifts"] },
  { id: "punkRock", name: "Punk Rock", parentGenre: "rock", description: "Fast, aggressive rock music with a rebellious attitude.", typicalElements: ["Fast Tempos", "Simple Chord Progressions", "Anti-establishment Lyrics"] },
  { id: "progRock", name: "Progressive Rock", parentGenre: "rock", description: "Rock music with complex song structures, instrumentation, and lyrical themes.", typicalElements: ["Long Compositions", "Unusual Time Signatures", "Concept Albums"] },
  // Hip-Hop Subgenres
  { id: "trapRap", name: "Trap Rap", parentGenre: "hip-hop", description: "Hip-hop subgenre originating from the Southern US, known for its 808s and hi-hat patterns.", typicalElements: ["808 Bass", "Roland TR-808 Hi-Hats", "Layered Synths", "Autotuned Vocals"] },
  { id: "boomBap", name: "Boom Bap", parentGenre: "hip-hop", description: "Classic East Coast hip-hop style, emphasizing hard drum beats.", typicalElements: ["Sample-based Beats", "Acoustic Drum Sounds", "Lyrical Dexterity"] },
  { id: "consciousHipHop", name: "Conscious Hip-Hop", parentGenre: "hip-hop", description: "Hip-hop with lyrics focused on social issues and awareness.", typicalElements: ["Thought-provoking Lyrics", "Often Jazz/Soul Samples", "Positive Messages"] },
  // Electronic Subgenres
  { id: "house", name: "House", parentGenre: "electronic", description: "Electronic dance music characterized by a repetitive four-on-the-floor beat.", typicalElements: ["4/4 Beat", "Off-beat Hi-hats", "Synth Basslines"] },
  { id: "techno", name: "Techno", parentGenre: "electronic", description: "Repetitive instrumental music, often used in clubs.", typicalElements: ["Repetitive Rhythms", "Synthesized Sounds", "Often Minimalistic"] },
  { id: "ambient", name: "Ambient", parentGenre: "electronic", description: "Atmospheric electronic music focusing on texture and soundscape.", typicalElements: ["Soundscapes", "Slow Tempos", "Lack of Traditional Structure"] },
  // Country Subgenres
  { id: "bluegrass", name: "Bluegrass", parentGenre: "country", description: "Traditional country music with acoustic instruments and intricate harmonies.", typicalElements: ["Banjo", "Fiddle", "Acoustic Guitar", "Tight Harmonies"] },
  { id: "countryPop", name: "Country Pop", parentGenre: "country", description: "Country music with pop sensibilities and broader appeal.", typicalElements: ["Polished Production", "Catchy Melodies", "Crossover Appeal"] },
  // Jazz Subgenres
  { id: "smoothJazz", name: "Smooth Jazz", parentGenre: "jazz", description: "Accessible jazz style with melodic appeal and polished production.", typicalElements: ["Melodic Solos", "Soft Rhythms", "Contemporary Production"] },
  { id: "fusion", name: "Jazz Fusion", parentGenre: "jazz", description: "Jazz combined with rock, funk, and electronic elements.", typicalElements: ["Electric Instruments", "Complex Rhythms", "Technical Virtuosity"] },
  // R&B Subgenres
  { id: "neoSoul", name: "Neo Soul", parentGenre: "r&b", description: "Modern R&B with classic soul influences and contemporary production.", typicalElements: ["Organic Instruments", "Live Drums", "Conscious Lyrics"] },
  { id: "contemporaryRB", name: "Contemporary R&B", parentGenre: "r&b", description: "Modern R&B with electronic production and urban influences.", typicalElements: ["Programmed Beats", "Synthesizers", "Auto-tune"] },
  // Alternative Subgenres
  { id: "grunge", name: "Grunge", parentGenre: "alternative", description: "Raw, distorted alternative rock from the Pacific Northwest.", typicalElements: ["Heavy Distortion", "Flannel Aesthetic", "Anti-commercial Attitude"] },
  { id: "shoegaze", name: "Shoegaze", parentGenre: "alternative", description: "Ethereal alternative rock with layers of guitar effects.", typicalElements: ["Wall of Sound", "Effects Pedals", "Dreamy Vocals"] },
  // Classical Subgenres
  { id: "baroque", name: "Baroque", parentGenre: "classical", description: "Ornate classical music from the 17th-18th centuries.", typicalElements: ["Counterpoint", "Harpsichord", "Mathematical Precision"] },
  { id: "romantic", name: "Romantic", parentGenre: "classical", description: "Expressive classical music emphasizing emotion and individualism.", typicalElements: ["Emotional Expression", "Large Orchestras", "Program Music"] },
  // Folk Subgenres
  { id: "indieFolk", name: "Indie Folk", parentGenre: "folk", description: "Contemporary folk music with indie sensibilities.", typicalElements: ["Acoustic Instruments", "Intimate Vocals", "DIY Aesthetic"] },
  { id: "folkRock", name: "Folk Rock", parentGenre: "folk", description: "Folk music with rock instrumentation and attitude.", typicalElements: ["Electric Guitars", "Folk Melodies", "Social Commentary"] }
];

// src/services/marketService.ts
var currentMarketTrends = [];
var allSubGenres = [...subGenres];
var initializeMockData = (roll = createSeededRandom("market:initial")) => {
  if (currentMarketTrends.length === 0) {
    const genres = ["pop", "rock", "hip-hop", "electronic", "country", "jazz"];
    const directions = ["rising", "stable", "falling", "emerging"];
    genres.forEach((genre, index) => {
      const relevantSubGenre = allSubGenres.find((sg) => sg.parentGenre === genre);
      currentMarketTrends.push({
        id: `trend-${genre}-${index}`,
        genreId: genre,
        subGenreId: relevantSubGenre ? relevantSubGenre.id : void 0,
        popularity: randomInt(roll, 30, 99),
        trendDirection: directions[randomInt(roll, 0, directions.length - 1)],
        growthRate: roll() * 10 - 5,
        lastUpdated: 0,
        growth: roll() * 100 - 50,
        events: [],
        duration: 30,
        startDay: 1
      });
    });
  }
};
initializeMockData();

// src/rpg/marketDemand.ts
var RELEASE_DEMAND_POINTS = 6;

// src/rpg/artistCareer.ts
var CAREER_TIERS = ["local", "emerging", "established", "breakout", "prestige"];
var CAREER_POINTS = { local: 0, emerging: 3, established: 8, breakout: 16, prestige: 28 };
var BAND_POINTS = { quiet: 0, solid: 1, breakthrough: 3, prestige: 6 };
var BAND_REPUTATION = { quiet: 0, solid: 1, breakthrough: 3, prestige: 6 };
var RELEASE_CAP = 8;
var careerTierForPoints = (points) => {
  let tier = "local";
  for (const t of CAREER_TIERS) if (points >= CAREER_POINTS[t]) tier = t;
  return tier;
};
var clientCareerTier = (rel2) => careerTierForPoints(rel2?.careerPoints ?? 0);
var outcomeBandFor = (projectId, quality, demandPoints = 0) => {
  const swing = randomInt(createSeededRandom(`release:${projectId}`), -8, 8);
  const score = Math.max(0, Math.min(100, quality)) + swing + Math.max(-RELEASE_DEMAND_POINTS, Math.min(RELEASE_DEMAND_POINTS, demandPoints));
  return score < 45 ? "quiet" : score < 70 ? "solid" : score < 88 ? "breakthrough" : "prestige";
};
function recordRelease(rel2, input) {
  const releases = rel2.releases ?? [];
  if (releases.some((r) => r.projectId === input.projectId)) return rel2;
  const delay = randomInt(createSeededRandom(`release-delay:${input.projectId}`), 2, 5);
  const release = {
    id: `release:${input.projectId}`,
    projectId: input.projectId,
    title: input.title,
    genre: input.genre,
    qualityScore: Math.max(0, Math.min(100, Math.round(input.qualityScore))),
    releaseDay: input.day,
    resolveDay: input.day + delay,
    outcomeBand: outcomeBandFor(input.projectId, input.qualityScore, input.demandPoints ?? 0),
    resolved: false,
    ...input.followUpOf ? { followUpOf: input.followUpOf } : {}
  };
  return { ...rel2, releases: [...releases, release].slice(-RELEASE_CAP) };
}
function resolveDueReleases(relationships, day2) {
  if (!relationships) return { relationships, reputation: 0, notifications: [], labelSignals: [] };
  let reputation = 0;
  const notifications = [];
  const labelSignals = [];
  let changed = false;
  const next = {};
  for (const [key, rel2] of Object.entries(relationships)) {
    const due = (rel2.releases ?? []).filter((r) => !r.resolved && r.resolveDay <= day2);
    if (due.length === 0) {
      next[key] = rel2;
      continue;
    }
    changed = true;
    let points = rel2.careerPoints ?? 0;
    let referrals = rel2.referralCount;
    const releases = (rel2.releases ?? []).map((r) => {
      if (!due.includes(r)) return r;
      points += BAND_POINTS[r.outcomeBand];
      reputation += BAND_REPUTATION[r.outcomeBand];
      if (r.outcomeBand === "breakthrough" || r.outcomeBand === "prestige") referrals += 1;
      labelSignals.push({ genre: r.genre, band: r.outcomeBand, title: r.title, clientName: rel2.clientName });
      if (r.outcomeBand !== "quiet") {
        notifications.push({
          id: `release-${r.id}`,
          message: r.outcomeBand === "solid" ? `${r.title} found a steady audience. ${rel2.clientName} noticed the studio credit.` : `${r.title} is picking up. A strong release from ${rel2.clientName} has brought in a referral.`,
          type: "success",
          timestamp: 0,
          duration: 6e3
        });
      }
      return { ...r, resolved: true };
    });
    const before = clientCareerTier(rel2);
    const nextRel = { ...rel2, releases, careerPoints: points, referralCount: referrals, careerTier: careerTierForPoints(points) };
    if (CAREER_TIERS.indexOf(nextRel.careerTier) > CAREER_TIERS.indexOf(before)) {
      notifications.push({ id: `career-${key}-${nextRel.careerTier}`, message: `${rel2.clientName} is now ${nextRel.careerTier}. Expect bigger work from them.`, type: "info", timestamp: 0, duration: 6e3 });
    }
    next[key] = nextRel;
  }
  return changed ? { relationships: next, reputation, notifications, labelSignals } : { relationships, reputation: 0, notifications: [], labelSignals: [] };
}

// tests/label-interest.check.ts
var n = 0;
var ok = (c, m) => {
  if (!c) throw new Error(`FAIL: ${m}`);
  n++;
  console.log(`PASS: ${m}`);
};
var sig = (genre, band) => ({ genre, band, title: "Glass Rooms", clientName: "Maya Ross" });
ok(labelsForGenre("Hip-Hop").length >= 2, "a genre can interest more than one label");
ok(labelsForGenre("Zydeco").length === 0, "an unknown genre interests no label");
var none = applyLabelSignals(void 0, [sig("Pop", "quiet"), sig("Pop", "solid")]);
ok(none.interest === void 0 && none.notifications.length === 0, "quiet and solid releases do not move labels");
var a = applyLabelSignals(void 0, [sig("Indie", "breakthrough")]);
ok(a.interest?.indie_label_001 === BAND_INTEREST.breakthrough, "a breakthrough indie release warms the indie label");
ok(a.interest?.electronic_label_001 === void 0, "labels outside the genre are untouched");
var interest;
for (let i = 0; i < 40; i++) interest = applyLabelSignals(interest, [sig("Pop", "prestige")]).interest;
ok(Object.values(interest).every((v) => v <= INTEREST_CAP), "interest is capped");
var crossed = 0;
var cur;
for (let i = 0; i < 10; i++) {
  const r = applyLabelSignals(cur, [sig("Indie", "prestige")]);
  cur = r.interest;
  crossed += r.notifications.length;
}
ok(crossed === 3, "each interest line (25/50/75) fires one note, once");
var frozen = JSON.stringify(cur);
applyLabelSignals(cur, [sig("Indie", "prestige")]);
ok(JSON.stringify(cur) === frozen, "applying signals does not mutate the old map");
ok(labelInterestLines(cur)[0].name === "Underground Sounds", "the warmest label lists first");
ok(labelInterestLines(void 0).length === 0, "legacy saves show no labels");
var client = { clientId: "m", clientName: "Maya Ross", primaryGenre: "Indie", relationshipXp: 100, tier: "Friendly", sessionsCompleted: 1, lastSessionDay: 1, bestQualityScore: 95, referralCount: 0 };
var rel = recordRelease(client, { projectId: "p-label", title: "Glass Rooms", genre: "Indie", qualityScore: 99, day: 3 });
var day = rel.releases[0].resolveDay;
var first = resolveDueReleases({ m: rel }, day);
ok(first.labelSignals.length === 1 && first.labelSignals[0].genre === "Indie", "a resolved release emits one label signal");
var again = resolveDueReleases(first.relationships, day + 1);
ok(again.labelSignals.length === 0, "a resolved release never signals twice");
ok(resolveDueReleases(void 0, 5).labelSignals.length === 0, "no relationships means no signals");
console.log(`label-interest: ${n} checks passed`);
