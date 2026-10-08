// Image-asset integrity checks, as pure functions over bytes so they can be
// unit-tested and reused by the CLI (`scripts/ci/check-image-assets.ts`) and the
// repo-wide ratchet in `image-asset-integrity.test.ts`.
//
// Twin of shoonaya-mobile's `lib/assetFormat.ts`: the two repositories cannot
// share code, so keep the rules in step (AGENTS.md section 12 here, section 11
// there).
//
// Why this exists: Android production build 46 of the Native app (2026-10-06)
// failed after a ~3 hour EAS queue because eight files in `public/relics` --
// copied into the app -- are JPEGs named `.png`, each with a checkerboard
// "transparency" grid baked into its pixels. Android's resource compiler
// (AAPT2) refuses a `.png` that is not a PNG; browsers, Next's image optimiser
// and iOS sniff the content and accept it, so nothing else caught it, and the
// web has been showing the baked-in checkerboard ever since the files landed.

export type ImageFormat = 'png' | 'jpeg' | 'webp' | 'gif';

export type AssetProblemCode = 'FORMAT_MISMATCH' | 'UNRECOGNISED' | 'CORRUPT_PNG' | 'NO_ALPHA';

export interface AssetProblem {
  path: string;
  code: AssetProblemCode;
  message: string;
}

// Cut-out art is drawn on top of themed surfaces, so it must carry real
// transparency. Photographic/background art (public/assets, darshan, og image,
// PWA icons, splash) is legitimately opaque and is not listed here.
export const CUTOUT_ART_DIRS = ['public/relics/', 'public/images/clay-relics/'] as const;

const EXTENSION_FORMATS: Record<string, ImageFormat> = {
  png: 'png',
  jpg: 'jpeg',
  jpeg: 'jpeg',
  webp: 'webp',
  gif: 'gif',
};

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export function formatFromExtension(path: string): ImageFormat | null {
  const dot = path.lastIndexOf('.');
  if (dot < 0) return null;
  return EXTENSION_FORMATS[path.slice(dot + 1).toLowerCase()] ?? null;
}

