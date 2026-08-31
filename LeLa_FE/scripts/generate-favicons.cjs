const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function decodePNG(buffer) {
  let pos = 8;
  let width, height, bitDepth, colorType;
  let idatBuffers = [];
  while (pos < buffer.length) {
    const length = buffer.readUInt32BE(pos);
    const type = buffer.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') {
      width = buffer.readUInt32BE(pos + 8);
      height = buffer.readUInt32BE(pos + 12);
      bitDepth = buffer[pos + 16];
      colorType = buffer[pos + 17];
    } else if (type === 'IDAT') {
      idatBuffers.push(buffer.subarray(pos + 8, pos + 8 + length));
    } else if (type === 'IEND') break;
    pos += 12 + length;
  }
  const compressed = Buffer.concat(idatBuffers);
  const raw = zlib.inflateSync(compressed);
  const bytesPerPixel = 4;
  const stride = 1 + width * bytesPerPixel;
  const pixels = Buffer.alloc(width * height * 4);
  let prevRow = Buffer.alloc(width * bytesPerPixel);
  let currRow = Buffer.alloc(width * bytesPerPixel);

  for (let y = 0; y < height; y++) {
    const filterType = raw[y * stride];
    const scanline = raw.subarray(y * stride + 1, (y + 1) * stride);
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < bytesPerPixel; c++) {
        const idx = x * bytesPerPixel + c;
        const rawByte = scanline[idx];
        const a = x > 0 ? currRow[(x - 1) * bytesPerPixel + c] : 0;
        const b = prevRow[idx];
        const cPixel = x > 0 ? prevRow[(x - 1) * bytesPerPixel + c] : 0;
        let val = 0;
        if (filterType === 0) val = rawByte;
        else if (filterType === 1) val = (rawByte + a) & 0xff;
        else if (filterType === 2) val = (rawByte + b) & 0xff;
        else if (filterType === 3) val = (rawByte + Math.floor((a + b) / 2)) & 0xff;
        else if (filterType === 4) {
          const p = a + b - cPixel;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - cPixel);
          let pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : cPixel);
          val = (rawByte + pr) & 0xff;
        }
        currRow[idx] = val;
      }
    }
    currRow.copy(pixels, y * width * 4);
    prevRow.set(currRow);
  }
  return { width, height, pixels };
}

function resizeBilinear(src, targetW, targetH) {
  const dst = Buffer.alloc(targetW * targetH * 4);
  const xRatio = src.width / targetW;
  const yRatio = src.height / targetH;

  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const gx = (x + 0.5) * xRatio - 0.5;
      const gy = (y + 0.5) * yRatio - 0.5;
      const gxi = Math.floor(gx);
      const gyi = Math.floor(gy);
      const xDiff = Math.max(0, Math.min(1, gx - gxi));
      const yDiff = Math.max(0, Math.min(1, gy - gyi));

      const x0 = Math.max(0, Math.min(src.width - 1, gxi));
      const x1 = Math.max(0, Math.min(src.width - 1, gxi + 1));
      const y0 = Math.max(0, Math.min(src.height - 1, gyi));
      const y1 = Math.max(0, Math.min(src.height - 1, gyi + 1));

      for (let c = 0; c < 4; c++) {
        const p00 = src.pixels[(y0 * src.width + x0) * 4 + c];
        const p10 = src.pixels[(y0 * src.width + x1) * 4 + c];
        const p01 = src.pixels[(y1 * src.width + x0) * 4 + c];
        const p11 = src.pixels[(y1 * src.width + x1) * 4 + c];

        const top = p00 * (1 - xDiff) + p10 * xDiff;
        const bot = p01 * (1 - xDiff) + p11 * xDiff;
        const val = Math.round(top * (1 - yDiff) + bot * yDiff);
        dst[(y * targetW + x) * 4 + c] = Math.max(0, Math.min(255, val));
      }
    }
  }
  return { width: targetW, height: targetH, pixels: dst };
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crcTable[n] = c;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function encodePNG(img) {
  const stride = 1 + img.width * 4;
  const raw = Buffer.alloc(img.height * stride);
  for (let y = 0; y < img.height; y++) {
    raw[y * stride] = 0;
    img.pixels.copy(raw, y * stride + 1, y * img.width * 4, (y + 1) * img.width * 4);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const combined = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(combined), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(img.width, 0);
  ihdrData.writeUInt32BE(img.height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

function createIco(pngBuffers) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngBuffers.length, 4);

  let offset = 6 + pngBuffers.length * 16;
  const entries = [];
  const imageDatas = [];

  for (const img of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width === 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height === 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    imageDatas.push(img.data);
    offset += img.data.length;
  }
  return Buffer.concat([header, ...entries, ...imageDatas]);
}

const publicDir = path.resolve(__dirname, '../public');
const logoPath = path.join(publicDir, 'images/lela_fox_logo.png');
const masterPng = fs.readFileSync(logoPath);
const decoded = decodePNG(masterPng);

// Generate scaled PNGs
const png16 = encodePNG(resizeBilinear(decoded, 16, 16));
const png32 = encodePNG(resizeBilinear(decoded, 32, 32));
const png48 = encodePNG(resizeBilinear(decoded, 48, 48));
const png64 = encodePNG(resizeBilinear(decoded, 64, 64));
const png180 = encodePNG(resizeBilinear(decoded, 180, 180));
const png192 = encodePNG(resizeBilinear(decoded, 192, 192));
const png512 = encodePNG(resizeBilinear(decoded, 512, 512));

fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), png16);
fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), png32);
fs.writeFileSync(path.join(publicDir, 'favicon.png'), png32);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png180);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);

// Generate ICO
const icoBuf = createIco([
  { width: 16, height: 16, data: png16 },
  { width: 32, height: 32, data: png32 },
  { width: 48, height: 48, data: png48 }
]);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf);

// Generate SVG favicon with embedded high-res Fox Logo
const base64Master = masterPng.toString('base64');
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1254 1254" width="100%" height="100%">
  <image width="1254" height="1254" href="data:image/png;base64,${base64Master}" />
</svg>
`;
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);

console.log('All favicon assets generated successfully in public/');
