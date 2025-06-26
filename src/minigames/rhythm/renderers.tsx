import React from 'react';

const Note = ({ x, y }: { x: number; y: number }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: 20, height: 20, backgroundColor: 'red' }} />
);

const Target = ({ x, y }: { x: number; y: number }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: 40, height: 40, backgroundColor: 'blue' }} />
);

const Score = ({ value }: { value: number }) => (
  <div style={{ position: 'absolute', top: 10, right: 10, color: 'white' }}>
    Score: {value}
  </div>
);

const Notes = ({ notes }: { notes: { x: number; y: number }[] }) => (
  <>
    {notes.map((note, i) => (
      <Note key={i} {...note} />
    ))}
  </>
);

export { Note, Target, Score, Notes };
