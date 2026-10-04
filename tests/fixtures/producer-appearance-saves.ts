/**
 * Appearance blobs as older/newer builds persisted them (issue #213). Only `producerCustomization.appearance`
 * is modelled; tests splice each one into a fresh state before running the loader.
 */
/** Pre-expansion: only hair, hair colour, clothes colour, accessory + seed (issue #126 shape). */
export const PRE_EXPANDED = { seed: 777, hair: 'afro', hairColour: 'silver_grey', clothesColour: 'plum', accessory: 'beanie' };
/** Partially populated: expansion shipped but this save only picked some of the new fields. */
export const PARTIAL = { ...PRE_EXPANDED, skinTone: 'deep', shoes: 'creepers' };
/** Fully populated current shape. */
export const FULL = {
  seed: 31337, build: 'stocky', skinTone: 'olive', hair: 'dreads', hairColour: 'electric_blue', shirt: 'leather_jacket',
  pants: 'bell_bottoms', shoes: 'leather_boots', clothesColour: 'cobalt', accessory: 'aviators',
};
/** Unknown enum values and wrong types in every slot. */
export const INVALID = {
  seed: 'abc', build: 'sumo', skinTone: 'green', hair: 'mullet', hairColour: 7, shirt: 'toga', pants: null,
  shoes: {}, clothesColour: 'chartreuse', accessory: 'jetpack',
};
