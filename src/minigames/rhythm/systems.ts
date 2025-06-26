interface Touch {
  type: string;
  event: {
    pageX: number;
  };
}

interface Time {
  delta: number;
}

interface Note {
  x: number;
  y: number;
}

interface Entities {
  finger: { x: number; y: number };
  notes: Note[];
  target: { x: number; y: number };
  score: { value: number };
}

const MoveFinger = (entities: Entities, { touches }: { touches: Touch[] }) => {
  touches.filter((t: Touch) => t.type === 'move').forEach((t: Touch) => {
    const finger = entities.finger;
    if (finger) {
      finger.x = t.event.pageX;
    }
  });
  return entities;
};

const UpdateNotes = (entities: Entities, { time }: { time: Time }) => {
  const { notes } = entities;
  const { delta } = time;
  notes.forEach((note: Note) => {
    note.y += delta * 0.1;
  });
  return entities;
};

const CheckHits = (onFinish: (score: number) => void) => (entities: Entities) => {
  const { notes, target, score } = entities;
  const newNotes = notes.filter((note: Note) => {
    if (note.y > target.y - 10 && note.y < target.y + 10) {
      if (note.x > target.x - 20 && note.x < target.x + 20) {
        score.value += 1;
        return false;
      }
    }
    return note.y < 600;
  });
  entities.notes = newNotes;
  if (notes.length === 0) {
    onFinish(score.value);
  }
  return entities;
};

export { MoveFinger, UpdateNotes, CheckHits };
