// Synthetic UI images for the optimise-images self-test. Generated in memory only, never written here.
// This is the ONLY repo file allowed to attach metadata (it builds metadata-positive test inputs).
import sharp from 'sharp';

const FMT = { png: 'png', jpeg: 'jpeg', jpg: 'jpeg', webp: 'webp' };

function uiSvg(width, height, label) {
  const bars = [];
  const rows = Math.max(3, Math.floor(height / 120));
  for (let i = 0; i < rows; i++) {
    const y = 20 + i * 110;
    if (y + 40 > height) break;
    bars.push(`<rect x="24" y="${y}" width="${Math.round(width * (0.3 + 0.12 * (i % 4)))}" height="40" fill="#d1d5db"/>`);
  }
  const fs = Math.max(16, Math.min(64, Math.round(width / 20)));
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
      `<rect width="100%" height="100%" fill="#f3f4f6"/>${bars.join('')}` +
      `<rect x="${Math.round(width * 0.6)}" y="${Math.round(height * 0.5)}" width="${Math.round(width * 0.3)}" height="${Math.round(height * 0.25)}" fill="#e11d48"/>` +
      `<text x="24" y="${Math.round(height * 0.9)}" font-size="${fs}" font-family="sans-serif" fill="#ff7a00">${label}</text>` +
      `</svg>`
  );
}

export async function makeUiImage({ width, height, label = 'Sample', format = 'png', orientation, withMeta = false }) {
  let img = sharp(uiSvg(width, height, label)).removeAlpha();
  if (withMeta) {
    img = img.withMetadata({
      exif: { IFD0: { Software: 'testtool' } },
      icc: 'p3',
      ...(orientation ? { orientation } : {}),
    });
  } else if (orientation) {
    img = img.withMetadata({ orientation });
  }
  const f = FMT[format];
  if (!f) throw new Error('unknown fixture format');
  return img.toFormat(f).toBuffer();
}

export async function makeMetaPositive(format) {
  const f = FMT[format];
  if (f !== 'jpeg' && f !== 'webp') throw new Error('meta-positive supports jpeg and webp');
  return sharp(uiSvg(64, 48, 'Meta'))
    .removeAlpha()
    .withMetadata({ exif: { IFD0: { Software: 'testtool' } }, icc: 'p3' })
    .toFormat(f)
    .toBuffer();
}
