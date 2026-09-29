// v1 premium catalogue — Flight Case Monetisation (bead 89o.2).
// Every product is fully previewable: `preview.items` is the exact value
// delivered (or the exact options for choose-1-of-3). No prices here —
// localisation comes from the PurchaseProvider at runtime.
// Collector equipment variants are cosmetic-only and stat-equivalent to
// their base item; the `ref` format "baseId~variantId" resolves against
// equipmentArt (base stats) + a cosmetic faceplate override.

import type { StoreProduct } from './types';

export const V1_CATALOGUE: StoreProduct[] = [
  {
    id: 'livery-sunburst-flight-crate',
    sku: 'rst.case_cosmetic.sunburst_livery_v1',
    type: 'case_cosmetic',
    title: 'Sunburst Flight-Crate Livery',
    description:
      'Amber sunburst lacquer with cream edge binding for any Vintage Flight Crate. Pure paint — zero stat changes.',
    preview: {
      tagline: 'Exactly this livery, nothing else.',
      items: [
        { label: 'Sunburst livery (vintage_flight_case)', kind: 'flight_case_tier', ref: 'vintage_flight_case:sunburst', icon: '🎛️' },
      ],
      chooseOneOfMany: false,
    },
    entitlements: [{ entitlementId: 'livery-sunburst', kind: 'case_livery', ref: 'vintage_flight_case:sunburst' }],
  },
  {
    id: 'stickers-tour-vol1',
    sku: 'rst.case_cosmetic.tour_stickers_v1',
    type: 'case_cosmetic',
    title: 'Tour Sticker Pack Vol. 1',
    description:
      'Six road-crew stickers for any flight case: lightning bolt, VU meter, crew pass, city tags. Slotted onto cases, never consumed by gameplay.',
    preview: {
      tagline: 'All six stickers, previewed on your current case.',
      items: [
        { label: 'Lightning bolt sticker', kind: 'flight_case_tier', ref: 'sticker:lightning', icon: '⚡' },
        { label: 'VU meter sticker', kind: 'flight_case_tier', ref: 'sticker:vu_meter', icon: '🎚️' },
        { label: 'Crew pass sticker', kind: 'flight_case_tier', ref: 'sticker:crew_pass', icon: '🎫' },
        { label: 'Gold record sticker', kind: 'flight_case_tier', ref: 'sticker:gold_record', icon: '📀' },
        { label: 'On-air sticker', kind: 'flight_case_tier', ref: 'sticker:on_air', icon: '🔴' },
        { label: '70s stripe sticker', kind: 'flight_case_tier', ref: 'sticker:seventies_stripe', icon: '🌈' },
      ],
      chooseOneOfMany: false,
    },
    entitlements: [{ entitlementId: 'stickers-tour-vol1', kind: 'sticker_set', ref: 'tour_vol1' }],
  },
  {
    id: 'decor-control-room-dressing',
    sku: 'rst.studio_pack.control_room_v1',
    type: 'studio_pack',
    title: 'Control Room Dressing Pack',
    description:
      'Rug, lava lamp, framed gold disc and shelf plant for the isometric studio. Décor only — rooms earn the same.',
    preview: {
      tagline: 'These four décor pieces, placed or stashed.',
      items: [
        { label: 'Persian control-room rug', kind: 'decor', ref: 'decor:rug_persian', icon: '🧶' },
        { label: 'Lava lamp (amber)', kind: 'decor', ref: 'decor:lava_lamp', icon: '🪔' },
        { label: 'Framed gold disc', kind: 'decor', ref: 'decor:gold_disc_frame', icon: '🖼️' },
        { label: 'Shelf plant', kind: 'decor', ref: 'decor:shelf_plant', icon: '🪴' },
      ],
      chooseOneOfMany: false,
    },
    entitlements: [{ entitlementId: 'decor-control-room', kind: 'decor_bundle', ref: 'control_room_v1' }],
  },
  {
    id: 'collection-seventies-analog',
    sku: 'rst.curated_case.seventies_analog_v1',
    type: 'curated_case',
    title: '1970s Analog Collection',
    description:
      'A fixed, fully disclosed set of 70s-flavoured collector finishes for gear you already own. Nostalgia, no RNG.',
    preview: {
      tagline: 'All three finishes, exactly as shown.',
      items: [
        { label: 'Walnut-cheek console finish', kind: 'equipment_variant', ref: 'ssl_4000_console~walnut_70s', icon: '🎚️' },
        { label: 'Cream 808 faceplate', kind: 'equipment_variant', ref: 'drum_machine_808~cream_70s', icon: '🥁' },
        { label: 'Gold-foil ribbon mic badge', kind: 'equipment_variant', ref: 'ribbon_vintage_mic~goldfoil_70s', icon: '🎤' },
      ],
      chooseOneOfMany: false,
    },
    entitlements: [
      { entitlementId: 'collector-walnut-70s', kind: 'collector_variant', ref: 'ssl_4000_console~walnut_70s' },
      { entitlementId: 'collector-cream-808', kind: 'collector_variant', ref: 'drum_machine_808~cream_70s' },
      { entitlementId: 'collector-goldfoil-ribbon', kind: 'collector_variant', ref: 'ribbon_vintage_mic~goldfoil_70s' },
    ],
  },
  {
    id: 'reveal-gold-vu',
    sku: 'rst.case_cosmetic.gold_vu_reveal_v1',
    type: 'case_cosmetic',
    title: 'Gold VU Reveal Style',
    description:
      'Alternate case-opening presentation: gold lighting, VU-needle sweep SFX and a slower lid rise. Skippable, reduced-motion aware.',
    preview: {
      tagline: 'This reveal style, previewed on a demo case.',
      items: [{ label: 'Gold VU reveal style', kind: 'reveal_style', ref: 'reveal:gold_vu', icon: '✨' }],
      chooseOneOfMany: false,
    },
    entitlements: [{ entitlementId: 'reveal-gold-vu', kind: 'reveal_style', ref: 'reveal:gold_vu' }],
  },
  {
    id: 'collector-fairychild-gold',
    sku: 'rst.curated_case.fairychild_gold_v1',
    type: 'curated_case',
    title: 'Fairychild Gold Faceplate (Collector)',
    description:
      'Gold faceplate for the Fairychild Compressor you own. Identical gameplay stats to the base unit — the flex is the finish.',
    preview: {
      tagline: 'This single finish for fairychild_comp.',
      items: [{ label: 'Gold faceplate (fairychild_comp)', kind: 'equipment_variant', ref: 'fairychild_comp~gold_face', icon: '⚙️' }],
      chooseOneOfMany: false,
    },
    entitlements: [{ entitlementId: 'collector-fairychild-gold', kind: 'collector_variant', ref: 'fairychild_comp~gold_face' }],
  },
  {
    id: 'hardware-pick-trio-v1',
    sku: 'rst.curated_case.pick_trio_v1',
    type: 'curated_case',
    title: 'Engineer’s Pick Trio — Choose 1 of 3',
    description:
      'Three disclosed collector finishes; you choose exactly one at claim time. Customer choice, no blind roll.',
    preview: {
      tagline: 'Preview all three — take one home.',
      items: [
        { label: 'Neon-grid synth skin', kind: 'equipment_variant', ref: 'moog_or_less~neon_grid', icon: '🎹' },
        { label: 'Roadworn Tele finish', kind: 'equipment_variant', ref: 'fender_bender~roadworn_sun', icon: '🎸' },
        { label: 'Studio-black 1176 rack ears', kind: 'equipment_variant', ref: 'urei_1176_compressor~studio_black', icon: '🎛️' },
      ],
      chooseOneOfMany: true,
    },
    entitlements: [{ entitlementId: 'pick-trio-v1-choice', kind: 'curated_case_access', ref: 'pick_trio_v1' }],
  },
  {
    id: 'supporter-road-crew',
    sku: 'rst.supporter_pack.road_crew_v1',
    type: 'supporter_pack',
    title: 'Road Crew Supporter Bundle',
    description:
      'Support the studio fund: sunburst livery, tour stickers and the gold Fairychild faceplate in one bundle. Cosmetics + collector finish, nothing gameplay-gated.',
    preview: {
      tagline: 'All three contents, exactly as shown.',
      items: [
        { label: 'Sunburst livery (vintage_flight_case)', kind: 'flight_case_tier', ref: 'vintage_flight_case:sunburst', icon: '🎛️' },
        { label: 'Tour Sticker Pack Vol. 1 (6 stickers)', kind: 'flight_case_tier', ref: 'sticker:tour_vol1', icon: '✨' },
        { label: 'Gold faceplate (fairychild_comp)', kind: 'equipment_variant', ref: 'fairychild_comp~gold_face', icon: '⚙️' },
      ],
      chooseOneOfMany: false,
    },
    entitlements: [
      { entitlementId: 'livery-sunburst', kind: 'case_livery', ref: 'vintage_flight_case:sunburst' },
      { entitlementId: 'stickers-tour-vol1', kind: 'sticker_set', ref: 'tour_vol1' },
      { entitlementId: 'collector-fairychild-gold', kind: 'collector_variant', ref: 'fairychild_comp~gold_face' },
    ],
  },
];

