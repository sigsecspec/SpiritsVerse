import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import toIco from 'to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');
const svg = readFileSync(resolve(publicDir, 'logo.svg'));

const sizes = [
  { name: 'pwa-512.png', size: 512 },
  { name: 'pwa-192.png', size: 192 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-48.png', size: 48 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon-16.png', size: 16 },
  // Legacy names used by vite-plugin-pwa config
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'favicon-32x32.png', size: 32 },
];

for (const { name, size } of sizes) {
  await sharp(svg).resize(size, size).png().toFile(resolve(publicDir, name));
  console.log(`Generated public/${name}`);
}

const icoBuffers = [16, 32, 48].map((size) =>
  readFileSync(resolve(publicDir, `favicon-${size}.png`))
);
writeFileSync(resolve(publicDir, 'favicon.ico'), await toIco(icoBuffers));
console.log('Generated public/favicon.ico');

console.log('Generated SpiritsVerse icons in public/.');
