// The fingerprint of everything that goes into public/assets/js/moon-hero.js. The build writes it
// into the bundle's first line and into landing.html's ?v= cache key; a test checks both are current.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const MOON_HERO_SOURCES = ['scripts/moon-hero/scene.ts', 'src/lib/moon-hero/astronomy.ts'];
export const MOON_HERO_BUNDLE = 'public/assets/js/moon-hero.js';

export function moonHeroSourceHash(root = process.cwd()) {
  const hash = createHash('sha256');
  for (const file of MOON_HERO_SOURCES) hash.update(readFileSync(join(root, file), 'utf8'));
  const three = JSON.parse(readFileSync(join(root, 'node_modules/three/package.json'), 'utf8'));
  hash.update(`three@${three.version}`);
  return hash.digest('hex').slice(0, 12);
}
