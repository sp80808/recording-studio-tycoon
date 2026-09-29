import { generateNewProjects } from '@/utils/projectUtils';

for (const [era, allowed] of [
  ['analog60s', ['Rock', 'Acoustic', 'Folk', 'Soul', 'Jazz']],
  ['digital80s', ['Electronic']],
  ['internet2000s', ['Electronic']],
  ['streaming2020s', ['Indie Pop', 'Lo-fi']],
] as const) {
  const projects = generateNewProjects(2, 1, era);
  if (projects.length !== 2 || projects.some(project => !allowed.includes(project.genre as never))) {
    throw new Error(`${era} started with an out-of-era or missing booking`);
  }
}

console.log('PASS: each starting era offers relevant first bookings');
