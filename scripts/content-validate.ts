/** `pnpm content:validate` (#64): validates the authored content registry and exits 1 on any error. */
import fs from 'node:fs';
import { liveRegistry } from '../src/content/registry';
import { summarise, validateRegistry } from '../src/content/validate';

const strings = JSON.parse(fs.readFileSync('public/locales/en/events.json', 'utf8'));
const reg = liveRegistry();
const issues = validateRegistry(reg, strings);
const s = summarise(issues);
const strict = process.argv.includes('--strict');
const json = process.argv.includes('--json');
if (json) console.log(JSON.stringify({ counts: { synergies: reg.synergies.length, events: reg.events.length }, issues }, null, 2));
else {
  console.log(`content: ${reg.synergies.length} synergies, ${reg.events.length} events, ${reg.briefs.services.length} brief services, ${reg.briefs.approaches.length} approaches`);
  for (const i of issues) console.log(`${i.severity === 'error' ? 'ERROR' : 'warn '} [${i.family}] ${i.id} (${i.rule}) ${i.message}`);
  console.log(`${s.errors} error(s), ${s.warnings} warning(s)`);
}
process.exit(s.errors > 0 || (strict && s.warnings > 0) ? 1 : 0);
