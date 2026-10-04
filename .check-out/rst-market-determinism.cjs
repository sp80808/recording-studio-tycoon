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
  let state2 = hashSeed(seed);
  return () => {
    state2 += 1831565813;
    let value = state2;
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
var getSubGenreById = (id) => {
  return subGenres.find((sg) => sg.id === id);
};

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
var resetMarketTrends = (seed = "initial") => {
  currentMarketTrends = [];
  initializeMockData(createSeededRandom(`market:${seed}`));
};
var MAX_REPLAY_DAYS = 3650;
var marketTrendsAt = (seed, day) => {
  const saved = currentMarketTrends;
  try {
    resetMarketTrends(seed);
    let trends = [...currentMarketTrends];
    for (let d = 1; d <= Math.min(MAX_REPLAY_DAYS, Math.max(0, Math.floor(day))); d++) {
      trends = marketService.updateAllMarketTrends({ saveSeed: seed, currentDay: d });
    }
    return trends;
  } finally {
    currentMarketTrends = saved;
  }
};
var marketService = {
  updateAllMarketTrends: (gameState, playerProjectsCompletedSinceLastUpdate = [], globalEventsHappenedSinceLastUpdate = []) => {
    const roll = createSeededRandom(`${gameState.saveSeed ?? "market"}:market:${gameState.currentDay}`);
    currentMarketTrends = currentMarketTrends.map((trend) => {
      let newPopularity = trend.popularity;
      let newGrowthRate = trend.growthRate;
      let newTrendDirection = trend.trendDirection;
      newPopularity += trend.growthRate * (roll() * 0.5 + 0.75);
      newGrowthRate += (roll() * 2 - 1) * 0.5;
      playerProjectsCompletedSinceLastUpdate.forEach((project) => {
        if (project.genre === trend.genreId && project.qualityScore && project.qualityScore > 70) {
          newPopularity += project.qualityScore / 20;
          newGrowthRate += project.qualityScore / 100;
        }
      });
      globalEventsHappenedSinceLastUpdate.forEach((event) => {
        if (event.affectedGenres.includes(trend.genreId)) {
          newPopularity += event.impact / 2;
          newGrowthRate += event.impact / 10;
        }
      });
      newPopularity = Math.max(5, Math.min(100, newPopularity));
      newGrowthRate = Math.max(-10, Math.min(10, newGrowthRate));
      if (newGrowthRate > 3) newTrendDirection = "rising";
      else if (newGrowthRate < -3) newTrendDirection = "falling";
      else if (newPopularity > 80 && newGrowthRate >= 0) newTrendDirection = "stable";
      else if (newPopularity < 20 && newGrowthRate <= 0) newTrendDirection = "fading";
      else if (newPopularity < 30 && newGrowthRate > 1) newTrendDirection = "emerging";
      else newTrendDirection = "stable";
      return {
        ...trend,
        popularity: Math.round(newPopularity),
        growthRate: parseFloat(newGrowthRate.toFixed(2)),
        trendDirection: newTrendDirection,
        lastUpdated: gameState.currentDay,
        growth: Math.round(newGrowthRate * 10)
      };
    });
    return [...currentMarketTrends];
  },
  getCurrentPopularity: (genreId, subGenreId) => {
    let relevantTrend;
    if (subGenreId) {
      relevantTrend = currentMarketTrends.find(
        (trend) => trend.genreId === genreId && trend.subGenreId === subGenreId
      );
    }
    if (!relevantTrend) {
      relevantTrend = currentMarketTrends.find(
        (trend) => trend.genreId === genreId && !trend.subGenreId
      );
    }
    if (!relevantTrend) {
      const genericTrend = currentMarketTrends.find((trend) => trend.genreId === genreId);
      return genericTrend?.popularity || 50;
    }
    return relevantTrend.popularity;
  },
  getAllTrends: () => {
    return [...currentMarketTrends];
  },
  getAllSubGenres: () => {
    return [...subGenres];
  },
  getSubGenreById: (subGenreId) => {
    return getSubGenreById(subGenreId);
  }
};

// tests/market-determinism.check.ts
var n = 0;
var ok = (c, m) => {
  if (!c) throw new Error(`FAIL: ${m}`);
  n++;
  console.log(`PASS: ${m}`);
};
var state = (day, seed = 7) => ({ saveSeed: seed, currentDay: day });
var run = (seed, days) => {
  resetMarketTrends(seed);
  let t2 = marketService.getAllTrends();
  for (let d = 1; d <= days; d++) t2 = marketService.updateAllMarketTrends(state(d, seed));
  return JSON.stringify(t2);
};
ok(run(7, 20) === run(7, 20), "same seed and days give identical trends");
ok(run(7, 20) !== run(8, 20), "different seeds differ");
resetMarketTrends(3);
ok(JSON.stringify(marketService.getAllTrends()) === (resetMarketTrends(3), JSON.stringify(marketService.getAllTrends())), "reset is repeatable");
var t = marketService.getAllTrends();
for (let d = 1; d <= 200; d++) t = marketService.updateAllMarketTrends(state(d));
ok(t.every((x) => x.popularity >= 5 && x.popularity <= 100 && Math.abs(x.growthRate) <= 10), "trend effects stay bounded over 200 days");
ok(t.every((x) => x.lastUpdated === 200 && !x.id.includes("NaN")), "trends are stamped with the game day, not the wall clock");
resetMarketTrends(11);
var before = JSON.stringify(marketService.getAllTrends());
var d40 = JSON.stringify(marketTrendsAt(5, 40));
ok(JSON.stringify(marketService.getAllTrends()) === before, "deriving a market leaves the shared store untouched");
ok(d40 === JSON.stringify(marketTrendsAt(5, 40)), "the market on a given save and day is repeatable");
ok(d40 !== JSON.stringify(marketTrendsAt(5, 41)) && d40 !== JSON.stringify(marketTrendsAt(6, 40)), "a different day or save gives a different market");
ok(JSON.stringify(marketTrendsAt(5, 0)) === (resetMarketTrends(5), JSON.stringify(marketService.getAllTrends())), "day zero is the seeded start");
console.log(`market-determinism: ${n} checks passed`);
