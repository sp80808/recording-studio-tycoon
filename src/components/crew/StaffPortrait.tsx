import React, { useMemo } from 'react';
import { ModularSpriteRenderer } from '@/features/sprites/ModularSpriteRenderer';
import type { StaffMember } from '@/types/game';
import { eraIdToNpcEra } from '@/features/sprites/staffPortrait';
import { resolveMemberPortrait } from '@/utils/staffRecruitment';

interface StaffPortraitProps {
  member: Pick<StaffMember, 'name' | 'role' | 'appearance' | 'portraitSeed' | 'pieceIds'>;
  eraId?: string;
  year?: number;
  scale?: number;
  className?: string;
  /** Crop to a LinkedIn-style headshot frame. */
  headshot?: boolean;
}

export const StaffPortrait: React.FC<StaffPortraitProps> = ({
  member,
  eraId,
  year,
  scale = 2,
  className = '',
  headshot = true,
}) => {
  const npc = useMemo(
    () => resolveMemberPortrait(member, eraIdToNpcEra(eraId, year)),
    [member, eraId, year],
  );

  if (headshot) {
    return (
      <div
        className={`crew-portrait ${className}`}
        aria-hidden="true"
        title={member.name}
      >
        <div className="crew-portrait__crop">
          <ModularSpriteRenderer npc={npc} scale={scale} showBadge={false} />
        </div>
      </div>
    );
  }

  return (
    <div className={className} aria-hidden="true" title={member.name}>
      <ModularSpriteRenderer npc={npc} scale={scale} showBadge={false} />
    </div>
  );
};
