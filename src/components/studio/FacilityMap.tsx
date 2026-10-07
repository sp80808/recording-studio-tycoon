import React, { useMemo, useState } from 'react';
import type { StudioRoom } from '@/types/game';
import { buildFacilityMap, type FacilityRoomStatus } from '@/utils/facilityMap';
import { buildFacilityPlan, doorSwingPath, PLAN_TILE, type PlanFurniture, type PlanRoom } from '@/utils/facilityPlan';

export interface FacilityMapProps {
  /** All rooms, owned and locked. */
  rooms: StudioRoom[];
  activeId: string;
  occupied: ReadonlySet<string>;
  premisesTier?: number;
  playerLevel?: number;
  onSelect: (roomId: string) => void;
}

const STATUS_LABEL: Record<FacilityRoomStatus, string> = { viewing: 'you are here', booked: 'in session', free: 'free', locked: 'locked' };
/** Blueprint palette: chalk walls on drafting blue, one status colour per room. */
const INK = '#e9dfc7';
/** Drafting-blue halo so labels stay legible over furniture lines. */
const HALO = { stroke: '#0f2236', strokeWidth: 2.2, strokeLinejoin: 'round' as const, style: { paintOrder: 'stroke' as const } };
const STATUS_TINT: Record<FacilityRoomStatus, { fill: string; text: string }> = {
  viewing: { fill: 'rgba(252,211,77,0.20)', text: '#fcd34d' },
  booked: { fill: 'rgba(248,113,113,0.16)', text: '#fca5a5' },
  free: { fill: 'rgba(52,211,153,0.08)', text: '#6ee7b7' },
  locked: { fill: 'rgba(15,23,42,0.55)', text: '#94a3b8' },
};

