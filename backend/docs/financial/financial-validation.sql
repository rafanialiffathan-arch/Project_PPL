-- Official Income

SELECT SUM(jumlah)
FROM transaksi
WHERE status IN ('approved','valid')
AND tipe='pemasukan';

-- Official Expense

SELECT SUM(jumlah)
FROM transaksi
WHERE status IN ('approved','valid')
AND tipe='pengeluaran';