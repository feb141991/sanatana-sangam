import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const canonical = resolve(process.cwd(), 'contracts/observance-series-contract.ts');
const native = resolve(process.cwd(), '../../shoonaya-mobile/lib/observance-series-contract.generated.ts');
const canonicalBytes = readFileSync(canonical);
const nativeBytes = readFileSync(native);
const equal = canonicalBytes.equals(nativeBytes);

console.log(JSON.stringify({
  canonical,
  native,
  canonicalBytes: canonicalBytes.length,
  nativeBytes: nativeBytes.length,
  byteIdentical: equal,
}, null, 2));

if (!equal) process.exitCode = 1;
