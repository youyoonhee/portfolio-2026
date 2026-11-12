// Zero-dependency container parsers used to audit that output images carry no metadata.

export function sniff(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.length >= 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  return 'unknown';
}

// JPEG: walk segments until SOS. APP1 (EXIF/XMP), APP2 (ICC), APP13 (IPTC) are forbidden; APP0 JFIF is fine.
export function jpegMeta(buf) {
  if (sniff(buf) !== 'jpeg') throw new Error('not jpeg');
  const bad = [];
  for (let i = 2; i + 4 <= buf.length; ) {
    if (buf[i] !== 0xff) break;
    const marker = buf[i + 1];
    if (marker === 0xda) break;
    if (marker === 0xff) { i += 1; continue; }
    const len = buf.readUInt16BE(i + 2);
    if (marker === 0xe1 || marker === 0xe2 || marker === 0xed) bad.push(`APP${marker - 0xe0}`);
    i += 2 + len;
  }
  return [...new Set(bad)];
}

// WebP: walk RIFF chunks after "WEBP". EXIF, XMP and ICCP chunks are forbidden; VP8X flag bits are checked too.
export function webpMeta(buf) {
  if (sniff(buf) !== 'webp') throw new Error('not webp');
  const bad = [];
  for (let i = 12; i + 8 <= buf.length; ) {
    const id = buf.toString('latin1', i, i + 4);
    const len = buf.readUInt32LE(i + 4);
    if (id === 'EXIF' || id === 'XMP ' || id === 'ICCP') bad.push(id.trim());
    if (id === 'VP8X' && i + 9 <= buf.length) {
      const flags = buf[i + 8];
      if (flags & 0x20 && !bad.includes('ICCP')) bad.push('ICCP');
      if (flags & 0x08 && !bad.includes('EXIF')) bad.push('EXIF');
      if (flags & 0x04 && !bad.includes('XMP')) bad.push('XMP');
    }
    i += 8 + len + (len & 1);
  }
  return [...new Set(bad)];
}
