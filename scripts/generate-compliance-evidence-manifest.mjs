import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = process.cwd();
const complianceRoot = resolve(root, 'docs/compliance');
const manifestPath = resolve(complianceRoot, 'evidence/EVIDENCE_MANIFEST.json');
const version = '2026-08-25.v1';

function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) return collectFiles(absolute);
      if (!entry.isFile() || absolute === manifestPath) return [];
      return [absolute];
    });
}

const artifacts = collectFiles(complianceRoot).map((absolute) => {
  const content = readFileSync(absolute);
  return {
    path: relative(root, absolute).split('\\').join('/'),
    sha256: createHash('sha256').update(content).digest('hex'),
    bytes: statSync(absolute).size,
  };
});

const manifest = {
  version,
  generatedAt: `${version.slice(0, 10)}T00:00:00Z`,
  totalArtifacts: artifacts.length,
  artifacts,
};

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ totalArtifacts: artifacts.length, manifest: relative(root, manifestPath) }));
