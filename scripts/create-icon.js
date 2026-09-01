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
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

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

// Generate high quality 512x512 Storefront & Retail Icon (Toko / Supermarket)
const width = 512, height = 512;
const pngBuffer = createPNG(width, height, (x, y, w, h) => {
  const rCorner = 110;
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

  if (!inBox) return [0, 0, 0, 0]; // Transparent outside badge

  // Emerald Green Gradient Background (#059669 -> #047857)
  const gradT = y / h;
  let bgR = Math.round(5 + (4 - 5) * gradT);
  let bgG = Math.round(150 + (120 - 150) * gradT);
  let bgB = Math.round(105 + (87 - 105) * gradT);

  // STOREFRONT (TOKO) GEOMETRY:
  // 1. Awning (Atap Kanopi Toko Garis-Garis): y in [140, 240], x in [110, 402]
  // Awning top roofline: x in [130, 382], y = 140
  // Awning bottom: y = 240, scalloped waves
  if (y >= 140 && y <= 240 && x >= 110 && x <= 402) {
    // 5 Awning stripes
    const stripeWidth = (402 - 110) / 5;
    const stripeIndex = Math.floor((x - 110) / stripeWidth);
    const stripeOffset = (x - 110) % stripeWidth;

    // Scalloped bottom edge
    const scallopRadius = stripeWidth / 2;
    const scallopCenterX = 110 + stripeIndex * stripeWidth + scallopRadius;
    const isScallopBottom = (y > 220 && Math.hypot(x - scallopCenterX, y - 220) > scallopRadius);

    if (!isScallopBottom) {
      if (stripeIndex % 2 === 0) {
        return [255, 255, 255, 255]; // White awning stripe
      } else {
        return [251, 191, 36, 255]; // Amber golden stripe
      }
    }
  }

  // 2. Store Body (Dinding & Etalase Toko): y in [240, 385], x in [128, 384]
  if (y >= 240 && y <= 385 && x >= 128 && x <= 384) {
    // Left display window: x in [148, 230], y in [260, 345]
    const inLeftWindow = (x >= 148 && x <= 230 && y >= 260 && y <= 345);
    // Right Door: x in [256, 364], y in [260, 385]
    const inDoor = (x >= 256 && x <= 364 && y >= 260 && y <= 385);

    if (inLeftWindow) {
      return [217, 249, 157, 255]; // Soft bright glass window
    }
    if (inDoor) {
      // Door window & handle
      if (x >= 272 && x <= 348 && y >= 276 && y <= 340) {
        return [255, 255, 255, 255]; // Glass pane on door
      }
      if (x >= 270 && x <= 278 && y >= 345 && y <= 360) {
        return [251, 191, 36, 255]; // Gold door handle
      }
      return [241, 245, 249, 255]; // Door frame
    }

    return [255, 255, 255, 255]; // White store walls
  }

  // 3. Store Base Foundation Line: y in [385, 398], x in [116, 396]
  if (y >= 385 && y <= 398 && x >= 116 && x <= 396) {
    return [255, 255, 255, 255];
  }

  return [bgR, bgG, bgB, 255];
});

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

fs.writeFileSync(path.join(publicDir, 'favicon.png'), pngBuffer);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), pngBuffer);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), pngBuffer);
fs.writeFileSync(path.join(publicDir, 'logo.png'), pngBuffer);

// Crisp, Professional Storefront & Shop Awning SVG (100% Tidak Mirip Gembok!)
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Background Rounded Badge -->
  <rect x="36" y="36" width="440" height="440" rx="110" fill="url(#bgGrad)"/>

  <!-- Storefront Group with Shadow -->
  <g filter="url(#shadow)">
    <!-- Store Base Building Wall -->
    <rect x="130" y="235" width="252" height="150" fill="#ffffff" rx="10"/>

    <!-- Left Store Window Display -->
    <rect x="152" y="260" width="84" height="84" rx="8" fill="#ecfdf5" stroke="#059669" stroke-width="6"/>
    <!-- Window Cross Glazing -->
    <line x1="194" y1="260" x2="194" y2="344" stroke="#059669" stroke-width="4"/>
    <line x1="152" y1="302" x2="236" y2="302" stroke="#059669" stroke-width="4"/>

    <!-- Right Entrance Door -->
    <rect x="256" y="260" width="108" height="125" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="5"/>
    <rect x="270" y="274" width="80" height="66" rx="6" fill="#ecfeff" stroke="#0891b2" stroke-width="4"/>
    <!-- Door Golden Handle -->
    <circle cx="274" cy="354" r="5" fill="#f59e0b"/>

    <!-- Ground Floor Base Line -->
    <rect x="114" y="385" width="284" height="14" rx="7" fill="#ffffff"/>

    <!-- Store Awning / Canopy Roof (Kanopi Garis-Garis Khas Toko) -->
    <!-- Awning Main Shadow / Backing -->
    <path d="M106 172 L128 140 L384 140 L406 172 Z" fill="#f1f5f9"/>

    <!-- Awning Stripes (Garis Putih & Kuning Emas Toko) -->
    <polygon points="106,172 128,140 179,140 166,220 106,220" fill="#ffffff"/>
    <polygon points="179,140 230,140 226,220 166,220" fill="#f59e0b"/>
    <polygon points="230,140 282,140 286,220 226,220" fill="#ffffff"/>
    <polygon points="282,140 333,140 346,220 286,220" fill="#f59e0b"/>
    <polygon points="333,140 384,140 406,220 346,220" fill="#ffffff"/>

    <!-- Awning Bottom Scallops (Rumbai-rumbai Kanopi Toko) -->
    <path d="M106 220 Q136 244 166 220 Q196 244 226 220 Q256 244 286 220 Q316 244 346 220 Q376 244 406 220" fill="none" stroke="#e2e8f0" stroke-width="4"/>
    <path d="M106 220 Q136 244 166 220" fill="#ffffff"/>
    <path d="M166 220 Q196 244 226 220" fill="#f59e0b"/>
    <path d="M226 220 Q256 244 286 220" fill="#ffffff"/>
    <path d="M286 220 Q316 244 346 220" fill="#f59e0b"/>
    <path d="M346 220 Q376 244 406 220" fill="#ffffff"/>

    <!-- Store Signboard "TG" (Toko Grafika) -->
    <rect x="206" y="112" width="100" height="34" rx="8" fill="#ffffff" stroke="#f59e0b" stroke-width="3"/>
    <text x="256" y="136" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="20" fill="#059669" text-anchor="middle" letter-spacing="2">TG</text>
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf8');

console.log('✅ Generated new STOREFRONT (Toko Ritel) favicon.png and favicon.svg successfully!');
