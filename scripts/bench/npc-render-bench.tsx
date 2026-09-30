// Headless render benchmark entry: layered Pixi NPCs vs the DOM/SVG ModularSpriteRenderer.
// Bundled and driven by scripts/bench/npc-render-bench.cjs. Mode/count come from the URL hash: #pixi:12 or #dom:6.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Application, Texture } from 'pixi.js';
import atlas from '../../public/assets/atlases/layer/npc-parts.json';
import atlasImage from '../../public/assets/atlases/layer/npc-parts.png';
import { generateModularNpc, ModularSpriteRenderer, type NpcAnimationState } from '../../src/features/sprites';
import { buildSpritesheet } from '../../src/features/sprites/pipeline/pixiAtlasLoader';
import { createLayeredNpc } from '../../src/features/sprites/pixiNpc';

const [mode, countRaw] = location.hash.slice(1).split(':');
const count = Number(countRaw) || 3;
const COLS = 6, SCALE = 3, CELL_W = 32 * SCALE + 16, CELL_H = 48 * SCALE + 16;
const STATES: NpcAnimationState[] = ['idle', 'working', 'celebrate', 'headbob'];
const npcs = Array.from({ length: count }, (_, i) => generateModularNpc(1000 + i, { era: '1980s', role: (['engineer', 'producer', 'artist', 'manager', 'tech'] as const)[i % 5] }));
const w = Math.min(count, COLS) * CELL_W, h = Math.ceil(count / COLS) * CELL_H;
const host = document.getElementById('host')!;
host.style.cssText = `width:${w}px;height:${h}px;position:relative;background:#1f2937`;
const w2 = window as unknown as Record<string, unknown>;

(async () => {
  if (mode === 'dom') {
    createRoot(host).render(
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(count, COLS)}, ${CELL_W}px)` }}>
        {npcs.map((n, i) => <div key={n.id} style={{ width: CELL_W, height: CELL_H, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}><ModularSpriteRenderer npc={n} animationState={STATES[i % 4]} scale={SCALE} showBadge={false} /></div>)}
      </div>,
    );
  } else {
    const img = new Image();
    img.src = atlasImage;
    await img.decode();
    const texture = Texture.from(img);
    texture.source.scaleMode = 'nearest';
    const loaded = await buildSpritesheet(atlas as never, texture);
    const app = new Application();
    await app.init({ width: w, height: h, backgroundColor: 0x1f2937, antialias: false, resolution: 1, preference: 'webgl' });
    host.appendChild(app.canvas);
    const bobbers = npcs.map((n, i) => {
      const { container, missingRequired } = createLayeredNpc(loaded, n);
      if (missingRequired.length) console.warn('missing', n.id, missingRequired);
      container.scale.set(SCALE);
      container.position.set((i % COLS) * CELL_W + CELL_W / 2, Math.floor(i / COLS) * CELL_H + CELL_H - 8);
      app.stage.addChild(container);
      return { container, baseY: container.y, phase: i * 0.7 };
    });
    let t = 0;
    app.ticker.add((tk) => { t += tk.deltaMS / 1000; for (const b of bobbers) b.container.y = b.baseY - Math.abs(Math.sin(t * 3 + b.phase)) * 3 * SCALE; });
  }
  // rAF frame-interval recorder
  const frames: number[] = [];
  let last = performance.now();
  const loop = (now: number) => { frames.push(now - last); last = now; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  w2.__frames = frames;
  w2.__ready = true;
})();
