# Financial Baseline

| Item            | Detail                                                       |
| --------------- | ------------------------------------------------------------ |
| **Project**     | Finsped Express                                              |
| **Module**      | Backend Reporting & Financial Validation                     |
| **Owner**       | Ahmad Falah Zanjabil Ose                                     |
| **Role**        | Backend Developer 2 – Reporting & Financial Validation Owner |
| **Sprint**      | Sprint 3C                                                    |
| **Version**     | 1.0                                                          |
| **Status**      | Draft                                                        |
| **Last Update** | 22 Juni 2026                                                 |

---

# 1. Tujuan

Dokumen **Financial Baseline** dibuat sebagai acuan resmi dalam proses perhitungan data keuangan pada sistem **Finsped Express**. Dokumen ini digunakan untuk memastikan bahwa seluruh komponen sistem seperti Backend Summary API, Dashboard, Laporan, Export, dan proses Quality Assurance menggunakan aturan perhitungan yang sama sehingga menghasilkan angka keuangan yang konsisten.

---

# 2. Ruang Lingkup

Dokumen ini membahas:

* aturan Official Financial;
* struktur data transaksi yang digunakan untuk reporting;
* formula perhitungan keuangan;
* kebutuhan Summary API;
* aturan validasi data.

---

# 3. Sumber Audit

Financial Baseline disusun berdasarkan hasil audit terhadap beberapa sumber berikut.

| No | Sumber                                      |
| -- | ------------------------------------------- |
| 1  | Project Master Context                      |
| 2  | Decision Log / Accepted ADR                 |
| 3  | backend/sql/migrations.sql                  |
| 4  | backend/sql/sprint3a_approval_migration.sql |
| 5  | backend/src/routes/transaksi.ts             |
| 6  | finsped_demo_db.sql                         |
| 7  | Dokumen akun dan role dummy                 |

---

# 4. Hasil Audit Database

## 4.1 Struktur Transaksi

Berdasarkan hasil audit, modul reporting menggunakan tabel **transaksi**.

Kolom utama yang digunakan dalam proses reporting adalah sebagai berikut.

| Kolom    | Fungsi                    |
| -------- | ------------------------- |
| jumlah   | Nominal transaksi         |
| tipe     | Jenis transaksi           |
| kategori | Kategori transaksi        |
| status   | Status approval transaksi |
| tanggal  | Tanggal transaksi         |

Kolom pendukung:

* user_id
* nomor_invoice
* bukti_transaksi
* approved_by
* approved_at
* rejected_by
* rejected_at
* approval_note

---

## 4.2 Nilai Kolom Tipe

Berdasarkan hasil audit database dan source code, kolom **tipe** memiliki dua nilai yang digunakan dalam proses perhitungan.

| Nilai       | Keterangan                |
| ----------- | ------------------------- |
| pemasukan   | Menambah nilai keuangan   |
| pengeluaran | Mengurangi nilai keuangan |

---

## 4.3 Status Transaksi

Status transaksi yang ditemukan adalah sebagai berikut.

| Status   | Masuk Official Financial | Keterangan                              |
| -------- | ------------------------ | --------------------------------------- |
| approved | Ya                       | Transaksi telah disetujui               |
| valid    | Ya                       | Data legacy yang tetap dianggap valid   |
| pending  | Tidak                    | Menunggu approval                       |
| rejected | Tidak                    | Ditolak dan hanya menjadi histori audit |

---

# 5. Official Financial Rule

Official Financial merupakan angka keuangan resmi yang digunakan oleh Dashboard, Laporan, Export, dan proses pengambilan keputusan.

Official Financial hanya dihitung dari transaksi dengan status:

* approved
* valid (legacy)

Transaksi dengan status pending maupun rejected tidak dihitung sebagai angka resmi.

---

# 6. Formula Perhitungan

## Official Income

Seluruh transaksi dengan:

* status = approved atau valid
* tipe = pemasukan

---

## Official Expense

Seluruh transaksi dengan:

* status = approved atau valid
* tipe = pengeluaran

---

## Official Net

Official Net diperoleh dari:

Official Net = Official Income − Official Expense

---

# 7. Summary API Requirement

Summary API minimal harus menyediakan informasi berikut.

* Official Income
* Official Expense
* Official Net
* Total Official Transaction
* Monthly Breakdown
* Category Breakdown

Filter yang didukung:

* start_date
* end_date

Filter menggunakan kolom **tanggal**.

---

# 8. Validation Rule

Financial Validation dinyatakan berhasil apabila:

* hasil SQL sama dengan hasil Summary API;
* Dashboard menggunakan data dari Summary API;
* Laporan menggunakan data dari Summary API;
* Export menghasilkan angka yang sama dengan Dashboard dan Laporan.

Target validasi:

Database = Summary API = Dashboard = Laporan = Export

Selisih yang diperbolehkan:

0 (nol)

---

# 9. Acceptance Criteria

Financial Baseline dinyatakan valid apabila:

* Official Financial Rule terdokumentasi.
* Struktur transaksi telah diaudit.
* Formula perhitungan terdokumentasi.
* Summary API memiliki acuan yang jelas.
* Tidak terdapat perbedaan aturan perhitungan antar modul.

---

# 10. Catatan

Dokumen ini merupakan baseline awal untuk Sprint 3C dan akan diperbarui apabila terdapat perubahan yang telah disetujui melalui ADR.

Perubahan terhadap:

* business rule;
* role;
* permission;
* schema database;
* response API;
* Official Financial Rule;

tidak diperbolehkan tanpa persetujuan tim dan Decision Log (ADR).
