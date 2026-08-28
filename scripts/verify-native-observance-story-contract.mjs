import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const canonical = resolve(process.cwd(), 'contracts/observance-story-contract.ts');
const native = resolve(process.cwd(), '../../shoonaya-mobile/lib/observance-story-contract.generated.ts');
const canonicalBytes = readFileSync(canonical);
const nativeBytes = readFileSync(native);
const byteIdentical = canonicalBytes.equals(nativeBytes);

console.log(JSON.stringify({ canonical, native, bytes: canonicalBytes.length, byteIdentical }, null, 2));
if (!byteIdentical) process.exitCode = 1;
