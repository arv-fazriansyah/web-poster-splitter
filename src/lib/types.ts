export type PaperId = 'a4' | 'a5' | 'a3' | 'letter' | 'legal';
export type Orientation = 'portrait' | 'landscape';
export type FitMode = 'cover' | 'contain';
export type LabelStyle = 'index' | 'rowcol';

export interface Settings {
  paper: PaperId;
  orientation: Orientation;
  rows: number;
  cols: number;
  marginMm: number;
  overlapMm: number;
  dpi: number;
  fit: FitMode;
  background: string;
  cutMarks: boolean;
  labels: boolean;
  labelStyle: LabelStyle;
  quality: number;
}

export interface LoadedImage {
  bitmap: ImageBitmap;
  width: number;
  height: number;
  name: string;
}

export interface PdfSource {
  data: ArrayBuffer;
  numPages: number;
  name: string;
}

export const DEFAULT_SETTINGS: Settings = {
  paper: 'a4',
  orientation: 'portrait',
  rows: 2,
  cols: 2,
  marginMm: 5,
  overlapMm: 0,
  dpi: 450,
  fit: 'cover',
  background: '#ffffff',
  cutMarks: true,
  labels: true,
  labelStyle: 'index',
  quality: 1.0,
};

export const DPI_OPTIONS = [150, 300, 450] as const;
