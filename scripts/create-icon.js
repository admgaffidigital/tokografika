const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Pure Node.js uncompressed / deflated PNG generator
function createPNG(width, height, pixelFn) {
  const rowSize = width * 4;
  const rawData = Buffer.alloc(height * (rowSize + 1));

  let pos = 0;
  for (let y = 0; y < height; y++) {
    rawData[pos++] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      rawData[pos++] = r;
      rawData[pos++] = g;
      rawData[pos++] = b;
      rawData[pos++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(len + 12);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.slice(4, len + 8));
  chunk.writeUInt32BE(crc, len + 8);
  return chunk;
}

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

// Generate high quality 512x512 store icon
const width = 512, height = 512;
const pngBuffer = createPNG(width, height, (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const rCorner = 110;

  // Rounded rectangle check for badge
  const boxL = 36, boxT = 36, boxR = w - 36, boxB = h - 36;
  let inBox = false;

  if (x >= boxL + rCorner && x <= boxR - rCorner && y >= boxT && y <= boxB) inBox = true;
  else if (x >= boxL && x <= boxR && y >= boxT + rCorner && y <= boxB - rCorner) inBox = true;
  else {
    const cxs = [boxL + rCorner, boxR - rCorner];
    const cys = [boxT + rCorner, boxB - rCorner];
    for (const cornerX of cxs) {
      for (const cornerY of cys) {
        if (Math.hypot(x - cornerX, y - cornerY) <= rCorner) inBox = true;
      }
    }
  }

  if (!inBox) return [0, 0, 0, 0]; // Transparent background

  // Emerald green gradient background (#059669 -> #047857)
  const gradT = y / h;
  let r = Math.round(5 + (4 - 5) * gradT);
  let g = Math.round(150 + (120 - 150) * gradT);
  let b = Math.round(105 + (87 - 105) * gradT);

  // Draw Shopping Bag Emblem in white
  // Bag body: x in [156, 356], y in [220, 410], radius 30
  const bagL = 156, bagR = 356, bagT = 210, bagB = 400, bagRad = 35;
  let inBag = false;
  if (x >= bagL + bagRad && x <= bagR - bagRad && y >= bagT && y <= bagB) inBag = true;
  else if (x >= bagL && x <= bagR && y >= bagT + bagRad && y <= bagB - bagRad) inBag = true;
  else {
    const bcxs = [bagL + bagRad, bagR - bagRad];
    const bcys = [bagT + bagRad, bagB - bagRad];
    for (const cornerX of bcxs) {
      for (const cornerY of bcys) {
        if (Math.hypot(x - cornerX, y - cornerY) <= bagRad) inBag = true;
      }
    }
  }

  // Bag handle (Arch) at top
  const handleCy = 210, handleRadius = 60, handleThick = 18;
  const distFromHandle = Math.hypot(x - cx, y - handleCy);
  let inHandle = (distFromHandle >= handleRadius - handleThick / 2 && distFromHandle <= handleRadius + handleThick / 2 && y <= handleCy);

  if (inBag || inHandle) {
    // Bag interior icon: letter 'G' or shop checkmark
    // Subtle inner shadow / details
    const innerL = 200, innerR = 312, innerT = 265, innerB = 345;
    if (x >= innerL && x <= innerR && y >= innerT && y <= innerB) {
      // Draw store checkmark / star / smiley in emerald
      const checkDist = Math.hypot(x - cx, y - 305);
      if (checkDist < 36) {
        return [5, 150, 105, 255]; // Emerald accent inside bag
      }
    }
    return [255, 255, 255, 255]; // White bag
  }

  return [r, g, b, 255];
});

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

fs.writeFileSync(path.join(publicDir, 'favicon.png'), pngBuffer);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), pngBuffer);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), pngBuffer);
fs.writeFileSync(path.join(publicDir, 'logo.png'), pngBuffer);

// Also create an SVG favicon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
  </defs>
  <rect x="36" y="36" width="440" height="440" rx="110" fill="url(#grad)"/>
  <path d="M196 210 A60 60 0 0 1 316 210" fill="none" stroke="#ffffff" stroke-width="22" stroke-linecap="round"/>
  <rect x="156" y="210" width="200" height="190" rx="35" fill="#ffffff"/>
  <circle cx="256" cy="305" r="32" fill="#059669"/>
  <path d="M244 305 L252 313 L268 297" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf8');

console.log('✅ Generated public/favicon.png, icon-512.png, icon-192.png, logo.png, and favicon.svg successfully!');
