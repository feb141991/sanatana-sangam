import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { checkImageAsset, formatFromExtension, type AssetProblem } from './image-asset-integrity';

// Walks the filesystem rather than asking git, because the Vercel build
// container has no git directory and this runs from `prebuild`.
const SKIPPED_DIRS = new Set(['node_modules', 'graphify-out', 'dist', 'coverage', 'build']);

/**
 * Known offenders, tolerated by `npm run check:assets` (but not `--strict`) so
 * that existing debt does not block deploys while any NEW offender does. This
 * list is EMPTY and may only ever shrink: `image-asset-integrity.test.ts` fails
 * if a file listed here has been fixed, or if a problem exists that is not
 * listed. Never add a file to hide a problem; fix the artwork.
 *
 * History: it once listed twelve files -- the eight `public/relics` files that
 * broke the Native app's Android build 46 (JPEGs named .png with a checkerboard
 * "transparency" grid baked into the pixels), three unreferenced `clay-relics`
 * copies of the same art, and `bhakti-hero.png` (an opaque photo that was a JPEG
 * named .png). On 2026-10-08 the relics and copies were replaced with real
 * transparent cut-outs and the photo was renamed `.jpg`.
 */
export const KNOWN_BROKEN_IMAGES: readonly string[] = [];

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
