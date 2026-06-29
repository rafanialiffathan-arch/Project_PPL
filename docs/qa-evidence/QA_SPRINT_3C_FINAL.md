# QA Evidence - Sprint 3C Final

## Scope

Sprint 3C memastikan angka resmi perusahaan hanya dihitung dari transaksi official.

Official scope:
- approved
- valid legacy

Non-official scope:
- pending hanya monitoring approval
- rejected hanya histori audit

## Backend Validation

Endpoint yang diuji:
- GET /api/transaksi/summary
- GET /api/transaksi?status=approved

Hasil GET /api/transaksi/summary:
- official.income = 665000
- official.expense = 0
- official.net = 665000
- official.count = 3
- pending.count = 4
- rejected.count = 3

Hasil GET /api/transaksi?status=approved:
- REF-0020 / id 20 / approved / pemasukan / 200000
- REF-0018 / id 18 / approved / pemasukan / 132000
- REF-0014 / id 14 / approved / pemasukan / 333000

Total official:
- income = 665000
- expense = 0
- net = 665000
- count = 3

Status: PASS

## Dashboard Validation

Dashboard menampilkan:
- Total Pemasukan resmi: Rp 665.000 / Rp 665.0 rb
- Total Pengeluaran resmi: Rp 0
- Laba Bersih resmi: Rp 665.000 / Rp 665.0 rb
- Total transaksi resmi: 3
- Pending approval monitoring: 4
- Rejected history: 3
- Label approved + valid / official tampil

Pending dan rejected tidak mempengaruhi angka resmi Dashboard.

Status: PASS

## Laporan & Export Validation

File export yang diuji:
- finsped-laporan-keuangan-official-2026-06-28.csv
- finsped-laba-rugi-official-2026-06-28.csv
- finsped-jurnal-official-2026-06-28.csv

Semua file export hanya berisi 3 transaksi official:
- REF-0020 / approved / pemasukan / 200000
- REF-0018 / approved / pemasukan / 132000
- REF-0014 / approved / pemasukan / 333000

Pending dan rejected tidak muncul di export.

Status: PASS

## Build Validation

Frontend:
- .\node_modules\.bin\tsc.cmd --noEmit = PASS
- npm run build = PASS

Backend:
- npx tsc --noEmit = PASS
- npm run dev = PASS
- MySQL connected
- Server running at http://localhost:5000

## PR Evidence

Merged to dev:
- PR #2: feat(dashboard): use official transaction summary
- PR #3: feat(laporan): use official transactions only

## Final Verdict

Sprint 3C core: PASS.

Dashboard, laporan, dan export sudah menggunakan angka resmi berdasarkan transaksi approved + valid legacy.
Pending hanya monitoring approval.
Rejected hanya histori audit.
