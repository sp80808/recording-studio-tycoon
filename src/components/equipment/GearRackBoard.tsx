import React, { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { KenneyButton } from '@/components/ui/KenneyButton';
import { Equipment, GameState } from '@/types/game';
import {
  EquipmentSlot,
  INVENTORY_SLOT_ID,
  canSeatEquipment,
  generateDefaultRoomSlots,
  getEquipmentInSlot,
  getInventoryEquipment,
  placeEquipmentInSlot,
} from '@/types/equipmentSlots';
import { getOperationalStudioRooms } from '@/utils/studioRoomUtils';
import { toast } from '@/hooks/use-toast';
import { gameAudio } from '@/utils/audioSystem';
import { cn } from '@/lib/utils';

const dragIdFor = (equipmentId: string) => `equip:${equipmentId}`;
const parseEquipId = (dragId: string | number) =>
  String(dragId).startsWith('equip:') ? String(dragId).slice('equip:'.length) : null;

interface GearRackBoardProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

function DraggableGearChip({
  equipment,
  compact = false,
}: {
  equipment: Equipment;
  compact?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragIdFor(equipment.id),
    data: { equipmentId: equipment.id, equipment },
  });

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        'w-full text-left rounded border border-stone-600 bg-stone-800/80 px-2 py-1.5 cursor-grab active:cursor-grabbing touch-none',
        'hover:border-amber-500/60 hover:bg-stone-700/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400',
        isDragging && 'opacity-40',
        compact && 'py-1'
      )}
      {...listeners}
      {...attributes}
      aria-label={`Drag ${equipment.name}`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="shrink-0 text-sm" aria-hidden>
          {equipment.icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold text-stone-100">{equipment.name}</p>
          {!compact && (
            <p className="truncate text-[10px] text-stone-400 capitalize">{equipment.category}</p>
          )}
        </div>
      </div>
    </button>
  );
}

function DropSlot({
  slot,
  seated,
  onUnequip,
}: {
  slot: EquipmentSlot;
  seated?: Equipment;
  onUnequip: (equipmentId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: slot.id,
    data: { slot },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded border border-dashed border-stone-600 bg-stone-900/60 p-1.5 min-h-[52px] transition-colors',
        isOver && 'border-amber-400 bg-amber-950/40',
        seated && 'border-solid border-stone-500 bg-stone-800/50'
      )}
      data-slot-id={slot.id}
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <p className="text-[10px] uppercase tracking-wide text-stone-400 truncate">{slot.label}</p>
        {seated && (
          <KenneyButton
            size="sm"
            variant="grey"
            className="text-[9px] py-0 px-1.5 h-5"
            onClick={() => onUnequip(seated.id)}
          >
            Rack out
          </KenneyButton>
        )}
      </div>
      {seated ? (
        <DraggableGearChip equipment={seated} compact />
      ) : (
        <p className="text-[10px] text-stone-500 italic">Empty — drop compatible gear</p>
      )}
    </div>
  );
}