export function isCutoutArtPath(path: string): boolean {
  const normalised = path.replace(/\\/g, '/');
  return CUTOUT_ART_DIRS.some((dir) => normalised.startsWith(dir));
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  let out = '';
  for (let i = start; i < end && i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

function u32be(bytes: Uint8Array, at: number): number {
  return ((bytes[at] << 24) | (bytes[at + 1] << 16) | (bytes[at + 2] << 8) | bytes[at + 3]) >>> 0;
}

function u32le(bytes: Uint8Array, at: number): number {
  return (bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16) | (bytes[at + 3] << 24)) >>> 0;
}

/** The format the bytes really are, ignoring the file name. */
export function sniffImageFormat(bytes: Uint8Array): ImageFormat | null {
  if (bytes.length >= 8 && PNG_SIGNATURE.every((value, index) => bytes[index] === value)) return 'png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') return 'webp';
  if (bytes.length >= 6 && ascii(bytes, 0, 3) === 'GIF') return 'gif';
  return null;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array, start: number, end: number): number {
  let c = 0xffffffff;
  for (let i = start; i < end; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export type PngInspection = { ok: true; hasAlpha: boolean; width: number; height: number } | { ok: false; reason: string };

/** Walks the PNG chunk list, verifying structure and CRCs; does not decompress pixels. */
export function inspectPng(bytes: Uint8Array): PngInspection {
  let at = 8;
  let first = true;
  let colorType = -1;
  let width = 0;
  let height = 0;
  let sawTrns = false;
  let sawIdat = false;
  while (at + 12 <= bytes.length) {
    const length = u32be(bytes, at);
    const type = ascii(bytes, at + 4, at + 8);
    const dataStart = at + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > bytes.length) return { ok: false, reason: `truncated inside the ${type} chunk` };
    if (u32be(bytes, dataEnd) !== crc32(bytes, at + 4, dataEnd)) return { ok: false, reason: `bad checksum in the ${type} chunk` };
    if (first && type !== 'IHDR') return { ok: false, reason: 'IHDR is not the first chunk' };
    if (type === 'IHDR') {
      if (length < 13) return { ok: false, reason: 'IHDR chunk is too short' };
      width = u32be(bytes, dataStart);
      height = u32be(bytes, dataStart + 4);
      colorType = bytes[dataStart + 9];
    }
    if (type === 'tRNS') sawTrns = true;
    if (type === 'IDAT') sawIdat = true;
    if (type === 'IEND') {
      if (!sawIdat) return { ok: false, reason: 'no image data (IDAT) before IEND' };
      return { ok: true, hasAlpha: colorType === 4 || colorType === 6 || sawTrns, width, height };
    }
    first = false;
    at = dataEnd + 4;
  }
  return { ok: false, reason: 'no IEND chunk (file is truncated)' };
}

/** Whether a WebP file carries an alpha channel (VP8X flag, or the VP8L alpha hint). */
export function webpHasAlpha(bytes: Uint8Array): boolean {
  let at = 12;
  while (at + 8 <= bytes.length) {
    const type = ascii(bytes, at, at + 4);
    const size = u32le(bytes, at + 4);
    const data = at + 8;
    if (type === 'VP8X' && data < bytes.length) return (bytes[data] & 0x10) !== 0;
    if (type === 'VP8L' && data + 5 <= bytes.length && bytes[data] === 0x2f) {
      return ((u32le(bytes, data + 1) >>> 28) & 1) === 1;
    }
    if (type === 'VP8 ') return false;
    at = data + size + (size & 1);
  }
  return false;
}

export const MISMATCH_ADVICE =
  'Browsers accept a file whose content is not its extension\'s format, but Android\'s resource compiler (AAPT2) does not, and it fails the ' +
  'whole release build of any app that bundles the file (the Native app copies from public/relics). Re-export the file in the format its name ' +
  'claims; for an opaque photo, the matching extension (.jpg) is the right fix. Renaming cut-out art is not a fix, because JPEG cannot carry transparency.';

/**
 * Problems with one image file. `path` is repo-relative with forward slashes;
 * files whose extension is not a raster image are ignored.
 */
export function checkImageAsset(path: string, bytes: Uint8Array): AssetProblem[] {
  const named = formatFromExtension(path);
  if (!named) return [];

  const real = sniffImageFormat(bytes);
  if (!real) {
    return [{ path, code: 'UNRECOGNISED', message: `is not a PNG, JPEG, WebP or GIF at all (${bytes.length} bytes); it may be empty, truncated or a Git LFS pointer.` }];
  }
  if (real !== named) {
    return [{ path, code: 'FORMAT_MISMATCH', message: `is really a ${real.toUpperCase()} but is named .${path.slice(path.lastIndexOf('.') + 1)}.` }];
  }

  const problems: AssetProblem[] = [];
  const needsAlpha = isCutoutArtPath(path);

  if (real === 'png') {
    const png = inspectPng(bytes);
    if (!png.ok) {
      problems.push({ path, code: 'CORRUPT_PNG', message: `is a damaged PNG: ${png.reason}.` });
    } else if (needsAlpha && !png.hasAlpha) {
      problems.push({ path, code: 'NO_ALPHA', message: 'is cut-out art but has no transparency channel, so it draws as an opaque box. Export it with a real alpha channel; never keep a generator\'s checkerboard preview.' });
    }
  } else if (needsAlpha && real === 'jpeg') {
    problems.push({ path, code: 'NO_ALPHA', message: 'is cut-out art saved as JPEG, which cannot carry transparency. Use a PNG or WebP with a real alpha channel.' });
  } else if (needsAlpha && real === 'webp' && !webpHasAlpha(bytes)) {
    problems.push({ path, code: 'NO_ALPHA', message: 'is cut-out art but this WebP has no alpha channel, so it draws as an opaque box.' });
  }
  return problems;
}
