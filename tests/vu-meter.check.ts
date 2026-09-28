import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const baseDir = process.cwd();
const vuMeterPath = path.join(baseDir, 'src/components/ui/VUMeter.tsx');
assert(fs.existsSync(vuMeterPath), 'VUMeter.tsx must exist');

const content = fs.readFileSync(vuMeterPath, 'utf8');
assert(content.includes('TOTAL_SEGMENTS'), 'VUMeter must define segments');
assert(content.includes('getSegmentColor'), 'VUMeter must calculate segment colors');
assert(content.includes('export const VUMeter'), 'VUMeter component must be exported');

const stripPath = path.join(baseDir, 'src/components/StudioStrip.tsx');
const stripContent = fs.readFileSync(stripPath, 'utf8');
assert(stripContent.includes('VUMeter'), 'StudioStrip must render VUMeter');

console.log('PASS: VU Meter component and integration verified');
