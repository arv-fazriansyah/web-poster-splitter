# TilePoster

Editor poster splitter ala [PrintTiler](https://printtiler.com/editor): unggah gambar atau PDF,
atur grid, lihat preview, lalu unduh PDF multi-halaman yang siap dicetak dan ditempel menjadi
poster besar. Semua pemrosesan berjalan di browser — berkas tidak pernah dikirim ke server.

## Fitur

- Impor JPG/PNG/WebP/AVIF dan PDF (pilih halaman yang mau dipakai).
- Ukuran kertas A4, A5, A3, Letter, Legal + orientasi potret/lanskap.
- Grid kolom × baris, preset cepat, dan tombol "Sesuaikan gambar" (auto grid).
- Margin, overlap, tanda potong, dan label halaman (nomor atau baris–kolom).
- Mode gambar Penuh (cover/crop) atau Utuh (letterbox) + warna latar.
- Resolusi ekspor 150/300/450 DPI dan kualitas JPEG.
- PDF dengan halaman berurutan, indikator progres, nama berkas otomatis.
- 100% client-side: tidak ada backend, tidak ada unggahan, tidak ada akun.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + build ke dist/
npm run preview  # cek hasil build
```

Butuh Node.js 20.19+ atau 22.12+ (Vite 8).

## Deploy ke Cloudflare Pages (via GitHub)

1. Buat repo GitHub, lalu push proyek ini:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Pilih repo, lalu isi:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION = 22.12.0`
4. **Save and Deploy**. Setiap push ke `main` akan otomatis deploy ulang.

Alternatif tanpa integrasi Git:

```bash
npm run build
npx wrangler pages deploy dist --project-name tileposter
```

Tidak perlu `_redirects` karena aplikasi hanya satu halaman.

## Struktur

```
src/
  App.tsx                 state utama, impor berkas, ekspor
  components/
    Preview.tsx           kanvas preview poster + garis grid + nomor halaman
    SettingsPanel.tsx     seluruh kontrol pengaturan
    Dropzone.tsx          area unggah
  lib/
    plan.ts               geometri tile: halaman, margin, overlap, penempatan gambar
    exportPdf.ts          render tiap tile ke JPEG lalu susun PDF (pdf-lib)
    import.ts             impor gambar + render halaman PDF (pdfjs-dist, lazy)
    papers.ts             daftar kertas, konversi mm→pt, saran grid
    types.ts              tipe + pengaturan default
```

## Catatan & batasan

- Batas aman: berkas 80 MB dan 400 halaman. Untuk grid rapat + DPI tinggi, browser bisa kehabisan
  memori; turunkan DPI atau jumlah halaman.
- Overlap dibatasi oleh margin (overlap dicetak di area margin).
- Label dicetak di margin kanan bawah. Jika margin 0, label menimpa gambar sedikit.
- Hasil cetak terbaik: skala **100% / Actual size**, matikan "Fit to page", cetak di kertas yang sama
  dengan pengaturan.
- Impor PDF merender halaman ke bitmap maksimal ~4096 px, jadi sangat detail halus bisa berkurang.
- Ganti nama/brand di `index.html` dan `src/App.tsx`; warna aksen di `src/styles.css` (`--accent`).
