import sharp from 'sharp';

interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
}

/** Gera um SVG com o texto repetido em diagonal, usado como marca d'água. */
function watermarkSvg(width: number, height: number, text = 'PHOTO MARKETPLACE • PREVIEW'): string {
  const tile = Math.max(220, Math.floor(width / 5));
  const fontSize = Math.max(16, Math.floor(tile / 11));

  return `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="wm" width="${tile}" height="${tile}" patternUnits="userSpaceOnUse" patternTransform="rotate(-32)">
        <text x="0" y="${tile / 2}" font-family="Helvetica, Arial, sans-serif" font-size="${fontSize}"
          fill="rgba(255,255,255,0.55)" stroke="rgba(0,0,0,0.25)" stroke-width="0.5" font-weight="700">
          ${text}
        </text>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#wm)" />
    <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.06)" />
  </svg>`;
}

/** Calcula as dimensões de saída de um resize por largura máxima, preservando a proporção. */
function targetDimensions(origWidth: number, origHeight: number, maxWidth: number) {
  const scale = Math.min(1, maxWidth / origWidth);
  return { width: Math.round(origWidth * scale), height: Math.round(origHeight * scale) };
}

/** Redimensiona e aplica marca d'água diagonal — usado na imagem de pré-visualização pública. */
export async function createWatermarkedPreview(input: Buffer, maxWidth = 1600): Promise<ProcessedImage> {
  const meta = await sharp(input).rotate().metadata();
  const { width, height } = targetDimensions(meta.width ?? maxWidth, meta.height ?? maxWidth, maxWidth);

  const overlay = Buffer.from(watermarkSvg(width, height));

  const buffer = await sharp(input)
    .rotate()
    .resize({ width, height, fit: 'fill' })
    .composite([{ input: overlay, gravity: 'center' }])
    .jpeg({ quality: 82 })
    .toBuffer();

  return { buffer, width, height };
}

/** Gera uma thumbnail pequena (para grids/listagens), também com marca d'água leve. */
export async function createThumbnail(input: Buffer, maxWidth = 480): Promise<ProcessedImage> {
  const meta = await sharp(input).rotate().metadata();
  const { width, height } = targetDimensions(meta.width ?? maxWidth, meta.height ?? maxWidth, maxWidth);

  const overlay = Buffer.from(watermarkSvg(width, height));

  const buffer = await sharp(input)
    .rotate()
    .resize({ width, height, fit: 'fill' })
    .composite([{ input: overlay, gravity: 'center' }])
    .jpeg({ quality: 75 })
    .toBuffer();

  return { buffer, width, height };
}

/** Metadados da imagem original, sem nenhuma modificação — usada para a versão HD comprada. */
export async function readOriginalMeta(input: Buffer): Promise<{ width: number; height: number }> {
  const meta = await sharp(input).rotate().metadata();
  return { width: meta.width ?? 0, height: meta.height ?? 0 };
}
