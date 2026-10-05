import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildLlmsFull } from '../src/lib/seo/llms-full';

const indexPath = resolve(process.cwd(), 'public/llms.txt');
const outputPath = resolve(process.cwd(), 'public/llms-full.txt');
const output = buildLlmsFull(readFileSync(indexPath, 'utf8'));

writeFileSync(outputPath, output, 'utf8');
console.log(`Generated public/llms-full.txt (${Buffer.byteLength(output, 'utf8')} bytes)`);
