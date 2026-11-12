// Zero-dependency container parsers used to audit that output images carry no metadata.
// Both parsers are allowlist based and fail closed: anything they cannot parse is reported as 'MALFORMED'.

export function sniff(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.length >= 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  return 'unknown';
}

// JPEG markers that may appear: APP0 (JFIF), DQT, DHT, DRI, SOS and the SOF frame headers (not DHT C4, JPG C8, DAC CC).
const JPEG_ALLOWED = new Set([0xe0, 0xdb, 0xc4, 0xdd, 0xda, 0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

// JPEG: walk every segment through the entropy-coded scans up to EOI. COM and APP1-APP15 are forbidden,
// anything outside the allowlist, a broken length, a missing EOI or bytes after EOI count as MALFORMED.
export function jpegMeta(buf) {
  if (sniff(buf) !== 'jpeg') throw new Error('not jpeg');
  const bad = new Set();
  let i = 2;
  let sawEoi = false;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { bad.add('MALFORMED'); break; }
    while (i < buf.length && buf[i] === 0xff) i += 1; // fill bytes
    const marker = buf[i];
    i += 1;
    if (marker === undefined) { bad.add('MALFORMED'); break; }
    if (marker === 0xd9) { // EOI
      sawEoi = true;
      if (i !== buf.length) bad.add('TRAILING');
      break;
    }
    if (i + 2 > buf.length) { bad.add('MALFORMED'); break; }
    const len = buf.readUInt16BE(i);
    if (len < 2 || i + len > buf.length) { bad.add('MALFORMED'); break; }
    if (marker === 0xfe) bad.add('COM');
    else if (marker >= 0xe1 && marker <= 0xef) bad.add(`APP${marker - 0xe0}`);
    else if (!JPEG_ALLOWED.has(marker)) bad.add('MALFORMED');
    i += len;
    if (marker === 0xda) {
      // skip entropy-coded data: 0xFF00 stuffing, RSTn and fill bytes belong to the scan, any other marker ends it
      while (i + 1 < buf.length) {
        if (buf[i] === 0xff && buf[i + 1] !== 0x00 && !(buf[i + 1] >= 0xd0 && buf[i + 1] <= 0xd7) && buf[i + 1] !== 0xff) break;
        i += 1;
      }
      if (i + 1 >= buf.length) { bad.add('MALFORMED'); break; }
    }
  }
  if (!sawEoi) bad.add('MALFORMED');
  return [...bad];
}

// WebP: walk RIFF chunks after "WEBP". EXIF, XMP and ICCP chunks are forbidden; VP8X flag bits are checked too.
// A chunk that runs past the end of the file, a RIFF size that disagrees with the file or leftover bytes are MALFORMED.
export function webpMeta(buf) {
  if (sniff(buf) !== 'webp') throw new Error('not webp');
  const bad = new Set();
  if (buf.readUInt32LE(4) + 8 !== buf.length) bad.add('MALFORMED');
  let i = 12;
  while (i < buf.length) {
    if (i + 8 > buf.length) { bad.add('MALFORMED'); break; }
    const id = buf.toString('latin1', i, i + 4);
    const len = buf.readUInt32LE(i + 4);
    if (i + 8 + len > buf.length) { bad.add('MALFORMED'); break; }
    if (id === 'EXIF' || id === 'XMP ' || id === 'ICCP') bad.add(id.trim());
    if (id === 'VP8X' && len >= 1) {
      const flags = buf[i + 8];
      if (flags & 0x20) bad.add('ICCP');
      if (flags & 0x08) bad.add('EXIF');
      if (flags & 0x04) bad.add('XMP');
    }
    i += 8 + len + (len & 1);
  }
  return [...bad];
}