/** One furniture symbol, drawn the way an architect's plan would show it. */
const Furniture: React.FC<{ f: PlanFurniture; dim: boolean }> = ({ f, dim }) => {
  const stroke = dim ? 'rgba(233,223,199,0.25)' : 'rgba(233,223,199,0.7)';
  const sw = 0.7;
  const cx = f.x + f.w / 2;
  const cy = f.y + f.h / 2;
  const r = Math.min(f.w, f.h) / 2;
  const faders = Math.max(2, Math.floor(f.w / 4));
  switch (f.kind) {
    case 'rug':
      return <rect x={f.x + 1} y={f.y + 1} width={Math.max(0, f.w - 2)} height={Math.max(0, f.h - 2)} rx={1.5} fill="none" stroke={stroke} strokeWidth={0.5} strokeDasharray="2 1.5" opacity={0.6} />;
    case 'console':
    case 'desk':
      return (
        <g>
          <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={1} fill="rgba(233,223,199,0.10)" stroke={stroke} strokeWidth={sw} />
          {Array.from({ length: faders }, (_, i) => {
            const fx = f.x + ((i + 0.5) * f.w) / faders;
            return <line key={i} x1={fx} x2={fx} y1={f.y + f.h * 0.3} y2={f.y + f.h * 0.8} stroke={stroke} strokeWidth={0.4} />;
          })}
        </g>
      );
    case 'sofa':
      return (
        <g>
          <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={1.5} fill="rgba(233,223,199,0.08)" stroke={stroke} strokeWidth={sw} />
          {f.w >= f.h
            ? <line x1={f.x + 1} x2={f.x + f.w - 1} y1={f.y + f.h * 0.35} y2={f.y + f.h * 0.35} stroke={stroke} strokeWidth={0.5} />
            : <line y1={f.y + 1} y2={f.y + f.h - 1} x1={f.x + f.w * 0.35} x2={f.x + f.w * 0.35} stroke={stroke} strokeWidth={0.5} />}
        </g>
      );
    case 'drumKit':
      return (
        <g fill="none" stroke={stroke} strokeWidth={sw}>
          <circle cx={cx} cy={cy + r * 0.25} r={r * 0.42} />
          <circle cx={cx - r * 0.55} cy={cy - r * 0.35} r={r * 0.26} />
          <circle cx={cx + r * 0.55} cy={cy - r * 0.35} r={r * 0.26} />
          <circle cx={cx - r * 0.8} cy={cy + r * 0.55} r={r * 0.18} />
          <circle cx={cx + r * 0.8} cy={cy + r * 0.55} r={r * 0.18} />
        </g>
      );
    case 'plant':
      return <g fill="none" stroke="rgba(110,231,183,0.7)" strokeWidth={0.6}><circle cx={cx} cy={cy} r={r} /><path d={`M ${cx - r} ${cy} L ${cx + r} ${cy} M ${cx} ${cy - r} L ${cx} ${cy + r}`} /></g>;
    case 'lamp':
      return <g fill="none" stroke="rgba(252,211,77,0.75)" strokeWidth={0.6}><circle cx={cx} cy={cy} r={r} /><path d={`M ${cx - r * 0.7} ${cy - r * 0.7} L ${cx + r * 0.7} ${cy + r * 0.7} M ${cx + r * 0.7} ${cy - r * 0.7} L ${cx - r * 0.7} ${cy + r * 0.7}`} /></g>;
    case 'micStand':
    case 'micBoom':
    case 'headphoneStand':
      return <g><circle cx={cx} cy={cy} r={Math.max(1.6, r * 0.7)} fill="none" stroke={stroke} strokeWidth={sw} /><circle cx={cx} cy={cy} r={0.9} fill={stroke} /></g>;
    case 'booth':
      return (
        <g>
          <rect x={f.x} y={f.y} width={f.w} height={f.h} fill="rgba(125,211,252,0.10)" stroke={stroke} strokeWidth={sw} />
          {/* Double glass line along the control-room side */}
          <line x1={f.x} x2={f.x + f.w} y1={f.y + f.h - 1.2} y2={f.y + f.h - 1.2} stroke="rgba(125,211,252,0.8)" strokeWidth={0.5} />
          <circle cx={f.x + f.w / 2} cy={f.y + f.h / 2 - 1} r={1.6} fill="none" stroke={stroke} strokeWidth={0.6} />
        </g>
      );
    case 'bassTrap':
      return <path d={`M ${f.x} ${f.y} L ${f.x + f.w} ${f.y} L ${f.x} ${f.y + f.h} Z`} fill="rgba(233,223,199,0.15)" stroke={stroke} strokeWidth={0.5} />;
    case 'nearfield':
      return <g><rect x={f.x} y={f.y} width={f.w} height={f.h} fill="rgba(233,223,199,0.18)" stroke={stroke} strokeWidth={0.5} /><circle cx={cx} cy={cy} r={r * 0.5} fill="none" stroke={stroke} strokeWidth={0.4} /></g>;
    default:
      // Racks, shelves, amps, stage boxes: a hatched cabinet.
      return (
        <g>
          <rect x={f.x} y={f.y} width={f.w} height={f.h} fill="rgba(233,223,199,0.12)" stroke={stroke} strokeWidth={sw} />
          <path d={`M ${f.x} ${f.y + f.h} L ${f.x + f.w} ${f.y}`} stroke={stroke} strokeWidth={0.4} />
        </g>
      );
  }
};

