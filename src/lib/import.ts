import type { LoadedImage, PdfSource } from './types';

type Pdfjs = typeof import('pdfjs-dist');

let pdfjsPromise: Promise<Pdfjs> | null = null;

async function getPdfjs(): Promise<Pdfjs> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import('pdfjs-dist');
      const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Gagal merender halaman PDF.'));
    }, 'image/png');
  });
}

export async function loadImageFromBlob(blob: Blob, name: string): Promise<LoadedImage> {
  const bitmap = await createImageBitmap(blob);
  return { bitmap, width: bitmap.width, height: bitmap.height, name };
}

export async function openPdf(file: File): Promise<{ source: PdfSource; page: LoadedImage }> {
  const data = await file.arrayBuffer();
  const pdfjs = await getPdfjs();
  const task = pdfjs.getDocument({ data: data.slice(0) });
  const doc = await task.promise;
  try {
    const source: PdfSource = { data, numPages: doc.numPages, name: file.name };
    const page = await renderPdfPage(source, 1);
    return { source, page };
  } finally {
    await task.destroy();
  }
}

export async function renderPdfPage(source: PdfSource, pageNumber: number): Promise<LoadedImage> {
  const pdfjs = await getPdfjs();
  const task = pdfjs.getDocument({ data: source.data.slice(0) });
  const doc = await task.promise;
  try {
    const page = await doc.getPage(pageNumber);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(4, 4096 / Math.max(base.width, base.height));
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(viewport.width));
    canvas.height = Math.max(1, Math.ceil(viewport.height));
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas 2D tidak tersedia.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvas, viewport }).promise;

    const bitmap = await createImageBitmap(await canvasToBlob(canvas));
    return {
      bitmap,
      width: bitmap.width,
      height: bitmap.height,
      name: `${source.name} — hal. ${pageNumber}`,
    };
  } finally {
    await task.destroy();
  }
}

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name);
}
