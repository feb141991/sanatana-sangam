import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SIZES = [
  { width: 2048, height: 2732, name: '12.9" iPad Pro' },
  { width: 1668, height: 2388, name: '11" iPad Pro' },
  { width: 1536, height: 2048, name: '9.7" iPad' },
  { width: 1668, height: 2224, name: '10.5" iPad Air' },
  { width: 1620, height: 2160, name: '10.2" iPad' },
  { width: 1290, height: 2796, name: 'iPhone 14 Pro Max' },
  { width: 1179, height: 2556, name: 'iPhone 14 Pro' },
  { width: 1284, height: 2778, name: 'iPhone 14 Plus' },
  { width: 1170, height: 2532, name: 'iPhone 14' },
  { width: 1125, height: 2436, name: 'iPhone X/XS' },
  { width: 1242, height: 2688, name: 'iPhone XS Max' },
  { width: 828,  height: 1792, name: 'iPhone XR/11' },
  { width: 750,  height: 1334, name: 'iPhone 8' },
  { width: 640,  height: 1136, name: 'iPhone SE 1st gen' },
];

async function generateSplashes() {
  const inputIconPath = path.join(process.cwd(), 'public/icons/icon-512x512.png');
  const outputDir = path.join(process.cwd(), 'public/splash');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created directory: ${outputDir}`);
  }

  if (!fs.existsSync(inputIconPath)) {
    console.error(`Error: Base icon not found at ${inputIconPath}`);
    process.exit(1);
  }

  console.log(`Using base icon: ${inputIconPath}`);
  console.log('Generating splash screens...');

  // Pre-resize the icon to 180x180 so we don't do it repeatedly
  const iconBuffer = await sharp(inputIconPath)
    .resize(180, 180)
    .toBuffer();

  // Pre-generate the SVG text buffer
  const textSvg = `
    <svg width="400" height="80" viewBox="0 0 400 80">
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Georgia, serif" font-size="28" font-weight="bold" fill="#ffffff">Shoonaya</text>
    </svg>
  `;
  const textBuffer = Buffer.from(textSvg);

  const iconWidth = 180;
  const iconHeight = 180;
  const gap = 24;
  const textWidth = 400;
  const textHeight = 80;
  const totalContentHeight = iconHeight + gap + textHeight;

  for (const size of SIZES) {
    const { width, height, name } = size;
    const outputPath = path.join(outputDir, `${width}x${height}.png`);

    const iconTop = Math.round((height - totalContentHeight) / 2);
    const iconLeft = Math.round((width - iconWidth) / 2);

    const textTop = iconTop + iconHeight + gap;
    const textLeft = Math.round((width - textWidth) / 2);

    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 12, g: 10, b: 6, alpha: 1 }, // #0c0a06
      },
    })
      .composite([
        { input: iconBuffer, top: iconTop, left: iconLeft },
        { input: textBuffer, top: textTop, left: textLeft },
      ])
      .png()
      .toFile(outputPath);

    console.log(`✓ Generated ${width}x${height}.png for ${name}`);
  }

  console.log('✨ All splash screens generated successfully.');
}

generateSplashes().catch((err) => {
  console.error('An error occurred during generation:', err);
  process.exit(1);
});
