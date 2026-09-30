import React, { useMemo } from 'react';
import { motion, type TargetAndTransition, type Transition } from 'framer-motion';
import { ModularNpcDefinition } from './spriteTypes';
import { NpcAnimationState, domMotionFor } from './npcAnimation';

interface ModularSpriteRendererProps {
  npc: ModularNpcDefinition;
  animationState?: NpcAnimationState;
  scale?: number; // Scaling factor (default: 3x for 24x36 base pixel sprite)
  className?: string;
  showBadge?: boolean;
}

/**
 * Modular Sprite Renderer
 * Renders the layered pixel-art character dynamically based on the ModularNpcDefinition:
 * 1. Base Shadow
 * 2. Legs / Shoes / Trousers
 * 3. Torso / Clothes Top / Outerwear
 * 4. Arms / Hands / Studio Prop
 * 5. Head / Skin / Face Expression
 * 6. Facial Hair / Hair Cut
 * 7. Accessories (Headphones, Glasses, Chains, Badges)
 */
export const ModularSpriteRenderer: React.FC<ModularSpriteRendererProps> = ({
  npc,
  animationState = 'idle',
  scale = 3,
  className = '',
  showBadge = true,
}) => {
  const { body, hair, clothes, details, roleProps } = npc;

  // Base dimensions: 32x48 virtual pixel canvas
  const width = 32 * scale;
  const height = 48 * scale;

  // Animation variants
  const bobVariants = useMemo((): { animate: TargetAndTransition; transition: Transition } => {
    switch (domMotionFor(animationState)) {
      case 'headbob':
        return {
          animate: { y: [0, -2, 0, 1, 0] },
          transition: { repeat: Infinity, duration: 0.65, ease: 'easeInOut' },
        };
      case 'working':
        return {
          animate: { y: [0, -1, 0], rotate: [-0.5, 0.5, -0.5] },
          transition: { repeat: Infinity, duration: 1.1, ease: 'linear' },
        };
      case 'celebrate':
        return {
          animate: { y: [0, -4, 0], scale: [1, 1.05, 1] },
          transition: { repeat: Infinity, duration: 0.8, ease: 'easeOut' },
        };
      case 'idle':
      default:
        return {
          animate: { y: [0, -1, 0] },
          transition: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' },
        };
    }
  }, [animationState]);

  return (
    <div
      className={`inline-flex flex-col items-center select-none ${className}`}
      style={{ imageRendering: 'pixelated' }}
    >
      <div
        className="relative"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <svg
          viewBox="0 0 32 48"
          width={width}
          height={height}
          className="overflow-visible"
          shapeRendering="crispEdges"
        >
          {/* Layer 1: Ground Contact Shadow */}
          <ellipse cx="16" cy="46" rx="9" ry="2" fill="rgba(0,0,0,0.4)" />

          {/* Root Animated Character Rig */}
          <motion.g animate={bobVariants.animate} transition={bobVariants.transition}>
            {/* Layer 2: Legs & Shoes */}
            {/* Shoes */}
            <rect x="10" y="42" width="4" height="3" fill={clothes.shoesHex} />
            <rect x="18" y="42" width="4" height="3" fill={clothes.shoesHex} />
            {/* Trousers / Lower */}
            <rect x="11" y="29" width="4" height="13" fill={clothes.lowerHex} />
            <rect x="17" y="29" width="4" height="13" fill={clothes.lowerHex} />
            {/* Belt / Waist */}
            <rect x="11" y="28" width="10" height="2" fill="#18181b" />

            {/* Layer 3: Torso / Clothing Top */}
            <rect
              x={body.build === 'stocky' ? 9 : body.build === 'slim' ? 11 : 10}
              y="18"
              width={body.build === 'stocky' ? 14 : body.build === 'slim' ? 10 : 12}
              height="10"
              fill={clothes.topPrimaryHex}
            />
            {/* Collar & Secondary Accent */}
            <rect x="14" y="18" width="4" height="3" fill={clothes.topSecondaryHex} />

            {/* Outerwear (Jackets, Vests) */}
            {clothes.outerwear !== 'none' && (
              <>
                <rect x="8" y="18" width="3" height="11" fill={clothes.outerwearHex || '#1e293b'} />
                <rect x="21" y="18" width="3" height="11" fill={clothes.outerwearHex || '#1e293b'} />
              </>
            )}

            {/* Lapel Badges & Patches */}
            {details.patches && (
              <rect x="11" y="20" width="2" height="2" fill="#eab308" />
            )}

            {/* Layer 4: Arms & Hands */}
            {/* Left Arm */}
            <rect x="7" y="19" width="3" height="8" fill={clothes.topPrimaryHex} />
            <rect x="7" y="27" width="3" height="3" fill={body.skinHex} />

            {/* Right Arm (Holding Studio Role Prop) */}
            <motion.g
              animate={
                domMotionFor(animationState) === 'working'
                  ? { y: [0, -2, 0], x: [0, 1, 0] }
                  : { y: 0, x: 0 }
              }
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              <rect x="22" y="19" width="3" height="8" fill={clothes.topPrimaryHex} />
              <rect x="22" y="27" width="3" height="3" fill={body.skinHex} />

              {/* Studio Role Prop */}
              {roleProps.renderProp === 'mic' && (
                <g transform="translate(24, 25)">
                  <rect x="0" y="0" width="2" height="6" fill="#71717a" />
                  <circle cx="1" cy="-1" r="2" fill="#fbbf24" />
                </g>
              )}
              {roleProps.renderProp === 'clipboard' && (
                <rect x="23" y="26" width="5" height="7" fill="#78350f" rx="0.5" />
              )}
              {roleProps.renderProp === 'synth_controller' && (
                <g transform="translate(23, 26)">
                  <rect x="0" y="0" width="6" height="4" fill="#09090b" />
                  <rect x="1" y="1" width="1.5" height="1" fill="#f59e0b" />
                  <rect x="3.5" y="1" width="1.5" height="1" fill="#3b82f6" />
                </g>
              )}
              {roleProps.renderProp === 'toolbelt' && (
                <rect x="10" y="28" width="12" height="3" fill="#854d0e" />
              )}
            </motion.g>

            {/* Layer 5: Neck & Head */}
            <rect x="14" y="15" width="4" height="3" fill={body.shadowHex} />
            <rect x="11" y="8" width="10" height="9" fill={body.skinHex} />

            {/* Face Details */}
            {/* Eyes */}
            {body.face === 'vintage_shades' || details.glasses !== 'none' ? (
              // Eyewear / Sunglasses
              <g transform="translate(12, 11)">
                <rect
                  x="0"
                  y="0"
                  width="4"
                  height="2.5"
                  fill={details.glasses === 'tinted_aviator' ? '#78350f' : '#09090b'}
                />
                <rect
                  x="5"
                  y="0"
                  width="4"
                  height="2.5"
                  fill={details.glasses === 'tinted_aviator' ? '#78350f' : '#09090b'}
                />
                <rect x="4" y="0.5" width="1" height="0.5" fill="#d4d4d8" />
              </g>
            ) : (
              // Expressive Pixel Eyes
              <g transform="translate(13, 11)">
                <rect x="0" y="0" width="2" height="2" fill="#09090b" />
                <rect x="5" y="0" width="2" height="2" fill="#09090b" />
                {body.face === 'eager' && (
                  <>
                    <rect x="0" y="0" width="1" height="1" fill="#ffffff" />
                    <rect x="5" y="0" width="1" height="1" fill="#ffffff" />
                  </>
                )}
              </g>
            )}

            {/* Nose & Mouth */}
            <rect x="15.5" y="13.5" width="1" height="1" fill={body.shadowHex} />
            <rect
              x="14.5"
              y="15"
              width={body.face === 'ecstatic' ? 3 : 2}
              height="1"
              fill={body.face === 'ecstatic' ? '#dc2626' : body.shadowHex}
            />

            {/* Facial Hair */}
            {hair.facialHair === 'vintage_mustache' && (
              <rect x="13.5" y="14" width="5" height="1.5" fill={hair.hairHex} />
            )}
            {hair.facialHair === 'full_beard' && (
              <path
                d="M 12 14 L 20 14 L 19 17 L 13 17 Z"
                fill={hair.hairHex}
              />
            )}
            {hair.facialHair === 'goatee' && (
              <rect x="14.5" y="15" width="3" height="2" fill={hair.hairHex} />
            )}

            {/* Layer 6: Hair Styling */}
            {hair.shape === 'afro' && (
              <circle cx="16" cy="10" r="7" fill={hair.hairHex} />
            )}
            {hair.shape === 'pompadour' && (
              <path
                d="M 10 9 Q 16 3 22 9 L 21 11 L 11 11 Z"
                fill={hair.hairHex}
              />
            )}
            {hair.shape === 'bob' && (
              <g fill={hair.hairHex}>
                <rect x="10" y="6" width="12" height="4" />
                <rect x="9" y="8" width="3" height="7" />
                <rect x="20" y="8" width="3" height="7" />
              </g>
            )}
            {hair.shape === 'dreads' && (
              <g fill={hair.hairHex}>
                <rect x="10" y="6" width="12" height="4" />
                <rect x="9" y="9" width="2" height="8" />
                <rect x="21" y="9" width="2" height="8" />
                <rect x="11" y="10" width="2" height="6" />
                <rect x="19" y="10" width="2" height="6" />
              </g>
            )}
            {hair.shape === 'slicked' && (
              <rect x="10.5" y="6.5" width="11" height="3" fill={hair.hairHex} />
            )}
            {hair.shape === 'buzzcut' && (
              <rect x="11" y="7" width="10" height="2" fill={hair.hairHex} />
            )}

            {/* Layer 7: Studio Reference Headphones (Over-Ear or Around-Neck) */}
            <g transform="translate(0, 0)">
              {/* Headband */}
              <path
                d="M 10 9 C 10 4, 22 4, 22 9"
                fill="none"
                stroke={details.headphoneColor}
                strokeWidth="1.5"
              />
              {/* Ear Cushions */}
              <rect x="9" y="8" width="2" height="5" fill="#18181b" rx="0.5" />
              <rect x="21" y="8" width="2" height="5" fill="#18181b" rx="0.5" />
              {/* Cord swaying */}
              <motion.path
                d="M 10 13 Q 8 20 12 25"
                fill="none"
                stroke={details.headphoneColor}
                strokeWidth="0.8"
                animate={{
                  d: [
                    'M 10 13 Q 8 20 12 25',
                    'M 10 13 Q 9 20 13 25',
                    'M 10 13 Q 8 20 12 25',
                  ],
                }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              />
            </g>

            {/* Jewellery (Gold Chains) */}
            {details.jewellery === 'gold_chain' && (
              <path
                d="M 13 18 Q 16 21 19 18"
                fill="none"
                stroke="#eab308"
                strokeWidth="1"
              />
            )}
          </motion.g>
        </svg>
      </div>

      {/* Diegetic Studio Tag / Role Badge */}
      {showBadge && (
        <div className="mt-1 text-center font-mono">
          <span className="block text-[11px] font-bold text-stone-200 tracking-wider">
            {npc.name}
          </span>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: roleProps.accentColor }}
            />
            <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold">
              {npc.role} • {npc.era}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
