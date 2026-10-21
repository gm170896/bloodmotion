# Blood Motion — Website + Backend Admin + Order + Invoice

Website React (Vite) + backend Node.js **tanpa dependensi tambahan** + panel admin di `/admin`.
Semua teks, menu, portfolio, layanan, tim, client, link, dan logo bisa diedit dari admin. Ada juga rekap keuangan (default 50% Operasional / 50% Maintenance Studio), **manajemen order**, **ratecard**, dan **invoice otomatis (PDF)** memakai desain invoice Blood Motion.

## Menjalankan (lokal)
    npm install
    cp .env.example .env          # lalu isi ADMIN_PASSWORD (min. 8 karakter)
    npm run server                # backend + admin  -> http://localhost:3001/admin
    npm run dev                   # (terminal lain) website dev -> http://localhost:5173

Butuh Node 20.19+ (atau 22.9+). Data tersimpan di `data/db.json` (otomatis dibuat dari `src/data.js`), file unggahan di `data/uploads/`, backup harian di `data/backups/`.

## Produksi (satu server untuk website + admin)
    npm start                     # build lalu jalankan server
Taruh di VPS / Railway / Render dan **pasang disk persisten**, lalu set `DATA_DIR` ke folder disk itu. Wajib HTTPS (pakai reverse proxy / bawaan platform). Hosting statis murni (Vercel/Netlify) tidak bisa menyimpan data backend ini.
Kalau website di-host terpisah dari backend, set `VITE_API_URL=https://domain-backend` saat build.

## Isi admin
- **Teks & Logo**: hero, intro, about, statement, contact, footer, teks form pesanan, logo header/hero/about
- **Menu Navigasi**, **Portfolio** (tambah/hapus/urut/sembunyikan, upload thumbnail + preview klip), **Kategori**, **Services**, **Process**, **Team**, **Clients**, **Collaborations**, **Link & Kontak**, **Pilihan Budget**
- **Keuangan**: catat pemasukan/pengeluaran (Rupiah). Pemasukan otomatis dibagi sesuai rasio (default 50/50); pengeluaran dicatat ke kantong Operasional atau Maintenance. Ada saldo tiap kantong, rekap bulanan, filter periode, dan unduh CSV. Rasio bisa diubah; catatan lama tetap memakai rasio saat dicatat.

## Order → Invoice otomatis
1. Pengunjung mengisi form **Start a project** di website → pesanan tersimpan di admin **📥 Order** (status Baru) dan WhatsApp/email tetap terbuka seperti sebelumnya. Form punya kolom WhatsApp tambahan dan kolom jebakan anti-spam.
2. Di Order: ubah status (Baru → Negosiasi → Dikonfirmasi → Dikerjakan → Selesai/Dibatalkan), isi nama kontak, catatan, dan **item penawaran**. Item bisa ditambah dari **💲 Ratecard** atau diketik manual. Order juga bisa dibuat manual.
3. Klik **Buat Invoice** → invoice terisi otomatis: nomor berikutnya (0455, 0456, …), tanggal hari ini, jatuh tempo (+20 hari, bisa diubah), nama/band/telepon dari order, harga dari item penawaran atau Ratecard sesuai layanan.
4. Di **🧾 Invoice** semua isi bisa diubah: bahasa desain (Indonesia / English), mata uang (Rp / USD), item & diskon, pajak %, down payment, metode pembayaran, Pihak Kedua, syarat & ketentuan. **Pratinjau** menampilkan hasil persis seperti PDF.
5. **Simpan & Unduh PDF** → file PDF 1 halaman dengan desain asli. Invoice juga bisa dibuat tanpa order (tombol “+ Invoice baru”).
6. **Catat pembayaran** (DP / pelunasan) → status invoice otomatis Dibayar sebagian / Lunas **dan masuk ke 💰 Keuangan** terbagi 50/50 (Operasional & Maintenance Studio). Hapus pembayaran = catatan keuangannya ikut terhapus.

### Desain invoice
- Berkas desain asli: `design/Invoice_Indo___English.pdf`. Latar (logo, judul “Official INVOICE”, label, tanda tangan, segel) = `admin/invoice-assets/bg-id.jpg` / `bg-en.jpg`, dirender dari PDF desain dengan teks isi dikosongkan. Hanya isi (nomor, tanggal, Kepada, tabel, total, rekening, syarat, Pihak Kedua) yang digambar ulang di atasnya, di koordinat yang sama dengan PDF asli.
- Perubahan desain → ganti PDF di `design/`, jalankan `tools/build-invoice-template.py` (lihat komentar di dalamnya) lalu ganti JPG latar. Mesin tata letak: `server/invoice.js`.
- Desain Indonesia punya tanda tangan contoh (“Signature”) di kolom Pihak Kedua; secara bawaan disembunyikan supaya invoice klien lain tidak memuat tanda tangan orang lain. Aktifkan lagi di **Pengaturan Invoice** bila ingin.
- Maksimal 14 item per invoice (tabel menyesuaikan jarak baris).
- Contoh hasil: folder `contoh-invoice/`.

### PDF di server
Tombol **Unduh PDF** memakai Chrome/Chromium/Edge yang terpasang di server (dicari otomatis; atau set `CHROME_PATH`). Di VPS: `sudo apt install chromium` (atau `chromium-browser`). Jika tidak ada, admin otomatis membuka halaman cetak → pilih **Simpan sebagai PDF** (ukuran halaman sudah sesuai desain, margin 0).

## Keamanan
Login password (cookie HttpOnly, 7 hari, batas 5 percobaan/menit), pengecekan origin untuk perubahan data, unggahan hanya png/jpg/webp/gif/mp4/webm maks 25 MB, data keuangan, order, invoice, dan ratecard tidak pernah dikirim ke endpoint publik. Endpoint publik hanya `POST /api/orders` (dibatasi 5 kiriman / 10 menit per IP, ada honeypot anti-bot). Ganti `ADMIN_PASSWORD` dengan password kuat dan jangan commit `.env` / `data/`.

## Catatan
Sanity CMS yang lama sudah dihapus (digantikan backend ini). Nama kategori portfolio sebaiknya sama dengan nama layanan agar tombol “View work” di Services muncul.

## Perubahan V13 (perbaikan dari evaluasi V12)
- **Foto tim**: kotak foto sekarang punya tinggi pasti (rasio 4:5) dan foto diisi dengan `position:absolute` — penyebab foto "setengah" (aturan global `img{height:100%}` tanpa tinggi acuan) sudah hilang. Admin → Team punya pilihan **Tampilan foto**: *Otomatis* (default: foto tampil utuh; isi penuh hanya bila rasio foto hampir 4:5), *Tampil utuh*, atau *Isi penuh* (tepi terpotong, fokus ke atas/wajah).
- **Invoice Indonesia, angka TOTAL**: sebelumnya dua lapisan (putih + merah) dengan selisih posisi 4 pt sehingga tampak bergeser. Sekarang satu lapisan teks merah `#E20000` di posisi asli PDF desain dengan kontur putih ±0,95 pt rata di semua sisi (meniru desain asli). Pratinjau admin dan PDF memakai mesin yang sama, jadi hasilnya identik.
- Contoh invoice di `contoh-invoice/` dibuat ulang dengan mesin yang sudah diperbaiki.
- **Konten landing page**: endpoint `/api/content` sekarang `Cache-Control: no-cache`, jadi perubahan dari admin langsung tampil begitu halaman di-refresh (sebelumnya tertahan cache browser hingga 30 detik).
