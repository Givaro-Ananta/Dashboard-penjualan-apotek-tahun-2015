# 💊 Dashboard Penjualan Apotek Tahun 2015

> Dashboard analitik interaktif berbasis web untuk visualisasi data penjualan apotek di Indonesia selama tahun 2015.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-green?logo=python)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 📋 Deskripsi Proyek

Proyek ini merupakan **dashboard analitik penjualan apotek** yang dibangun menggunakan Next.js dan Recharts. Data yang digunakan adalah data penjualan riil dari sebuah apotek di Indonesia selama periode **Januari – Desember 2015**, yang mencakup lebih dari **500.000 transaksi** detail penjualan obat.

Dashboard ini menampilkan analisis mendalam mencakup:
- 📈 **Performa Keuangan** — Pendapatan, margin, dan tren bulanan
- 💊 **Analisis Produk** — Top 10 obat terlaris dan kategori produk
- 👨‍⚕️ **Analisis Dokter** — Performa resep per dokter
- ⏰ **Waktu Sibuk** — Pola transaksi per hari dan jam operasional
- 🔄 **Pipeline ETL** — Alur proses data dari raw SQL hingga dashboard

---

## 🗂️ Sumber Data

**Dataset:** Retail Sales Dataset of a Pharmacy in Indonesia  
**Sumber:** [Mendeley Data — DOI: 10.17632/2ym7v78wtd.1](https://data.mendeley.com/datasets/2ym7v78wtd/1)  
**Penulis:** Gustriansyah, Rendra  
**Tanggal Publikasi:** 14 Februari 2022  
**Publisher:** Mendeley Data

### Deskripsi Dataset

Dataset ini berasal dari data aktual yang diambil langsung dari database apotek. Dataset terdiri dari **empat tabel**:

| Tabel         | Jumlah Baris | Deskripsi                                  |
| ------------- | ------------ | ------------------------------------------ |
| `ms_product`  | ~7.057       | Master data produk/obat                    |
| `ms_sales`    | ~127.025     | Header transaksi resep                     |
| `det_sales`   | ~511.559     | Detail item per resep                      |
| `transaction` | ~403.111     | Tabel gabungan hasil integrasi & filtering |

**Relasi Antar Tabel:**

```
ms_sales (NO_RESEP PK)
    └── det_sales (NO_RESEP FK)
            └── ms_product (KD_OBAT FK)
                    └── transaction (gabungan ms_sales + det_sales)
```

> ⚠️ **Catatan:** File `data/sales.sql` berukuran ~70 MB dan merupakan dump database MariaDB (`db_pharmacy`). File ini sudah dimasukkan ke repository namun disarankan menggunakan Git LFS untuk pengelolaan yang lebih baik.

---

## 🚀 Cara Menjalankan

### Prasyarat

- [Node.js](https://nodejs.org/) v18+
- [Python](https://www.python.org/) 3.9+
- [Git](https://git-scm.com/)

### 1. Clone Repository

```bash
git clone https://github.com/Givaro-Ananta/Dashboard-penjualan-apotek-tahun-2015.git
cd Dashboard-penjualan-apotek-tahun-2015
```

### 2. Preprocessing Data (Python)

Pastikan file `data/sales.sql` tersedia, lalu jalankan script preprocessing:

```bash
# Install dependensi Python
pip install pandas sqlalchemy

# Jalankan preprocessing
python prepare_dashboard_data.py
```

Script ini akan menghasilkan file JSON yang dibutuhkan dashboard di folder `output/`.

### 3. Jalankan Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Buka browser dan akses: **[http://localhost:3000](http://localhost:3000)**

---

## 📁 Struktur Proyek

```
sales/
├── 📂 data/
│   └── sales.sql              # Raw database dump (~70MB, MariaDB)
├── 📂 dashboard/              # Aplikasi Next.js
│   ├── src/
│   │   └── app/
│   │       ├── page.tsx       # Komponen dashboard utama
│   │       ├── layout.tsx     # Layout & metadata
│   │       └── globals.css    # Styling global
│   ├── package.json
│   └── tsconfig.json
├── 📂 code/                   # Jupyter Notebooks analisis
│   └── analisis_penjualan_apotek.ipynb
├── 📂 output/                 # Output preprocessing (di-ignore git)
├── prepare_dashboard_data.py  # Script preprocessing Python
└── README.md
```

---

## 🛠️ Tech Stack

### Frontend (Dashboard)
| Teknologi                                     | Versi | Fungsi           |
| --------------------------------------------- | ----- | ---------------- |
| [Next.js](https://nextjs.org/)                | 15    | Framework React  |
| [TypeScript](https://www.typescriptlang.org/) | 5     | Type safety      |
| [Recharts](https://recharts.org/)             | 2.x   | Library charting |
| CSS (Vanilla)                                 | —     | Styling          |

### Backend / Data Processing
| Teknologi        | Fungsi                     |
| ---------------- | -------------------------- |
| Python 3.9+      | Preprocessing & analisis   |
| Pandas           | Manipulasi DataFrame       |
| SQLAlchemy       | Koneksi & query database   |
| Jupyter Notebook | Eksplorasi data interaktif |

---

## 📊 Fitur Dashboard

### Tab 1: Performa Keuangan
- Ringkasan total pendapatan, total transaksi, dan rata-rata nilai resep
- Grafik tren pendapatan bulanan
- Breakdown pendapatan per jenis transaksi (Rawat Jalan, Rawat Inap, dll.)

### Tab 2: Analisis Produk
- Top 10 obat terlaris berdasarkan volume dan nilai
- Distribusi kategori produk
- Analisis margin per produk

### Tab 3: Analisis Dokter
- Peringkat dokter berdasarkan jumlah resep
- Nilai resep rata-rata per dokter
- Tren performa dokter per bulan

### Tab 4: Waktu Sibuk
- Heatmap transaksi per hari dalam seminggu
- Distribusi transaksi per jam operasional
- Identifikasi peak hours apotek

### Tab 5: Pipeline ETL
- Visualisasi alur proses data (Flowchart)
- Status setiap tahap transformasi data

---

## 🔄 Pipeline Pengolahan Data

```
Raw SQL Dump (sales.sql)
        │
        ▼
[1] Import & Strukturisasi
        │  Parse INSERT INTO → DataFrame
        │  Mapping relasi antar tabel
        │
        ▼
[2] Data Cleaning
        │  Handle qty negatif (retur)
        │  Normalisasi format NO_RESEP
        │  Flag harga 0 (obat tanpa HJ)
        │
        ▼
[3] Feature Engineering
        │  Ekstrak tahun/bulan/hari dari TGL
        │  Hitung margin per item
        │  Klasifikasi jenis transaksi
        │
        ▼
[4] Agregasi & Export
        │  Agregasi per dimensi (produk, dokter, waktu)
        │  Export ke JSON → output/
        │
        ▼
[5] Dashboard Visualization
        Next.js + Recharts → Interactive Charts
```

---

## 📝 Catatan Data

- **Periode:** Januari – Desember 2015
- **Qty negatif:** Menandakan retur/pembatalan resep, diberi flag `is_return`
- **Format NO_RESEP:** `XX-NN.YYYY-MM-####` (prefix: `RJ`=Rawat Jalan, `RI`=Rawat Inap, `RL`=lainnya, `B/UM`=obat bebas)
- **Harga 0 di ms_product.HJ_RP:** Kemungkinan obat racikan dasar atau data tidak lengkap



---

## 👤 Author

**Givaro Ananta**  
GitHub: [@Givaro-Ananta](https://github.com/Givaro-Ananta)

---

*Data bersumber dari penelitian akademik dan digunakan untuk keperluan portofolio analitik data.*
