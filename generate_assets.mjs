import fs from 'fs';
import sharp from 'sharp';

fs.mkdirSync('assets', { recursive: true });

const svgBuffer = fs.readFileSync('public/favicon.svg');

// Generate 1024x1024 for icon and 2732x2732 for splash
await sharp(svgBuffer)
  .resize(1024, 1024, { fit: 'contain', background: '#000000' })
  .png()
  .toFile('assets/icon.png');

await sharp(svgBuffer)
  .resize(2732, 2732, { fit: 'contain', background: '#000000' })
  .png()
  .toFile('assets/splash.png');

console.log('PNG assets generated successfully.');
