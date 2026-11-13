import type { Orientation, PaperId } from './types';

export const MM_TO_PT = 72 / 25.4;

export interface Paper {
  id: PaperId;
  label: string;
  widthMm: number;
  heightMm: number;
}

export const PAPERS: Paper[] = [
  { id: 'a4', label: 'A4 (210 × 297 mm)', widthMm: 210, heightMm: 297 },
  { id: 'a5', label: 'A5 (148 × 210 mm)', widthMm: 148, heightMm: 210 },
  { id: 'a3', label: 'A3 (297 × 420 mm)', widthMm: 297, heightMm: 420 },
  { id: 'letter', label: 'Letter (8.5 × 11 in)', widthMm: 215.9, heightMm: 279.4 },
  { id: 'legal', label: 'Legal (8.5 × 14 in)', widthMm: 215.9, heightMm: 355.6 },
];

export function getPaper(id: PaperId): Paper {
  return PAPERS.find((paper) => paper.id === id) ?? PAPERS[0];
}

export function paperSizeMm(id: PaperId, orientation: Orientation): { widthMm: number; heightMm: number } {
  const paper = getPaper(id);
  return orientation === 'landscape'
    ? { widthMm: paper.heightMm, heightMm: paper.widthMm }
    : { widthMm: paper.widthMm, heightMm: paper.heightMm };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function suggestGrid(
  imageWidth: number,
  imageHeight: number,
  paperId: PaperId,
  orientation: Orientation,
): { cols: number; rows: number } {
  const { widthMm, heightMm } = paperSizeMm(paperId, orientation);
  const targetAspect = imageWidth / imageHeight;
  const paperAspect = widthMm / heightMm;
  const targetTileCount = 6;

  let best = { cols: 2, rows: 2, score: Number.POSITIVE_INFINITY };
  for (let cols = 1; cols <= 8; cols += 1) {
    for (let rows = 1; rows <= 8; rows += 1) {
      const posterAspect = (cols * paperAspect) / rows;
      const aspectError = Math.abs(Math.log(posterAspect / targetAspect));
      const countError = Math.abs(cols * rows - targetTileCount) / targetTileCount;
      const score = aspectError * 2 + countError;
      if (score < best.score) best = { cols, rows, score };
    }
  }
  return { cols: best.cols, rows: best.rows };
}