function InventoryTray({
  items,
}: {
  items: Equipment[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: INVENTORY_SLOT_ID,
    data: { inventory: true },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-lg border border-stone-700 bg-stone-950/60 p-2 space-y-1.5 min-h-[72px]',
        isOver && 'border-amber-400 bg-stone-950/30'
      )}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-bold text-white">Inventory tray</h4>
        <span className="text-[10px] text-stone-400">{items.length} loose</span>
      </div>
      {items.length === 0 ? (
        <p className="text-[10px] text-stone-500">All gear is seated in room slots.</p>
      ) : (
        <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-0.5">
          {items.map((item) => (
            <DraggableGearChip key={item.id} equipment={item} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Drag-and-drop gear racks for seating owned equipment into room chassis slots
 * (bead 8om / #30). Placement is slot-id based — no pixel coordinates in saves.
 */
export const GearRackBoard: React.FC<GearRackBoardProps> = ({ gameState, setGameState }) => {
  const unlockedRooms = getOperationalStudioRooms(gameState);
  const [roomId, setRoomId] = useState(unlockedRooms[0]?.id ?? 'studio-a');
  const [activeEquipId, setActiveEquipId] = useState<string | null>(null);

  useEffect(() => {
    if (!unlockedRooms.some((room) => room.id === roomId)) {
      setRoomId(unlockedRooms[0]?.id ?? 'studio-a');
    }
  }, [unlockedRooms, roomId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const roomSlots = useMemo(() => generateDefaultRoomSlots(roomId), [roomId]);
  const rackSlots = roomSlots.filter((s) => s.slotType === 'rack_outboard');
  const micSlots = roomSlots.filter((s) => s.slotType === 'mic_locker');
  const deskSlots = roomSlots.filter((s) => s.slotType === 'workstation_desk');

  const placements = useMemo(
    () => gameState.equipmentPlacements ?? [],
    [gameState.equipmentPlacements]
  );
  const inventory = useMemo(
    () => getInventoryEquipment(gameState.ownedEquipment, placements),
    [gameState.ownedEquipment, placements]
  );

  const activeEquipment = activeEquipId
    ? gameState.ownedEquipment.find((e) => e.id === activeEquipId)
    : undefined;

  const seatEquipment = (equipmentId: string, targetSlotId: string | null) => {
    const equipment = gameState.ownedEquipment.find((e) => e.id === equipmentId);
    if (!equipment) return;

    if (targetSlotId && targetSlotId !== INVENTORY_SLOT_ID) {
      const slot = roomSlots.find((s) => s.id === targetSlotId);
      // Allow drops onto slots belonging to other rooms by regenerating that
      // room's layout — keeps multi-room seating valid without remounting DnD.
      const resolvedSlot =
        slot ??
        unlockedRooms
          .flatMap((room) => generateDefaultRoomSlots(room.id))
          .find((s) => s.id === targetSlotId);

      if (!resolvedSlot) return;
      const verdict = canSeatEquipment(equipment, resolvedSlot);
      if (!verdict.allowed) {
        toast({
          title: 'Won’t seat there',
          description: verdict.reason ?? 'Incompatible gear for that chassis slot.',
          variant: 'destructive',
        });
        return;
      }
    }

    void gameAudio.playGearSwitch();
    setGameState((prev) => ({
      ...prev,
      equipmentPlacements: placeEquipmentInSlot(
        prev.equipmentPlacements ?? [],
        equipmentId,
        targetSlotId
      ),
    }));
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveEquipId(parseEquipId(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveEquipId(null);
    const equipmentId = parseEquipId(event.active.id);
    if (!equipmentId || !event.over) return;
    const targetSlotId = String(event.over.id);
    seatEquipment(equipmentId, targetSlotId === INVENTORY_SLOT_ID ? null : targetSlotId);
  };

  const onDragCancel = () => setActiveEquipId(null);

  if (gameState.ownedEquipment.length === 0) {
    return (
      <div className="rounded-lg border border-stone-700 bg-stone-950/50 p-2.5">
        <h3 className="text-xs font-bold text-white mb-1">🎛 Gear racks</h3>
        <p className="text-[11px] text-stone-400">Buy gear from the shop, then drag it into room chassis slots.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-stone-700 bg-stone-950/50 p-2.5 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-white">🎛 Gear racks</h3>
        <select
          className="bg-stone-900 border border-stone-600 text-[11px] text-stone-200 rounded px-1.5 py-1"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          aria-label="Studio room for gear rack"
        >
          {unlockedRooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
      </div>
      <p className="text-[10px] text-stone-400 leading-relaxed">
        Drag owned gear into chassis slots. Only seated gear is active for that room’s sessions.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <InventoryTray items={inventory} />

        <section className="space-y-1.5">
          <h4 className="text-[11px] font-semibold text-amber-200/90">19″ outboard rack</h4>
          <div className="grid grid-cols-1 gap-1">
            {rackSlots.map((slot) => (
              <DropSlot
                key={slot.id}
                slot={slot}
                seated={getEquipmentInSlot(gameState.ownedEquipment, placements, slot.id)}
                onUnequip={(id) => seatEquipment(id, null)}
              />
            ))}
          </div>
        </section>

        <section className="space-y-1.5">
          <h4 className="text-[11px] font-semibold text-stone-200/90">Mic locker</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {micSlots.map((slot) => (
              <DropSlot
                key={slot.id}
                slot={slot}
                seated={getEquipmentInSlot(gameState.ownedEquipment, placements, slot.id)}
                onUnequip={(id) => seatEquipment(id, null)}
              />
            ))}
          </div>
        </section>

        <section className="space-y-1.5">
          <h4 className="text-[11px] font-semibold text-emerald-200/90">Desk station</h4>
          <div className="grid grid-cols-1 gap-1">
            {deskSlots.map((slot) => (
              <DropSlot
                key={slot.id}
                slot={slot}
                seated={getEquipmentInSlot(gameState.ownedEquipment, placements, slot.id)}
                onUnequip={(id) => seatEquipment(id, null)}
              />
            ))}
          </div>
        </section>

        <DragOverlay dropAnimation={null}>
          {activeEquipment ? (
            <Card className="p-2 bg-stone-800 border-amber-400 shadow-lg scale-105">
              <p className="text-xs font-semibold text-white">
                {activeEquipment.icon} {activeEquipment.name}
              </p>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
