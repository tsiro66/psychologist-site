// Generates public/og.jpg (1200×630) for social previews.
// Run: node scripts/generate-og.mjs
import sharp from "sharp";
import { readFileSync } from "node:fs";

const W = 1200;
const H = 630;

const bg = readFileSync("src/assets/bg.jpg");
const logo = readFileSync("public/logo.png");

// Dark gradient overlay (top transparent -> bottom dark) for text legibility.
const overlay = Buffer.from(
  `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0b1a3a" stop-opacity="0.55"/>
        <stop offset="0.55" stop-color="#0b1a3a" stop-opacity="0.35"/>
        <stop offset="1" stop-color="#0b1a3a" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
  </svg>`,
);

// Logo: white knock-out version for dark background. The source logo is black;
// tint it to near-white by compositing a white rect over it using "dest-in"
// alpha mask trick is complex — instead use opacity + brightness via SVG filter.
// Simpler: render logo at ~360px, white. We composite the black logo with
// "invert" via sharp negate to get a white silhouette.
const logoLayer = await sharp(logo)
  .negate(true)
  .resize({ width: 360, fit: "inside" })
  .toBuffer();

// Text SVG (Greek). Syne-ish sans; fall back to system sans.
const text = Buffer.from(
  `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <text x="80" y="430" font-family="'Source Serif 4', Georgia, serif"
          font-size="64" font-weight="600" fill="#e8eefc">Κατερίνα Κρητικού</text>
    <text x="80" y="486" font-family="'Google Sans', Arial, sans-serif"
          font-size="30" font-weight="500" fill="#8aa4d6">Σύμβουλος Ψυχικής Υγείας · Ηλιούπολη</text>
  </svg>`,
);

await sharp(bg)
  .resize(W, H, { fit: "cover", position: "centre" })
  .composite([
    { input: overlay, left: 0, top: 0 },
    { input: logoLayer, left: 420, top: 90 },
    { input: text, left: 0, top: 0 },
  ])
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile("public/og.jpg");

console.log("✓ public/og.jpg generated (1200×630)");
