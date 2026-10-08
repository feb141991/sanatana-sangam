import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

import {
  MISMATCH_ADVICE,
  checkImageAsset,
  formatFromExtension,
  inspectPng,
  isCutoutArtPath,
  sniffImageFormat,
  webpHasAlpha,
} from './image-asset-integrity';
import { KNOWN_BROKEN_IMAGES, listImageFiles, scanImageAssets } from './image-asset-scan';

// ── Byte builders: real, minimal files so the checks run against actual formats ──

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const byte of bytes) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

function u32be(value: number): Buffer {
  const out = Buffer.alloc(4);
  out.writeUInt32BE(value >>> 0);
  return out;
}

function pngChunk(type: string, data: Buffer, opts: { badCrc?: boolean } = {}): Buffer {
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  return Buffer.concat([u32be(data.length), body, u32be(crc32(body) ^ (opts.badCrc ? 1 : 0))]);
}

const SAMPLE_BYTES: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

function makePng(
  colorType: 0 | 2 | 3 | 4 | 6,
  opts: { trns?: boolean; badCrc?: boolean; noIend?: boolean; noIdat?: boolean } = {},
): Uint8Array {
  const ihdr = Buffer.concat([u32be(1), u32be(1), Buffer.from([8, colorType, 0, 0, 0])]);
  const scanline = Buffer.concat([Buffer.from([0]), Buffer.alloc(SAMPLE_BYTES[colorType], 0x7f)]);
  const parts: Buffer[] = [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), pngChunk('IHDR', ihdr)];
  if (colorType === 3) parts.push(pngChunk('PLTE', Buffer.from([1, 2, 3])));
  if (opts.trns) parts.push(pngChunk('tRNS', Buffer.from(colorType === 3 ? [0] : colorType === 0 ? [0, 0] : [0, 0, 0, 0, 0, 0])));
  if (!opts.noIdat) parts.push(pngChunk('IDAT', deflateSync(scanline), { badCrc: opts.badCrc }));
  if (!opts.noIend) parts.push(pngChunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(parts);
}

// First bytes of a real JPEG (what the offending files actually are).
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00]);
const GIF = Buffer.from('GIF89a\x01\x00\x01\x00\x00\x00\x00;', 'latin1');

function riff(chunks: Buffer[]): Buffer {
  const body = Buffer.concat([Buffer.from('WEBP', 'latin1'), ...chunks]);
  const size = Buffer.alloc(4);
  size.writeUInt32LE(body.length);
  return Buffer.concat([Buffer.from('RIFF', 'latin1'), size, body]);
}

function webpChunk(type: string, data: Buffer): Buffer {
  const size = Buffer.alloc(4);
  size.writeUInt32LE(data.length);
  return Buffer.concat([Buffer.from(type, 'latin1'), size, data, data.length & 1 ? Buffer.alloc(1) : Buffer.alloc(0)]);
}

