import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { checkImageAsset, formatFromExtension, type AssetProblem } from './image-asset-integrity';

// Walks the filesystem rather than asking git, because the Vercel build
// container has no git directory and this runs from `prebuild`.
const SKIPPED_DIRS = new Set(['node_modules', 'graphify-out', 'dist', 'coverage', 'build']);

/**
 * Known offenders, tolerated by `npm run check:assets` (but not `--strict`) so
 * that existing debt does not block deploys while any NEW offender does. This
 * list may only SHRINK: `image-asset-integrity.test.ts` fails if a file here
 * is fixed and not removed, or if a problem exists that is not listed. Never
 * add a file to hide a problem; fix the artwork.
 *
 * - The eight `public/relics` files are JPEGs named .png with a checkerboard
 *   "transparency" grid baked into the pixels (no alpha channel). Byte-identical
 *   copies live in the Native app, where they broke Android build 46. Used by
 *   landing.html, the about page, journal and marketing config, the festival
 *   emblem map and the kosh page.
 * - The three `clay-relics` files are unreferenced copies of the same art
 *   (japa-relic = mala, panchang-relic = diya-bronze, astrology-relic = chakra).
 * - `bhakti-hero.png` is an opaque 1024px hero photo that is a JPEG named .png;
 *   unreferenced. For a photo, saving it as `.jpg` is the right fix.
 */
export const KNOWN_BROKEN_IMAGES: readonly string[] = [
  'public/images/bhakti-hero.png',
  'public/images/clay-relics/astrology-relic.png',
  'public/images/clay-relics/japa-relic.png',
  'public/images/clay-relics/panchang-relic.png',
  'public/relics/chakra.png',
  'public/relics/dharma-wheel.png',
  'public/relics/diya-bronze.png',
  'public/relics/halo.png',
  'public/relics/khanda-gold.png',
  'public/relics/khanda.png',
  'public/relics/mala.png',
  'public/relics/trishula-gold.png',
];

/** Repo-relative paths (forward slashes) of every raster image under `root`. */
export function listImageFiles(root: string): string[] {
  const found: string[] = [];
  const walk = (dir: string): void => {
    // A Dirent reports a symlink as neither file nor directory, so symlinks
    // (e.g. a linked node_modules) are never followed or double-counted.
    for (const entry of readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = dir ? `${dir}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (entry.name.startsWith('.') || SKIPPED_DIRS.has(entry.name)) continue;
        walk(rel);
      } else if (entry.isFile() && formatFromExtension(entry.name)) {
        found.push(rel);
      }
    }
  };
  walk('');
  return found.sort();
}

export function scanImageAssets(root: string): { scanned: number; problems: AssetProblem[] } {
  const files = listImageFiles(root);
  const problems: AssetProblem[] = [];
  for (const file of files) {
    problems.push(...checkImageAsset(file, readFileSync(path.join(root, file))));
  }
  return { scanned: files.length, problems };
}