const RoomShape: React.FC<{ room: PlanRoom; onSelect: (id: string) => void }> = ({ room, onSelect }) => {
  const tint = STATUS_TINT[room.status];
  const locked = room.status === 'locked';
  const door = doorSwingPath(room.door);
  const activate = () => { if (room.clickable) onSelect(room.id); };
  const pad = 2.5;
  return (
    <g
      role="button"
      tabIndex={room.clickable ? 0 : -1}
      aria-disabled={room.clickable ? undefined : true}
      aria-current={room.status === 'viewing' ? 'true' : undefined}
      aria-label={`${room.name}: ${locked ? room.lockedReason ?? 'locked' : STATUS_LABEL[room.status]}`}
      data-room={room.id}
      data-status={room.status}
      onClick={activate}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } }}
      className={`facility-room ${room.clickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
    >
      <rect x={room.x} y={room.y} width={room.w} height={room.h} fill={tint.fill} />
      {room.furniture.map((f, i) => <Furniture key={i} f={f} dim={locked} />)}
      {locked && <rect x={room.x} y={room.y} width={room.w} height={room.h} fill="url(#plan-hatch)" />}
      {/* Walls with the door gap cut out of the corridor side */}
      <rect className="facility-room-outline" x={room.x} y={room.y} width={room.w} height={room.h} fill="none" stroke={INK} strokeWidth={1.6} />
      <line x1={room.door.hingeX} x2={room.door.hingeX + room.door.width} y1={room.door.y} y2={room.door.y} stroke="#0f2236" strokeWidth={2.4} />
      <path d={door.leaf} stroke={INK} strokeWidth={0.9} />
      <path d={door.arc} fill="none" stroke={INK} strokeWidth={0.4} strokeDasharray="1.2 1" />
      {/* Labels */}
      <text x={room.x + pad} y={room.y + pad + 6} fill={INK} fontSize={6.4} fontWeight={800} letterSpacing={0.4} {...HALO}>{room.name.toUpperCase()}</text>
      <text x={room.x + pad} y={room.y + pad + 12.5} fill={tint.text} fontSize={5} fontWeight={700} {...HALO}>
        {locked ? room.lockedReason ?? 'Locked' : STATUS_LABEL[room.status]}
      </text>
      <text x={room.x + room.w - pad} y={room.y + room.h - pad} fill="rgba(233,223,199,0.45)" fontSize={4.2} textAnchor="end">{room.tilesW} × {room.tilesD}</text>
      {room.status === 'booked' && (
        <g transform={`translate(${room.x + pad} ${room.y + pad + 15})`}>
          <rect width={14} height={6} rx={1} fill="#7f1d1d" stroke="#fca5a5" strokeWidth={0.4} />
          <circle className="facility-onair" cx={2.6} cy={3} r={1.3} fill="#f87171" />
          <text x={8.6} y={4.5} fontSize={3.6} fill="#fee2e2" fontWeight={800} textAnchor="middle">ON AIR</text>
        </g>
      )}
      {room.status === 'viewing' && (
        <g transform={`translate(${room.x + room.w / 2} ${room.y + room.h / 2})`} className="facility-pin">
          <circle r={4.2} fill="rgba(252,211,77,0.25)" />
          <path d="M 0 2.6 C -2.8 -0.6 -2.8 -2.2 -2.8 -3 A 2.8 2.8 0 1 1 2.8 -3 C 2.8 -2.2 2.8 -0.6 0 2.6 Z" fill="#fcd34d" stroke="#78350f" strokeWidth={0.5} />
          <circle cy={-3} r={1} fill="#78350f" />
        </g>
      )}
      {locked && (
        <g transform={`translate(${room.x + room.w / 2} ${room.y + room.h / 2 + 2})`} opacity={0.85}>
          <path d="M -2.2 -2 L -2.2 -3.6 A 2.2 2.2 0 0 1 2.2 -3.6 L 2.2 -2" fill="none" stroke="#cbd5e1" strokeWidth={0.8} />
          <rect x={-3.2} y={-2} width={6.4} height={4.8} rx={0.8} fill="#cbd5e1" />
        </g>
      )}
    </g>
  );
};

/** Blueprint floor plan of the whole facility (#248). Shows locked rooms with why, and jumps to any owned room. */
export const FacilityMap: React.FC<FacilityMapProps> = ({ rooms, activeId, occupied, premisesTier, playerLevel, onSelect }) => {
  const [open, setOpen] = useState(false);
  const cells = useMemo(() => buildFacilityMap(rooms, { activeId, occupied, premisesTier, playerLevel }), [rooms, activeId, occupied, premisesTier, playerLevel]);
  const plan = useMemo(() => buildFacilityPlan(cells, rooms), [cells, rooms]);
  const T = PLAN_TILE;
  return (
    <div className="absolute left-2 top-[12.5rem] z-[9] sm:top-12" data-testid="facility-map">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Facility map"
        className="min-h-9 rounded-full border border-stone-600 bg-black/55 px-3 text-[11px] font-bold uppercase tracking-wider text-stone-200 backdrop-blur-sm hover:bg-white/10"
      >
        Map
      </button>
      {open && (
        <div className="facility-plan mt-1 w-72 max-w-[calc(100vw-1rem)] rounded-lg border border-sky-900/80 bg-[#0f2236]/95 p-2 shadow-xl backdrop-blur-sm" role="group" aria-label="Studio floorplan">
          <svg viewBox={`0 0 ${plan.width} ${plan.height + 10}`} className="block h-auto w-full" style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
            <defs>
              <pattern id="plan-grid" width={T} height={T} patternUnits="userSpaceOnUse">
                <path d={`M ${T} 0 L 0 0 0 ${T}`} fill="none" stroke="rgba(148,197,255,0.10)" strokeWidth={0.4} />
              </pattern>
              <pattern id="plan-hatch" width={4} height={4} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1={0} y1={0} x2={0} y2={4} stroke="rgba(148,163,184,0.35)" strokeWidth={0.8} />
              </pattern>
            </defs>
            <rect width={plan.width} height={plan.height} fill="url(#plan-grid)" />
            {/* Building shell and the shared corridor */}
            <rect x={0.8} y={0.8} width={plan.width - 1.6} height={plan.height - 1.6} fill="none" stroke={INK} strokeWidth={2.2} opacity={0.9} />
            <rect x={plan.corridor.x} y={plan.corridor.y} width={plan.corridor.w} height={plan.corridor.h} fill="rgba(233,223,199,0.05)" />
            <line x1={plan.corridor.x + 4} x2={plan.corridor.x + plan.corridor.w - 4} y1={plan.corridor.y + plan.corridor.h / 2} y2={plan.corridor.y + plan.corridor.h / 2} stroke="rgba(233,223,199,0.25)" strokeWidth={0.5} strokeDasharray="3 2" />
            <text x={plan.width / 2} y={plan.corridor.y + plan.corridor.h / 2 + 1.6} fill="rgba(233,223,199,0.55)" fontSize={4.4} textAnchor="middle" letterSpacing={1.2} style={{ paintOrder: 'stroke' }} stroke="#0f2236" strokeWidth={2.4}>CORRIDOR</text>
            {/* Street entrance at the corridor's left end */}
            <line x1={0.8} x2={0.8} y1={plan.corridor.y + 2} y2={plan.corridor.y + plan.corridor.h - 2} stroke="#0f2236" strokeWidth={3} />
            <path d={`M 2 ${plan.corridor.y + plan.corridor.h / 2} l 5 -2.4 l 0 4.8 z`} fill="rgba(233,223,199,0.7)" />
            {plan.rooms.map((room) => <RoomShape key={room.id} room={room} onSelect={(id) => { onSelect(id); setOpen(false); }} />)}
            {/* Scale bar: 1 tile */}
            <g transform={`translate(4 ${plan.height + 5})`} fill="rgba(233,223,199,0.6)" fontSize={3.8}>
              <line x1={0} x2={T * 2} y1={0} y2={0} stroke="rgba(233,223,199,0.6)" strokeWidth={0.6} />
              <line x1={0} x2={0} y1={-1.5} y2={1.5} stroke="rgba(233,223,199,0.6)" strokeWidth={0.6} />
              <line x1={T * 2} x2={T * 2} y1={-1.5} y2={1.5} stroke="rgba(233,223,199,0.6)" strokeWidth={0.6} />
              <text x={T * 2 + 3} y={1.4}>2 tiles</text>
            </g>
          </svg>
        </div>
      )}
    </div>
  );
};
