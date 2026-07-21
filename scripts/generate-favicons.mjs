// Generates PNG/ICO favicons + Apple touch icon from public/favicon.svg so
// Google search results and legacy pickers show the K mark instead of a stale
// Astro rocket (SVG-only <link> is ignored by Google's favicon crawler).
// Run: node scripts/generate-favicons.mjs
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";

const svg = readFileSync("public/favicon.svg");

async function png(size, name) {
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(`public/${name}`);
  console.log(`wrote public/${name}`);
}

await png(16, "favicon-16.png");
await png(32, "favicon-32.png");
await png(48, "favicon-48.png");
await png(180, "apple-touch-icon.png");

// ICO: a single-image ICO file wrapping the 32×32 PNG.
const png32 = await sharp(svg, { density: 384 })
  .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // type = ICO
icoHeader.writeUInt16LE(1, 4); // 1 image

const dir = Buffer.alloc(16);
dir.writeUInt8(32, 0); // width
dir.writeUInt8(32, 1); // height
dir.writeUInt8(0, 2); // colors in palette (0 = no palette)
dir.writeUInt8(0, 3); // reserved
dir.writeUInt16LE(1, 4); // color planes
dir.writeUInt16LE(32, 6); // bits per pixel
dir.writeUInt32LE(png32.length, 8); // image size
dir.writeUInt32LE(6 + 16, 12); // image offset (header + 1 dir entry)

writeFileSync("public/favicon.ico", Buffer.concat([icoHeader, dir, png32]));
console.log("wrote public/favicon.ico");