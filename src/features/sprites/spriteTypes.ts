/**
 * Modular Sprite System Type Definitions
 * Structured along variation dimensions:
 * Body (build, skin, face), Hair (shape, colour, facial hair),
 * Clothes (top, lower, shoes, outerwear),
 * Studio Role (engineer, producer, artist, manager, tech),
 * Era (1960s - modern), and Personality Details.
 */

export type BodyBuild = 'slim' | 'average' | 'stocky';
export type SkinTone = 'fair' | 'warm' | 'olive' | 'tan' | 'deep' | 'rich';
export type FaceExpression = 'focused' | 'eager' | 'chill' | 'stern' | 'ecstatic' | 'vintage_shades';

export type HairShape =
  | 'afro'
  | 'pompadour'
  | 'dreads'
  | 'bob'
  | 'messy_curly'
  | 'slicked'
  | 'buzzcut'
  | 'long_wavy'
  | 'topknot'
  | 'bald';

export type HairColour =
  | 'jet_black'
  | 'dark_brown'
  | 'chestnut'
  | 'auburn'
  | 'bleached_blonde'
  | 'silver_grey'
  | 'neon_pink'
  | 'electric_blue';

export type FacialHair = 'none' | 'clean_stubble' | 'vintage_mustache' | 'full_beard' | 'goatee' | 'sideburns';

export type ClothesTop =
  | 'flannel_shirt'
  | 'band_tee'
  | 'turtleneck'
  | 'leather_jacket'
  | 'tracksuit_jacket'
  | 'oversized_hoodie'
  | 'denim_vest'
  | 'vintage_cardigan';

export type ClothesLower =
  | 'denim_jeans'
  | 'corduroy_trousers'
  | 'bell_bottoms'
  | 'cargo_pants'
  | 'joggers'
  | 'ripped_jeans';

export type ShoesType =
  | 'vintage_sneakers'
  | 'leather_boots'
  | 'creepers'
  | 'hi_tops'
  | 'loafers'
  | 'canvas_skaters';

export type Outerwear = 'none' | 'trenchcoat' | 'bomber' | 'chore_jacket' | 'fleece';

export type StudioRole =
  | 'engineer'     // around-neck headphones, chin pencil / marker
  | 'producer'     // flat cap / beanie, smartwatch, espresso cup
  | 'artist'       // condenser mic in hand / pop-filter aura, sunglasses
  | 'manager'      // leather clipboard, smartphone, laminated lanyard
  | 'tech';        // heavy toolbelt, gaffer tape on wrist, soldering iron holster

export type NpcEra = '1960s' | '1970s' | '1980s' | '1990s' | '2000s' | 'modern';

export type GlassesStyle = 'none' | 'wire_round' | 'horn_rim' | 'wayfarer' | 'tinted_aviator' | 'cyber_visor';

export type Jewellery = 'none' | 'gold_chain' | 'silver_hoops' | 'cassette_pendant' | 'choker';

export type Headwear = 'none' | 'flat_cap' | 'beanie' | 'bucket_hat' | 'bandana' | 'headband';

export interface PersonalityDetails {
  /** Optional so generated NPCs and old saves are unchanged; the player producer sets it. */
  headwear?: Headwear;
  /** Over-ear cans on the head. Absent (legacy) means drawn, as before; `false` hides them. */
  headphones?: boolean;
  glasses: GlassesStyle;
  jewellery: Jewellery;
  patches: boolean;       // Embroidered studio/band patches on outerwear
  pins: string[];         // Lapel pins: ['tape', 'synth', 'peace', 'fire']
  headphoneColor: string; // Hex code for studio monitor cans
}

export interface ModularNpcDefinition {
  id: string;
  seed: number;
  /** Which appearance table version produced this look; saved so old NPCs never change. */
  appearanceVersion: number;
  name: string;
  role: StudioRole;
  era: NpcEra;
  body: {
    build: BodyBuild;
    skinTone: SkinTone;
    skinHex: string;
    shadowHex: string;
    face: FaceExpression;
  };
  hair: {
    shape: HairShape;
    colour: HairColour;
    hairHex: string;
    facialHair: FacialHair;
  };
  clothes: {
    top: ClothesTop;
    topPrimaryHex: string;
    topSecondaryHex: string;
    lower: ClothesLower;
    lowerHex: string;
    shoes: ShoesType;
    shoesHex: string;
    outerwear: Outerwear;
    outerwearHex?: string;
  };
  details: PersonalityDetails;
  roleProps: {
    accessoryName: string;
    renderProp: 'headphones' | 'clipboard' | 'mic' | 'toolbelt' | 'synth_controller';
    accentColor: string;
  };
}

