interface DropzoneProps {
  onBrowse: () => void;
  compact?: boolean;
}

export function Dropzone({ onBrowse, compact = false }: DropzoneProps) {
  return (
    <button
      type="button"
      className={compact ? 'dropzone dropzone--compact' : 'dropzone'}
      onClick={onBrowse}
    >
      <span className="dropzone-icon" aria-hidden="true">
        <svg viewBox="0 0 48 48" width="42" height="42" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="9" width="34" height="30" rx="5" />
          <circle cx="18" cy="20" r="3.5" />
          <path d="M9 33l8-8 6 6 5-5 11 11" />
        </svg>
      </span>
      <span className="dropzone-title">
        {compact ? 'Pilih berkas lain' : 'Letakkan gambar atau PDF di sini'}
      </span>
      <span className="dropzone-sub">
        atau <u>pilih berkas</u> · JPG, PNG, WebP, PDF · maks 80 MB
      </span>
      <span className="dropzone-note">Diproses sepenuhnya di browser — berkas tidak diunggah ke server.</span>
    </button>
  );
}
