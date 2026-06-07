import sharp from 'sharp';
import { readFileSync } from 'fs';
const svg = readFileSync('assets/icons/icon.svg');

const maskable = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f4f3c"/><stop offset="1" stop-color="#0b3d2e"/></linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2c14e"/><stop offset="1" stop-color="#b4861e"/></linearGradient></defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <g transform="translate(256 256) scale(0.78) translate(-256 -256)">
    <path d="M256 78l138 52v98c0 92-60 155-138 184-78-29-138-92-138-184v-98z" fill="#13654d" stroke="url(#gold)" stroke-width="12"/>
    <g stroke="#f2c14e" stroke-width="15" stroke-linecap="round" fill="none"><path d="M204 168c64 30 64 146 0 176"/><path d="M308 168c-64 30-64 146 0 176"/></g>
    <g stroke="#bfe0d3" stroke-width="12" stroke-linecap="round"><line x1="204" y1="206" x2="308" y2="206"/><line x1="196" y1="256" x2="316" y2="256"/><line x1="204" y1="306" x2="308" y2="306"/></g>
  </g></svg>`);

await sharp(svg).resize(192, 192).png().toFile('assets/icons/icon-192.png');
await sharp(svg).resize(512, 512).png().toFile('assets/icons/icon-512.png');
await sharp(maskable).resize(512, 512).png().toFile('assets/icons/icon-maskable-512.png');
await sharp(svg).resize(1024, 1024).png().toFile('assets/icons/icon-1024.png');
await sharp(svg).resize(32, 32).png().toFile('assets/icons/favicon-32.png');
console.log('icons generated');
