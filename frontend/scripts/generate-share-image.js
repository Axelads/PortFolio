const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');

const LOGO_URL = 'https://i.ibb.co/3yDkgD4L/logo-Axel-Gregoire-Modifi-Modifi.png';
const OUTPUT_DIR = path.join(__dirname, '..', 'public');
const SVG_FILE = path.join(OUTPUT_DIR, 'logo_Axel_Gregoire_bubbles.svg');
const PNG_FILE = path.join(OUTPUT_DIR, 'logo_Axel_Gregoire_bubbles.png');

const SIZE = 1024;
const TOTAL_DOTS = 36;
const HUE_OFFSET = 200;
const SATURATION = 85;
const LIGHTNESS = 65;
const LOGO_RATIO = 0.4;
const INNER_RADIUS_RATIO = 0.28;
const OUTER_RADIUS_RATIO = 0.34;
const BIG_DOT = 40;
const SMALL_DOT = 22;

function buildDots() {
  const dots = [];
  const innerR = SIZE * INNER_RADIUS_RATIO;
  const outerR = SIZE * OUTER_RADIUS_RATIO;
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  for (let i = 0; i < TOTAL_DOTS; i++) {
    const angle = (i / TOTAL_DOTS) * 2 * Math.PI - Math.PI / 2;
    const hue = ((i / TOTAL_DOTS) * 360 + HUE_OFFSET) % 360;
    const isEven = i % 2 === 0;
    const radius = isEven ? outerR : innerR;
    const dotSize = isEven ? BIG_DOT : SMALL_DOT;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    dots.push({ x, y, r: dotSize / 2, color: `hsl(${hue}, ${SATURATION}%, ${LIGHTNESS}%)` });
  }
  return dots;
}

function buildSvg(imageHref) {
  const dots = buildDots();
  const logoSize = SIZE * LOGO_RATIO;
  const logoX = (SIZE - logoSize) / 2;
  const logoY = (SIZE - logoSize) / 2;

  const circles = dots
    .map(
      (d) =>
        `<circle cx="${d.x.toFixed(2)}" cy="${d.y.toFixed(2)}" r="${d.r}" fill="${d.color}" style="filter: drop-shadow(0 0 6px ${d.color});"/>`
    )
    .join('\n  ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
  <image href="${imageHref}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>
  ${circles}
</svg>`;
}

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

async function main() {
  console.log('[1/3] Generating browser SVG (external image reference)...');
  const browserSvg = buildSvg(LOGO_URL);
  fs.writeFileSync(SVG_FILE, browserSvg, 'utf8');
  console.log(`      -> ${SVG_FILE}`);

  console.log('[2/3] Downloading logo PNG for base64 embedding...');
  const imageBuffer = await downloadImage(LOGO_URL);
  const dataUri = `data:image/png;base64,${imageBuffer.toString('base64')}`;

  console.log('[3/3] Rendering PNG via sharp...');
  const embeddedSvg = buildSvg(dataUri);
  await sharp(Buffer.from(embeddedSvg)).png().toFile(PNG_FILE);
  console.log(`      -> ${PNG_FILE}`);

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