/** Catalogue integrity: unique product ids, SKUs and entitlement ids. */
export function validateCatalogue(products: StoreProduct[] = V1_CATALOGUE): string[] {
  const errors: string[] = [];
  const seen = new Map<string, string>();
  const claim = (key: string, what: string, where: string) => {
    const prev = seen.get(key);
    if (prev) errors.push(`duplicate ${what} "${key}" in ${where} (already in ${prev})`);
    else seen.set(key, where);
  };
  for (const p of products) {
    if (!p.id || !p.sku) errors.push(`product missing id/sku: ${JSON.stringify(p.id)}`);
    claim(`product:${p.id}`, 'product id', p.id);
    claim(`sku:${p.sku}`, 'sku', p.id);
    if (p.preview.items.length === 0) errors.push(`product ${p.id} has empty preview (v1 forbids hidden contents)`);
    if (p.entitlements.length === 0) errors.push(`product ${p.id} grants nothing`);
    // Entitlement ids are unique WITHIN a product; repeating across products
    // is intentional (bundles re-grant the same ownership — first purchase
    // wins lineage in the ledger).
    const local = new Set<string>();
    for (const e of p.entitlements) {
      if (local.has(e.entitlementId)) errors.push(`duplicate entitlement id "${e.entitlementId}" in ${p.id}`);
      local.add(e.entitlementId);
    }
  }
  return errors;
}

export function getProductBySku(sku: string, products: StoreProduct[] = V1_CATALOGUE): StoreProduct | undefined {
  return products.find((p) => p.sku === sku);
}
