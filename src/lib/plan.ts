import { MM_TO_PT, clamp, paperSizeMm } from './papers';
import type { Settings } from './types';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PageSpec {
  index: number;
  row: number;
  col: number;
  /** Area of the poster printed on this page, in poster points (origin bottom-left). */
  window: Rect;
  /** Bottom-left position of the window on the PDF page. */
  drawX: number;
  drawY: number;
}

export interface PosterPlan {
  paperW: number;
  paperH: number;
  margin: number;
  printableW: number;
  printableH: number;
  posterW: number;
  posterH: number;
  overlap: number;
  cols: number;
  rows: number;
  imageRect: Rect;
  pages: PageSpec[];
}

export function buildPlan(settings: Settings, imageWidth: number, imageHeight: number): PosterPlan {
  const { widthMm, heightMm } = paperSizeMm(settings.paper, settings.orientation);
  const paperW = widthMm * MM_TO_PT;
  const paperH = heightMm * MM_TO_PT;

  const maxMargin = Math.max(0, Math.min(widthMm, heightMm) / 2 - 5);
  const marginMm = clamp(settings.marginMm, 0, maxMargin);
  const margin = marginMm * MM_TO_PT;

  const overlapMm = clamp(settings.overlapMm, 0, marginMm);
  const overlap = overlapMm * MM_TO_PT;

  const cols = clamp(Math.round(settings.cols), 1, 50);
  const rows = clamp(Math.round(settings.rows), 1, 50);

  const printableW = paperW - margin * 2;
  const printableH = paperH - margin * 2;
  const posterW = printableW * cols;
  const posterH = printableH * rows;

  const scale =
    settings.fit === 'cover'
      ? Math.max(posterW / imageWidth, posterH / imageHeight)
      : Math.min(posterW / imageWidth, posterH / imageHeight);

  const imageRect: Rect = {
    x: (posterW - imageWidth * scale) / 2,
    y: (posterH - imageHeight * scale) / 2,
    w: imageWidth * scale,
    h: imageHeight * scale,
  };

  const pages: PageSpec[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const left = col > 0 ? overlap : 0;
      const right = col < cols - 1 ? overlap : 0;
      const bottom = row < rows - 1 ? overlap : 0;
      const top = row > 0 ? overlap : 0;

      pages.push({
        index: row * cols + col,
        row,
        col,
        window: {
          x: col * printableW - left,
          y: (rows - 1 - row) * printableH - bottom,
          w: printableW + left + right,
          h: printableH + bottom + top,
        },
        drawX: margin - left,
        drawY: margin - bottom,
      });
    }
  }

  return {
    paperW,
    paperH,
    margin,
    printableW,
    printableH,
    posterW,
    posterH,
    overlap,
    cols,
    rows,
    imageRect,
    pages,
  };
}
