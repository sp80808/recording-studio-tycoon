/**
 * Regenerates the two in-house CC0 sample sources under assets-src/ (run once; outputs are committed):
 *  - npc/sample-engineer: a spritesheet in Aseprite's JSON export shape (idle/work/celebrate + pivot slice)
 *  - gear/sample-monitor: loose frames named like Blender renders (<tag>_<nnn>.png)
 * They are procedurally drawn rectangles so they carry no third-party licence.
 */
import fs from 'node:fs';
import path from 'node:path';
import { encodePng, type Rgba } from './png';

const root = path.join(process.cwd(), 'assets-src');
const canvas = (w: number, h: number): Rgba => ({ w, h, data: new Uint8Array(w * h * 4) });
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const rect = (img: Rgba, x: number, y: number, w: number, h: number, c: string) => {
  const [r, g, b] = hex(c);
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    if (xx < 0 || yy < 0 || xx >= img.w || yy >= img.h) continue;
    img.data.set([r, g, b, 255], (yy * img.w + xx) * 4);
  }
};
const write = (p: string, content: string | Uint8Array) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content); };

const PALETTE = ['#171717', '#fed7aa', '#3b82f6', '#1e3a8a', '#0f172a', '#f59e0b', '#e2e8f0'];

// ---- NPC engineer: 32x48 frames, 6 frames in a row --------------------------------------
const drawEngineer = (img: Rgba, ox: number, bob: number, armUp: boolean) => {
  rect(img, ox + 11, 44, 4, 3, PALETTE[4]); rect(img, ox + 17, 44, 4, 3, PALETTE[4]); // shoes
  rect(img, ox + 11, 32 + bob, 4, 12 - bob, PALETTE[3]); rect(img, ox + 17, 32 + bob, 4, 12 - bob, PALETTE[3]); // legs
  rect(img, ox + 9, 18 + bob, 14, 15, PALETTE[2]); // torso
  rect(img, ox + (armUp ? 5 : 7), armUp ? 8 + bob : 20 + bob, 3, armUp ? 12 : 10, PALETTE[2]); // left arm
  rect(img, ox + 24, 20 + bob, 3, 10, PALETTE[2]);
  rect(img, ox + 11, 6 + bob, 10, 12, PALETTE[1]); // head
  rect(img, ox + 10, 4 + bob, 12, 4, PALETTE[0]); // hair
  rect(img, ox + 9, 8 + bob, 2, 6, PALETTE[5]); rect(img, ox + 21, 8 + bob, 2, 6, PALETTE[5]); // cans
};
const FW = 32, FH = 48, N = 6;
const sheet = canvas(FW * N, FH);
const bobs = [0, 1, 0, 1, 0, 0];
for (let i = 0; i < N; i++) drawEngineer(sheet, i * FW, bobs[i], i >= 4);
const aseFrames = Array.from({ length: N }, (_, i) => ({
  filename: `sample-engineer ${i}.aseprite`,
  frame: { x: i * FW, y: 0, w: FW, h: FH },
  rotated: false, trimmed: false,
  spriteSourceSize: { x: 0, y: 0, w: FW, h: FH },
  sourceSize: { w: FW, h: FH },
  duration: 160,
}));
const dir1 = path.join(root, 'npc', 'sample-engineer');
write(path.join(dir1, 'sheet.png'), encodePng(sheet));
write(path.join(dir1, 'sheet.json'), JSON.stringify({
  frames: aseFrames,
  meta: {
    app: 'https://www.aseprite.org/', version: '1.3.x (format reference; sample drawn in-house)', image: 'sheet.png', format: 'RGBA8888',
    size: { w: FW * N, h: FH }, scale: '1',
    frameTags: [
      { name: 'idle', from: 0, to: 1, direction: 'forward' },
      { name: 'work', from: 2, to: 3, direction: 'pingpong' },
      { name: 'celebrate', from: 4, to: 5, direction: 'forward' },
    ],
    slices: [{ name: 'pivot', color: '#0000ffff', keys: [{ frame: 0, bounds: { x: 16, y: 47, w: 1, h: 1 }, pivot: { x: 16, y: 48 } }] }],
  },
}, null, 2) + '\n');
write(path.join(dir1, 'asset.json'), JSON.stringify({
  id: 'sample-engineer', kind: 'npc', sourceType: 'aseprite', author: 'RST in-house', license: 'In-house (CC0)',
  toolVersion: 'Aseprite JSON export format 1.3 (sample drawn by scripts/assets/make-samples.ts)',
  paletteId: 'rst-sample-engineer', palette: PALETTE, createdAt: '2026-09-30T00:00:00.000Z',
  pipelineSteps: ['draw-in-house', 'export-spritesheet-json'],
}, null, 2) + '\n');

// ---- Gear monitor: Blender-style loose frames, 48x40 -------------------------------------
const drawMonitor = (glow: number) => {
  const img = canvas(48, 40);
  rect(img, 14, 34, 20, 4, '#3a3f45'); rect(img, 20, 28, 8, 7, '#2f353c'); // base + neck
  rect(img, 4, 4, 40, 25, '#111827'); // bezel
  rect(img, 7, 7, 34, 19, glow ? (glow === 1 ? '#0f766e' : '#14b8a6') : '#1f2937'); // screen
  return img;
};
const dir2 = path.join(root, 'gear', 'sample-monitor', 'frames');
write(path.join(dir2, 'idle_000.png'), encodePng(drawMonitor(0)));
write(path.join(dir2, 'powered_000.png'), encodePng(drawMonitor(1)));
write(path.join(dir2, 'powered_001.png'), encodePng(drawMonitor(2)));
write(path.join(root, 'gear', 'sample-monitor', 'asset.json'), JSON.stringify({
  id: 'sample-monitor', kind: 'gear', sourceType: 'blender_render', author: 'RST in-house', license: 'In-house (CC0)',
  toolVersion: 'Blender-render intake format (frames named <tag>_<nnn>.png); sample drawn by scripts/assets/make-samples.ts',
  paletteId: 'rst-sample-monitor', palette: ['#111827', '#1f2937', '#0f766e', '#14b8a6', '#3a3f45', '#2f353c'], createdAt: '2026-09-30T00:00:00.000Z',
  pipelineSteps: ['draw-in-house', 'export-png-sequence'],
}, null, 2) + '\n');
console.log('samples written to assets-src/');
