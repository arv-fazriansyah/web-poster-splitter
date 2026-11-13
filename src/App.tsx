import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { Preview } from './components/Preview';
import { SettingsPanel } from './components/SettingsPanel';
import { exportPosterPdf, buildFileName } from './lib/exportPdf';
import { isImageFile, isPdfFile, loadImageFromBlob, openPdf, renderPdfPage } from './lib/import';
import { MM_TO_PT, suggestGrid } from './lib/papers';
import { buildPlan } from './lib/plan';
import { DEFAULT_SETTINGS } from './lib/types';
import type { LoadedImage, PdfSource, Settings } from './lib/types';

const MAX_FILE_BYTES = 80 * 1024 * 1024;

export default function App() {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [pdf, setPdf] = useState<PdfSource | null>(null);
  const [pageNo, setPageNo] = useState(1);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const imageRef = useRef<LoadedImage | null>(null);

  const replaceImage = useCallback((next: LoadedImage) => {
    imageRef.current?.bitmap.close();
    imageRef.current = next;
    setImage(next);
  }, []);

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const file = Array.from(fileList)[0];
      if (!file) return;
      setError(null);
      setNotice(null);
      if (file.size > MAX_FILE_BYTES) {
        setError('Berkas terlalu besar (maks 80 MB).');
        return;
      }
      setImageLoading(true);
      try {
        if (isPdfFile(file)) {
          const { source, page } = await openPdf(file);
          setPdf(source);
          setPageNo(1);
          replaceImage(page);
          setSettings((cur) => {
            const o = page.width >= page.height ? 'landscape' as const : 'portrait' as const;
            const g = suggestGrid(page.width, page.height, cur.paper, o);
            return { ...cur, orientation: o, cols: g.cols, rows: g.rows };
          });
        } else if (isImageFile(file)) {
          const loaded = await loadImageFromBlob(file, file.name);
          setPdf(null);
          setPageNo(1);
          replaceImage(loaded);
          setSettings((cur) => {
            const o = loaded.width >= loaded.height ? 'landscape' as const : 'portrait' as const;
            const g = suggestGrid(loaded.width, loaded.height, cur.paper, o);
            return { ...cur, orientation: o, cols: g.cols, rows: g.rows };
          });
        } else {
          throw new Error('Format tidak didukung. Gunakan JPG, PNG, WebP, atau PDF.');
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Gagal memuat berkas.');
      } finally {
        setImageLoading(false);
      }
    },
    [replaceImage],
  );

  const changePage = useCallback(
    async (target: number) => {
      if (!pdf) return;
      const next = Math.min(Math.max(1, target), pdf.numPages);
      if (next === pageNo) return;
      setImageLoading(true);
      setError(null);
      try {
        const page = await renderPdfPage(pdf, next);
        replaceImage(page);
        setPageNo(next);
      } catch {
        setError('Gagal merender halaman PDF tersebut.');
      } finally {
        setImageLoading(false);
      }
    },
    [pdf, pageNo, replaceImage],
  );

  const plan = useMemo(
    () => (image ? buildPlan(settings, image.width, image.height) : null),
    [settings, image],
  );

  const totalPages = plan?.pages.length ?? 0;
  const posterWidthCm = plan ? Math.round(plan.posterW / MM_TO_PT / 10) : 0;
  const posterHeightCm = plan ? Math.round(plan.posterH / MM_TO_PT / 10) : 0;

  const onPatch = useCallback((patch: Partial<Settings>) => {
    setSettings((c) => ({ ...c, ...patch }));
  }, []);

  const onBrowse = useCallback(() => { inputRef.current?.click(); }, []);

  const onClear = useCallback(() => {
    imageRef.current?.bitmap.close();
    imageRef.current = null;
    setImage(null); setPdf(null); setPageNo(1);
    setError(null); setNotice(null);
  }, []);

  const onExport = useCallback(async () => {
    if (!image || !plan) return;
    setError(null); setNotice(null);
    try {
      const blob = await exportPosterPdf({ image: image.bitmap, plan, settings });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = buildFileName(settings, plan);
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 5000);
      setNotice(`PDF siap — ${plan.pages.length} halaman, ${(blob.size / 1024 / 1024).toFixed(1)} MB`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ekspor PDF gagal.');
    }
  }, [image, plan, settings]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 7000);
    return () => window.clearTimeout(t);
  }, [notice]);

  const onDragEnter = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); dragDepth.current += 1; setDragging(true); };
  const onDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); };
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepth.current = 0; setDragging(false);
    void handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="app">
      {/* ── TOPBAR ── */}
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor">
              <rect x="3" y="3" width="11" height="11" rx="2" />
              <rect x="18" y="3" width="11" height="11" rx="2" opacity="0.75" />
              <rect x="3" y="18" width="11" height="11" rx="2" opacity="0.75" />
              <rect x="18" y="18" width="11" height="11" rx="2" opacity="0.5" />
            </svg>
          </span>
          <div className="brand-text">
            <strong>TilePoster</strong>
            <span>Poster splitter</span>
          </div>
        </div>
        <div className="topbar-right">
        </div>
      </header>

      {/* ── BANNERS ── */}
      {(error || notice) && (
        <div className="banners">
          {error && <div className="banner banner--error" role="alert"><span>{error}</span><button onClick={() => setError(null)}>✕</button></div>}
          {notice && <div className="banner banner--success" role="status"><span>{notice}</span><button onClick={() => setNotice(null)}>✕</button></div>}
        </div>
      )}

      {/* ── MAIN: settings left | preview right ── */}
      <main className="main" onDragEnter={onDragEnter} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>

        {/* PREVIEW AREA (right) */}
        <section className="preview-area">
          <div className="toolbar">
            <div className="chips">
              <span className="chip">{settings.paper.toUpperCase()}</span>
              <span className="chip">{settings.orientation === 'portrait' ? 'Potret' : 'Lanskap'}</span>
              {image && <span className="chip chip--strong">{totalPages} halaman</span>}
              {image && <span className="chip">{posterWidthCm} × {posterHeightCm} cm</span>}
            </div>
          </div>

          <div className="canvas-wrap">
            {image ? (
              <div className="preview-wrap">
                <Preview image={image} plan={plan} background={settings.background} />
                {imageLoading && (
                  <div className="loading-overlay">
                    <span className="spinner" aria-hidden="true" />Memuat…
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state" onClick={onBrowse} style={{ cursor: 'pointer' }}>
                <div className="dropzone">
                  <div className="dropzone-icon">
                    <svg viewBox="0 0 48 48" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="7" y="9" width="34" height="30" rx="5" />
                      <circle cx="18" cy="20" r="3.5" />
                      <path d="M9 33l8-8 6 6 5-5 11 11" />
                    </svg>
                  </div>
                  <span className="dropzone-title">Pilih gambar atau PDF</span>
                </div>
              </div>
            )}
          </div>

          {/* progress bar at bottom of preview area — removed; now in settings panel */}
        </section>

        {/* SETTINGS SECTIONS (left) — tanpa pembungkus */}
        <SettingsPanel
          settings={settings} onPatch={onPatch}
          image={image} pdf={pdf} pageNo={pageNo} onPageChange={changePage}
          plan={plan}
          onExport={onExport} onBrowse={onBrowse} onClear={onClear}
        />

      </main>

      {dragging && (
        <div className="drag-overlay">
          <div className="drag-overlay-inner">
            <strong>Lepaskan berkas</strong>
            <span>JPG, PNG, WebP, atau PDF</span>
          </div>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*,application/pdf,.pdf" hidden
        onChange={(e) => { if (e.target.files) void handleFiles(e.target.files); e.target.value = ''; }} />
    </div>
  );
}
