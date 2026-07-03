import { readFile, writeFile } from 'node:fs/promises';
import { minify } from 'html-minifier-terser';

// These public files are the canonical served sources. The app route serves
// public/landing.html directly, so minify in place and keep source drift out.
const files = [
  'public/landing.html',
  'public/ig-posts-preview.html',
];

const options = {
  collapseBooleanAttributes: true,
  collapseWhitespace: true,
  conservativeCollapse: true,
  decodeEntities: false,
  keepClosingSlash: true,
  minifyCSS: true,
  minifyJS: true,
  removeAttributeQuotes: false,
  removeComments: true,
  removeEmptyAttributes: false,
  removeOptionalTags: false,
  sortAttributes: false,
  sortClassName: false,
};

for (const file of files) {
  const source = await readFile(file, 'utf8');
  const output = (await minify(source, options)).trimEnd();
  await writeFile(file, `${output}\n`);
  const beforeKb = (Buffer.byteLength(source) / 1024).toFixed(1);
  const afterKb = (Buffer.byteLength(output) / 1024).toFixed(1);
  console.log(`${file}: ${beforeKb} KiB -> ${afterKb} KiB`);
}
