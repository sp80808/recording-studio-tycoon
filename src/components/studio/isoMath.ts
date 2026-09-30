/**
 * Shared isometric projection for the studio scene.
 * Extracted from WebGLCanvas so the decor layer and the room shell agree on one grid.
 * Pure — no Pixi imports besides the Graphics type used by isoQuad.
 */
import type { Graphics } from 'pixi.js';

export const TILE_W = 56;
export const TILE_H = 28;
export const ROOM_W = 8; // tiles along +x
export const ROOM_D = 7; // tiles along +y
export const WALL_H = 132;

export const iso = (x: number, y: number) => ({
  x: (x - y) * (TILE_W / 2),
  y: (x + y) * (TILE_H / 2),
});

/** Start an isometric quad path from tile coords (a,b) -> (c,d), lifted off the floor */
export const isoQuad = (g: Graphics, a: number, b: number, c: number, d: number, lift = 0) => {
  const p1 = iso(a, b);
  const p2 = iso(c, b);
  const p3 = iso(c, d);
  const p4 = iso(a, d);
  g.poly([p1.x, p1.y - lift, p2.x, p2.y - lift, p3.x, p3.y - lift, p4.x, p4.y - lift]);
};

/** A point on the right wall (y = 0 plane) at tile x, lifted `lift` px up the wall. */
export const rightWallPt = (x: number, lift = 0) => {
  const p = iso(x, 0);
  return { x: p.x, y: p.y - lift };
};

/** A point on the left wall (x = 0 plane) at tile y, lifted `lift` px up the wall. */
export const leftWallPt = (y: number, lift = 0) => {
  const p = iso(0, y);
  return { x: p.x, y: p.y - lift };
};

/** Parallelogram covering [x0..x1] × [lift0..lift1] on the right wall, as a flat poly array. */
export const rightWallQuad = (x0: number, x1: number, lift0: number, lift1: number): number[] => {
  const a = rightWallPt(x0, lift0);
  const b = rightWallPt(x1, lift0);
  const c = rightWallPt(x1, lift1);
  const d = rightWallPt(x0, lift1);
  return [a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y];
};

/** Parallelogram covering [y0..y1] × [lift0..lift1] on the left wall, as a flat poly array. */
export const leftWallQuad = (y0: number, y1: number, lift0: number, lift1: number): number[] => {
  const a = leftWallPt(y0, lift0);
  const b = leftWallPt(y1, lift0);
  const c = leftWallPt(y1, lift1);
  const d = leftWallPt(y0, lift1);
  return [a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y];
};
