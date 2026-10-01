#!/usr/bin/env node
// Dev-only: re-encode shipped mp3s to AAC-LC .m4a (plays natively on iOS, Android and desktop; no runtime deps).
//   music + chart clips : stereo 44.1kHz, 96 kbps
//   UI SFX (short)      : mono   44.1kHz, 64 kbps
// Needs the ffmpeg-static binary (dev dependency; its download is skipped by default — run
// `node node_modules/ffmpeg-static/install.js` once, or set FFMPEG_PATH to any ffmpeg).
// Usage: node scripts/compress-audio.mjs [--keep-originals]
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, unlinkSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const ffmpeg = process.env.FFMPEG_PATH || require('ffmpeg-static');
if (!ffmpeg || !existsSync(ffmpeg)) {
  console.error('ffmpeg binary not found. Run: node node_modules/ffmpeg-static/install.js');
  process.exit(1);
}
const keep = process.argv.includes('--keep-originals');
const root = path.resolve('public/audio');
const profiles = [
  { dir: 'music', args: ['-ac', '2', '-ar', '44100', '-b:a', '96k'] },
  { dir: 'chart_clips', args: ['-ac', '2', '-ar', '44100', '-b:a', '96k'] },
  { dir: 'ui-sfx', args: ['-ac', '1', '-ar', '44100', '-b:a', '64k'] },
  { dir: 'ui sfx', args: ['-ac', '1', '-ar', '44100', '-b:a', '64k'] },
];

let before = 0;
let after = 0;
for (const { dir, args } of profiles) {
  const d = path.join(root, dir);
  if (!existsSync(d)) continue;
  for (const f of readdirSync(d).filter((n) => n.toLowerCase().endsWith('.mp3'))) {
    const src = path.join(d, f);
    const out = path.join(d, f.replace(/\.mp3$/i, '.m4a'));
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', src, '-vn', '-map_metadata', '-1', '-c:a', 'aac', ...args, '-movflags', '+faststart', out]);
    before += statSync(src).size;
    after += statSync(out).size;
    if (!keep) unlinkSync(src);
  }
}
const mb = (n) => (n / 1048576).toFixed(1);
console.log(`Re-encoded: ${mb(before)}MB -> ${mb(after)}MB (${((1 - after / before) * 100).toFixed(0)}% smaller)`);
