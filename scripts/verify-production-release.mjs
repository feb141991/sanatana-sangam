import { execFileSync } from 'node:child_process';

const origin = process.argv[2] || 'https://www.shoonaya.com';
const expectedSha = process.argv[3] || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const response = await fetch(`${origin}/api/release`, { cache: 'no-store' });
if (!response.ok) throw new Error(`Release endpoint returned ${response.status}`);
const release = await response.json();

const clientSha = release?.client?.sha;
const serverSha = release?.server?.sha;
console.log(JSON.stringify({ origin, expectedSha, clientSha, serverSha }, null, 2));

if (clientSha !== expectedSha || serverSha !== expectedSha) {
  console.error('Production release identity does not match the expected commit.');
  process.exit(1);
}
console.log('Production client and server match the expected commit.');
