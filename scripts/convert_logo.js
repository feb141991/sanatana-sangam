const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, '../public/icons/logo.jpg');
const outputDir = path.join(__dirname, '../public/icons');

const targets = [
  { file: 'logo.png', size: 1024 },
  { file: 'icon-192x192.png', size: 192 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512x512.png', size: 512 },
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-1024x1024.png', size: 1024 },
  { file: 'adaptive-icon.png', size: 1024 }
];

async function run() {
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found at ${inputPath}`);
    process.exit(1);
  }

  for (const target of targets) {
    const outputPath = path.join(outputDir, target.file);
    await sharp(inputPath)
      .resize(target.size, target.size)
      .png()
      .toFile(outputPath);
    console.log(`Generated ${target.file} (${target.size}x${target.size})`);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
