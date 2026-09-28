import React from 'react';

export const STUDIO_SPRITE_IDS = [
  'character-producer',
  'character-artist',
  'mixing-console',
  'nearfield-monitor',
  'daw-monitor',
  'reel-to-reel',
  'vintage-microphone',
  'outboard-rack',
  'record-shelf',
  'floor-lamp',
  'studio-chair',
  'acoustic-panel',
  'studio-sofa',
  'potted-plant',
  'headphones',
] as const;

export type StudioSpriteId = typeof STUDIO_SPRITE_IDS[number];

interface StudioSpriteProps extends Omit<React.SVGProps<SVGSVGElement>, 'id'> {
  id: StudioSpriteId;
  size?: number | string;
  title?: string;
}

export const StudioSprite: React.FC<StudioSpriteProps> = ({
  id,
  size = 128,
  title,
  className,
  ...props
}) => (
  <svg
    viewBox="0 0 256 256"
    width={size}
    height={size}
    className={className}
    role={title ? 'img' : undefined}
    aria-hidden={title ? undefined : true}
    focusable="false"
    {...props}
  >
    {title && <title>{title}</title>}
    <use href={`/art/studio/studio-sprites.svg#${id}`} />
  </svg>
);
