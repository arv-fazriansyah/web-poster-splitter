import type { ReactNode } from 'react';
import { PAPERS } from '../lib/papers';
import type { PosterPlan } from '../lib/plan';
import type { LoadedImage, PdfSource, Settings } from '../lib/types';

interface Props {
  settings: Settings;
  onPatch: (p: Partial<Settings>) => void;
  image: LoadedImage | null;
  pdf: PdfSource | null;
  pageNo: number;
  onPageChange: (n: number) => void;
  plan: PosterPlan | null;
  onExport: () => void;
  onBrowse: () => void;
  onClear: () => void;
}

const PRESETS = [
  { label: '2×2', cols: 2, rows: 2, icon: 2 },
  { label: '3×3', cols: 3, rows: 3, icon: 3 },
  { label: '4×4', cols: 4, rows: 4, icon: 4 },
  { label: '5×5', cols: 5, rows: 5, icon: 5 },
];

function GridIcon({ size }: { size: number }) {
  return (
    <div className={`preset-grid preset-${size}x${size}`}>
      {Array.from({ length: size * size }).map((_, i) => <span key={i} />)}
    </div>
  );
}

function Sec({ title, extra, children }: { title: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2 className="section-title">{title}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

function Seg<T extends string | number>({ value, options, onChange, label }: {
  value: T; options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void; label: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button"
          className={o.value === value ? 'segmented-item is-active' : 'segmented-item'}
          onClick={() => onChange(o.value)} aria-pressed={o.value === value}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsPanel({
  settings, onPatch, image, pdf, pageNo, onPageChange, plan,
  onExport, onBrowse, onClear,
}: Props) {
  const totalPages = plan?.pages.length ?? 0;

  return (
    <>
      {image && pdf && (
        <Sec title="Navigasi PDF">
          <div className="pdf-pager" style={{ border: 'none', paddingTop: 0 }}>
            <span style={{ fontSize: '11px' }}>Halaman {pageNo}/{pdf.numPages}</span>
            <div className="pdf-pager-controls">
              <button className="icon-btn" onClick={() => onPageChange(pageNo - 1)} disabled={pageNo <= 1} aria-label="Sebelumnya">‹</button>
              <button className="icon-btn" onClick={() => onPageChange(pageNo + 1)} disabled={pageNo >= pdf.numPages} aria-label="Selanjutnya">›</button>
            </div>
          </div>
        </Sec>
      )}

      {/* ── KERTAS ── */}
      <Sec title="Kertas">
        <div className="field">
          <label className="field-label">Ukuran kertas</label>
          <select className="select" value={settings.paper}
            onChange={(e) => onPatch({ paper: e.target.value as Settings['paper'] })}>
            {PAPERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div className="field">
          <span className="field-label">Orientasi</span>
          <Seg label="Orientasi" value={settings.orientation}
            options={[{ value: 'portrait', label: 'Potret' }, { value: 'landscape', label: 'Lanskap' }]}
            onChange={(v) => onPatch({ orientation: v })} />
        </div>
      </Sec>

      {/* ── GRID ── */}
      <Sec title="Grid">
        <div className="preset-row">
          {PRESETS.map((g) => (
            <button key={g.label} type="button"
              className={settings.cols === g.cols && settings.rows === g.rows ? 'preset is-active' : 'preset'}
              onClick={() => onPatch({ cols: g.cols, rows: g.rows })}
              title={`${g.cols} kolom × ${g.rows} baris`}>
              <GridIcon size={g.icon} />
              <span className="preset-label">{g.label}</span>
            </button>
          ))}
        </div>
      </Sec>

      {/* ── AKSI ── */}
      <Sec title="Aksi">
        <div className="btn-row">
          <button type="button" className="btn btn-primary" onClick={onExport} disabled={!image}>
            Unduh PDF ({totalPages})
          </button>
          <button type="button" className="btn btn-ghost" onClick={onBrowse} disabled={!image}>
            Ganti
          </button>
          <button type="button" className="btn btn-ghost btn-danger" onClick={onClear} disabled={!image}>
            Hapus
          </button>
        </div>
      </Sec>
    </>
  );
}