const webpLossy = () => riff([webpChunk('VP8 ', Buffer.alloc(10, 1))]);
const webpWithAlphaFlag = (alpha: boolean) => riff([webpChunk('VP8X', Buffer.from([alpha ? 0x10 : 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))]);
function webpLossless(alphaUsed: boolean): Buffer {
  const header = Buffer.alloc(5);
  header[0] = 0x2f;
  header.writeUInt32LE(((alphaUsed ? 1 : 0) << 28) >>> 0, 1);
  return riff([webpChunk('VP8L', header)]);
}

const codes = (file: string, bytes: Uint8Array) => checkImageAsset(file, bytes).map((problem) => problem.code);

describe('image format detection', () => {
  it('recognises each format from its bytes, not its name', () => {
    expect(sniffImageFormat(makePng(6))).toBe('png');
    expect(sniffImageFormat(JPEG)).toBe('jpeg');
    expect(sniffImageFormat(webpLossy())).toBe('webp');
    expect(sniffImageFormat(GIF)).toBe('gif');
  });

  it('returns null for empty files and Git LFS pointers', () => {
    expect(sniffImageFormat(new Uint8Array())).toBeNull();
    expect(sniffImageFormat(Buffer.from('version https://git-lfs.github.com/spec/v1\noid sha256:abc\n'))).toBeNull();
  });

  it('reads the expected format from the extension, case-insensitively', () => {
    expect(formatFromExtension('a/b/c.PNG')).toBe('png');
    expect(formatFromExtension('a.jpg')).toBe('jpeg');
    expect(formatFromExtension('a.JPEG')).toBe('jpeg');
    expect(formatFromExtension('a.webp')).toBe('webp');
    expect(formatFromExtension('a.json')).toBeNull();
    expect(formatFromExtension('noextension')).toBeNull();
  });
});

describe('format must match the extension (the Android build 46 failure)', () => {
  it('rejects a JPEG named .png and says what it really is', () => {
    const problems = checkImageAsset('public/assets/photo.png', JPEG);
    expect(problems.map((problem) => problem.code)).toEqual(['FORMAT_MISMATCH']);
    expect(problems[0].message).toMatch(/really a JPEG but is named \.png/);
    expect(MISMATCH_ADVICE).toMatch(/AAPT2/); // printed once by the CLI, not repeated per file
  });

  it('tells people when renaming is and is not the fix', () => {
    expect(MISMATCH_ADVICE).toMatch(/opaque photo/);
    expect(MISMATCH_ADVICE).toMatch(/Renaming cut-out art is not a fix/);
  });

  it('rejects a PNG named .jpg and a WebP named .png', () => {
    expect(codes('public/a/b.jpg', makePng(2))).toEqual(['FORMAT_MISMATCH']);
    expect(codes('public/a/b.png', webpLossy())).toEqual(['FORMAT_MISMATCH']);
  });

  it('accepts files whose name and content agree', () => {
    expect(codes('public/assets/a.png', makePng(2))).toEqual([]);
    expect(codes('public/assets/a.jpg', JPEG)).toEqual([]);
    expect(codes('public/assets/a.webp', webpLossy())).toEqual([]);
    expect(codes('public/assets/a.gif', GIF)).toEqual([]);
  });

  it('flags files that are not images at all, including LFS pointers, instead of letting a build discover them', () => {
    expect(codes('public/a/b.png', new Uint8Array())).toEqual(['UNRECOGNISED']);
    expect(codes('public/a/b.png', Buffer.from('version https://git-lfs.github.com/spec/v1\n'))).toEqual(['UNRECOGNISED']);
  });

  it('ignores files that are not raster images', () => {
    expect(checkImageAsset('public/data/x.json', Buffer.from('{}'))).toEqual([]);
    expect(checkImageAsset('public/relics/x.svg', Buffer.from('<svg/>'))).toEqual([]);
  });
});

describe('PNG integrity', () => {
  it('accepts a well-formed PNG and reports its size and alpha', () => {
    expect(inspectPng(makePng(6))).toEqual({ ok: true, hasAlpha: true, width: 1, height: 1 });
    const rgb = inspectPng(makePng(2));
    expect(rgb.ok && rgb.hasAlpha).toBe(false);
  });

  it('rejects a bad checksum, a missing IEND and missing image data as CORRUPT_PNG', () => {
    expect(codes('public/assets/a.png', makePng(6, { badCrc: true }))).toEqual(['CORRUPT_PNG']);
    expect(codes('public/assets/a.png', makePng(6, { noIend: true }))).toEqual(['CORRUPT_PNG']);
    expect(codes('public/assets/a.png', makePng(6, { noIdat: true }))).toEqual(['CORRUPT_PNG']);
  });

  it('rejects a truncated PNG', () => {
    const whole = makePng(6);
    expect(codes('public/assets/a.png', whole.subarray(0, whole.length - 9))).toEqual(['CORRUPT_PNG']);
  });
});

describe('cut-out art must have real transparency', () => {
  it('knows which folders are cut-out art', () => {
    expect(isCutoutArtPath('public/relics/diya.png')).toBe(true);
    expect(isCutoutArtPath('public/images/clay-relics/japa.png')).toBe(true);
    expect(isCutoutArtPath('public/assets/photo.png')).toBe(false);
    expect(isCutoutArtPath('public/icons/icon-192x192.png')).toBe(false);
    expect(isCutoutArtPath('docs/public/relics/x.png')).toBe(false);
  });

  it('rejects an opaque PNG in a cut-out folder (converting the JPEG is not a fix)', () => {
    for (const colorType of [0, 2, 3] as const) {
      expect(codes('public/relics/lamp.png', makePng(colorType)), `color type ${colorType}`).toEqual(['NO_ALPHA']);
    }
  });

  it('accepts PNGs with an alpha channel or transparency data in a cut-out folder', () => {
    expect(codes('public/relics/lamp.png', makePng(4))).toEqual([]);
    expect(codes('public/relics/lamp.png', makePng(6))).toEqual([]);
    expect(codes('public/relics/lamp.png', makePng(3, { trns: true }))).toEqual([]);
    expect(codes('public/images/clay-relics/lamp.png', makePng(2, { trns: true }))).toEqual([]);
  });

  it('rejects a correctly-named JPEG in a cut-out folder, since JPEG cannot carry transparency', () => {
    expect(codes('public/relics/lamp.jpg', JPEG)).toEqual(['NO_ALPHA']);
  });

  it('rejects opaque WebP and accepts WebP with an alpha flag, in lossy-with-VP8X and lossless forms', () => {
    expect(webpHasAlpha(webpLossy())).toBe(false);
    expect(webpHasAlpha(webpWithAlphaFlag(false))).toBe(false);
    expect(webpHasAlpha(webpWithAlphaFlag(true))).toBe(true);
    expect(webpHasAlpha(webpLossless(false))).toBe(false);
    expect(webpHasAlpha(webpLossless(true))).toBe(true);
    expect(codes('public/relics/lamp.webp', webpLossy())).toEqual(['NO_ALPHA']);
    expect(codes('public/relics/lamp.webp', webpWithAlphaFlag(true))).toEqual([]);
    expect(codes('public/relics/lamp.webp', webpLossless(true))).toEqual([]);
  });

  it('does not require transparency for photographic art, PWA icons, the OG image or splash art', () => {
    expect(codes('public/assets/photo.png', makePng(2))).toEqual([]);
    expect(codes('public/darshan/rama.webp', webpLossy())).toEqual([]);
    expect(codes('public/icons/icon-192x192.png', makePng(2))).toEqual([]);
    expect(codes('public/og-image.png', makePng(2))).toEqual([]);
  });
});

describe('scanner (filesystem walk, no git needed)', () => {
  function withTree(files: Record<string, Uint8Array>, run: (root: string) => void): void {
    const root = mkdtempSync(path.join(tmpdir(), 'asset-scan-'));
    try {
      for (const [relative, bytes] of Object.entries(files)) {
        const full = path.join(root, relative);
        mkdirSync(path.dirname(full), { recursive: true });
        writeFileSync(full, bytes);
      }
      run(root);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }

  it('finds nested images, reports forward-slash repo-relative paths, and ignores non-images', () => {
    withTree(
      { 'public/relics/a.png': makePng(6), 'public/deep/er/b.webp': webpLossy(), 'public/data.json': Buffer.from('{}'), 'notes.md': Buffer.from('x') },
      (root) => expect(listImageFiles(root)).toEqual(['public/deep/er/b.webp', 'public/relics/a.png']),
    );
  });

  it('returns paths sorted by path, not in directory-walk order', () => {
    // Walking "a/" before "a.png" gives ['a/b.png', 'a.png']; sorted by path it is the reverse.
    withTree({ 'a/b.png': makePng(6), 'a.png': makePng(6), 'zz/c.png': makePng(6) }, (root) => {
      expect(listImageFiles(root)).toEqual(['a.png', 'a/b.png', 'zz/c.png']);
    });
  });

  it('skips node_modules, dot folders, build output and symlinks, so it is fast and cannot loop', () => {
    withTree(
      {
        'public/ok.png': makePng(6),
        'node_modules/pkg/x.png': makePng(6),
        '.next/cache/y.png': makePng(6),
        '.claude/worktrees/z.png': makePng(6),
        'dist/w.png': makePng(6),
      },
      (root) => {
        symlinkSync(path.join(root, 'public'), path.join(root, 'link-to-public'));
        expect(listImageFiles(root)).toEqual(['public/ok.png']);
      },
    );
  });

  it('reports the problems it finds, including a new cut-out that is a JPEG', () => {
    withTree({ 'public/relics/new.png': JPEG, 'public/assets/fine.png': makePng(2) }, (root) => {
      const result = scanImageAssets(root);
      expect(result.scanned).toBe(2);
      expect(result.problems.map((problem) => [problem.path, problem.code])).toEqual([['public/relics/new.png', 'FORMAT_MISMATCH']]);
    });
  });
});

// ── Repo-wide ratchet ───────────────────────────────────────────────────────────
//
// KNOWN_BROKEN_IMAGES (image-asset-scan.ts) is EMPTY and may only ever shrink: a
// new offender fails here, and a listed file that has been fixed must be removed.
// It once listed twelve files, including the eight relics that, copied into the
// Native app, broke Android build 46; they were replaced with real transparent
// cut-outs on 2026-10-08.
describe('repo image assets', () => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const { scanned, problems } = scanImageAssets(root);
  const known = new Set(KNOWN_BROKEN_IMAGES);

  it('scans a plausible number of images (guards against the walk silently finding none)', () => {
    expect(scanned).toBeGreaterThan(150);
  });

  it('has no image problems beyond the known-broken list', () => {
    const fresh = problems.filter((problem) => !known.has(problem.path));
    expect(
      fresh.map((problem) => `${problem.code} ${problem.path}: ${problem.message}`),
      'New image problems. Fix the artwork; do not add it to KNOWN_BROKEN_IMAGES.',
    ).toEqual([]);
  });

  it('lists only files that are still broken, so the list shrinks as art is fixed', () => {
    const stillBroken = new Set(problems.map((problem) => problem.path));
    const fixed = KNOWN_BROKEN_IMAGES.filter((file) => !stillBroken.has(file));
    expect(fixed, 'These are fixed now: delete them from KNOWN_BROKEN_IMAGES.').toEqual([]);
  });

  it('keeps the list sorted and free of duplicates', () => {
    expect([...KNOWN_BROKEN_IMAGES]).toEqual([...new Set(KNOWN_BROKEN_IMAGES)].sort());
  });
});
