# TilePoster

Pecah gambar atau PDF menjadi poster multi-halaman siap cetak. Semua pemrosesan berjalan di
browser — berkas tidak diunggah ke server.

## Fungsi

- Impor JPG, PNG, WebP, GIF, BMP, AVIF, dan PDF.
- Pindah halaman PDF sebelum diekspor.
- Atur ukuran kertas (A4, A5, A3, Letter, Legal) dan orientasi potret/lanskap.
- Pilih grid 2×2, 3×3, 4×4, atau 5×5. Grid awal disarankan otomatis dari rasio gambar.
- Preview poster lengkap dengan garis potong dan nomor halaman.
- Unduh PDF multi-halaman 450 DPI dengan indikator progres dan nama berkas otomatis.

## Instalasi lokal

Butuh Node.js 20.19+ atau 22.12+.

```bash
npm install
npm run dev       # http://localhost:5173
```

Perintah lain:

```bash
npm run build     # typecheck + build ke dist/
npm run preview   # cek hasil build
```

## Deploy ke Cloudflare Pages (otomatis dari GitHub)

1. Push proyek ke repo GitHub.
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Pilih repo, lalu isi:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION = 22.12.0`
4. **Save and Deploy**. Setiap push ke `main` otomatis build dan deploy ulang.
5. (Opsional) Tambahkan domain sendiri lewat tab **Custom domains** di proyek Pages.
