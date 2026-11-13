import type { PDFPage, RGB } from 'pdf-lib';
import type { PosterPlan } from './plan';
import type { Settings } from './types';

interface ExportOptions {
  image: ImageBitmap;
  plan: PosterPlan;
  settings: Settings;
  onProgress?: (done: number, total: number) => void;
}

const MM_TO_PT = 72 / 25.4;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value;
  const parsed = Number.parseInt(full || 'ffffff', 16);
  return {
    r: ((parsed >> 16) & 255) / 255,
    g: ((parsed >> 8) & 255) / 255,
    b: (parsed & 255) / 255,
  };
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Gagal mengubah halaman menjadi JPEG. Coba turunkan DPI.'));
      },
      'image/jpeg',
      quality,
    );
  });
}

function drawCutMarks(pdfPage: PDFPage, plan: PosterPlan, color: RGB) {
  const length = Math.min(12, plan.margin * 0.8);
  if (length < 1) return;

  const corners: Array<[number, number, number, number]> = [
    [plan.margin, plan.margin, -1, -1],
    [plan.paperW - plan.margin, plan.margin, 1, -1],
    [plan.margin, plan.paperH - plan.margin, -1, 1],
    [plan.paperW - plan.margin, plan.paperH - plan.margin, 1, 1],
  ];

  for (const [x, y, dx, dy] of corners) {
    pdfPage.drawLine({
      start: { x: x + dx * length, y },
      end: { x, y },
      thickness: 0.4,
      color,
    });
    pdfPage.drawLine({
      start: { x, y: y + dy * length },
      end: { x, y },
      thickness: 0.4,
      color,
    });
  }
}

export async function exportPosterPdf({
  image,
  plan,
  settings,
  onProgress,
}: ExportOptions): Promise<Blob> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  doc.setTitle('TilePoster — tiled poster');
  doc.setCreator('TilePoster');
  doc.setProducer('TilePoster');

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const background = hexToRgb(settings.background);
  const scale = settings.dpi / 72;
  const total = plan.pages.length;

  for (const [index, page] of plan.pages.entries()) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(page.window.w * scale));
    canvas.height = Math.max(1, Math.round(page.window.h * scale));

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D tidak tersedia di browser ini.');

    context.fillStyle = settings.background;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const imageX = page.drawX + (plan.imageRect.x - page.window.x);
    const imageY = page.drawY + (plan.imageRect.y - page.window.y);
    context.drawImage(
      image,
      imageX * scale,
      (page.window.h - imageY - plan.imageRect.h) * scale,
      plan.imageRect.w * scale,
      plan.imageRect.h * scale,
    );

    const blob = await canvasToJpeg(canvas, settings.quality);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const embedded = await doc.embedJpg(bytes);

    const pdfPage = doc.addPage([plan.paperW, plan.paperH]);
    if (background.r !== 1 || background.g !== 1 || background.b !== 1) {
      pdfPage.drawRectangle({
        x: 0,
        y: 0,
        width: plan.paperW,
        height: plan.paperH,
        color: rgb(background.r, background.g, background.b),
      });
    }
    pdfPage.drawImage(embedded, {
      x: page.drawX,
      y: page.drawY,
      width: page.window.w,
      height: page.window.h,
    });

    if (settings.cutMarks) drawCutMarks(pdfPage, plan, rgb(0.45, 0.45, 0.45));

    if (settings.labels) {
      const label =
        settings.labelStyle === 'rowcol'
          ? `R${page.row + 1} C${page.col + 1} · ${page.index + 1}`
          : `${page.index + 1}`;
      const size = 7;
      const textWidth = font.widthOfTextAtSize(label, size);
      const x = plan.paperW - plan.margin - textWidth - 3;
      const y = Math.max(2, plan.margin * 0.3);

      if (plan.margin < 8) {
        pdfPage.drawRectangle({
          x: x - 3,
          y: y - 2,
          width: textWidth + 6,
          height: size + 4,
          color: rgb(1, 1, 1),
          opacity: 0.72,
        });
      }
      pdfPage.drawText(label, {
        x,
        y,
        size,
        font,
        color: rgb(0.35, 0.35, 0.35),
      });
    }

    canvas.width = 1;
    canvas.height = 1;

    onProgress?.(index + 1, total);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const saved = await doc.save();
  const buffer = saved.buffer.slice(
    saved.byteOffset,
    saved.byteOffset + saved.byteLength,
  ) as ArrayBuffer;
  return new Blob([buffer], { type: 'application/pdf' });
}

export function buildFileName(settings: Settings, plan: PosterPlan): string {
  const widthCm = Math.round((plan.posterW / MM_TO_PT) / 10);
  const heightCm = Math.round((plan.posterH / MM_TO_PT) / 10);
  return `poster_${settings.cols}x${settings.rows}_${widthCm}x${heightCm}cm_${settings.paper}_${settings.dpi}dpi.pdf`;
}
