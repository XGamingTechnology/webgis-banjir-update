# WebGIS Banjir v2 — Client Demo

Prototype modernisasi UI/UX untuk sistem inventarisasi genangan banjir Kabupaten Bandung.

## Status

Branch `Staging` adalah source of truth untuk deployment staging di VPS. Branch `main` tetap menjadi baseline stabil sampai prototype diterima dan siap dipromosikan.

## Tujuan

Versi ini dibuat sebagai bahan demo/penawaran kepada client. Sistem belum menggunakan backend atau PostGIS. Data utama dibaca secara **read-only** dari GeoJSON legacy pada commit `ec660f488e83bf8a163f402dad4ba5106e5fe89e`, lalu dinormalisasi di browser.

## Fitur prototype

- Dashboard KPI yang mengikuti filter aktif.
- Peta interaktif MapLibre GL JS.
- Layer klasifikasi kecamatan, area genangan, titik genangan, dan heatmap.
- Filter tahun, kecamatan, dan kategori.
- Basemap OpenStreetMap / Satellite.
- Detail drawer untuk setiap titik genangan, termasuk foto jika tersedia.
- Tabel inventaris dengan pencarian.
- Ekspor CSV dan print view.
- Responsive layout untuk desktop/tablet/mobile.
- Fallback dataset jika sumber GeoJSON legacy tidak dapat diakses.
- Health endpoint `/health` untuk deployment staging.

## Menjalankan lokal

Node.js 18+ sudah cukup dan tidak ada dependency npm runtime.

```bash
npm run dev
```

Buka `http://localhost:3000`.

Health check:

```bash
curl http://localhost:3000/health
```

## Deployment staging

```bash
docker compose -f compose.staging.yml up -d --build
curl -fsS http://127.0.0.1:3100/health
```

Container staging bergabung ke network `si-cuti-staging-frontend` agar reverse proxy Nginx edge di VPS dapat mengakses `webgis-banjir-staging:3000`, sementara port host tetap hanya bind ke `127.0.0.1:3100`.

Public staging hostname saat ini:

`webgis-staging.43-134-231-84.sslip.io`

## Arsitektur sementara

```text
Legacy GeoJSON (read-only)
        ↓
normalisation adapter
        ↓
UI state / filtering
        ↓
MapLibre + KPI + table + detail drawer
```

Tahap berikutnya apabila client menyetujui pengembangan penuh adalah mengganti data adapter dengan API + PostgreSQL/PostGIS tanpa merombak keseluruhan UI.
