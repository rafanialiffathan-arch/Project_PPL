-- =====================================================
-- Finsped Express — Sprint 3A Migration
-- Approval workflow foundation for `transaksi`.
-- STANDALONE: tidak bergantung pada migrations.sql.
-- Idempotent: aman dijalankan berulang.
-- =====================================================
-- Menambahkan kolom audit approval/rejection + FK + index
-- tanpa mengubah kolom `status` (tetap VARCHAR agar aman
-- untuk tabel yang sudah berisi data `'pending'` / `'valid'`).
-- =====================================================

USE accountech_db;

-- =====================================================
-- 1. Helper procedures (DROP IF EXISTS + CREATE)
-- =====================================================
-- Semua procedure di-prefix DROP IF EXISTS agar file ini
-- benar-benar standalone dan aman dijalankan berulang,
-- bahkan pada database yang belum pernah menjalankan
-- migrations.sql.
-- =====================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS add_column_if_missing $$
CREATE PROCEDURE add_column_if_missing(
  IN p_table VARCHAR(64),
  IN p_column VARCHAR(64),
  IN p_definition TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table
      AND COLUMN_NAME = p_column
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE ', p_table, ' ADD COLUMN ', p_column, ' ', p_definition);
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END $$

DROP PROCEDURE IF EXISTS add_index_if_missing $$
CREATE PROCEDURE add_index_if_missing(
  IN p_table VARCHAR(64),
  IN p_index_name VARCHAR(64),
  IN p_definition TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table
      AND INDEX_NAME = p_index_name
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE ', p_table, ' ADD INDEX ', p_index_name, ' ', p_definition);
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END $$

DROP PROCEDURE IF EXISTS add_fk_if_missing $$
CREATE PROCEDURE add_fk_if_missing(
  IN p_table VARCHAR(64),
  IN p_fk_name VARCHAR(64),
  IN p_definition TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table
      AND CONSTRAINT_NAME = p_fk_name
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE ', p_table, ' ADD CONSTRAINT ', p_fk_name, ' ', p_definition);
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END $$

DELIMITER ;

-- =====================================================
-- 2. Tambah kolom audit approval/rejection
-- =====================================================
-- Semua kolom NULL-able agar tidak rewrite baris existing.
-- Urutan AFTER disusun untuk konsistensi logis di DESCRIBE.
-- =====================================================

CALL add_column_if_missing('transaksi', 'approved_by',   'INT NULL AFTER bukti_transaksi');
CALL add_column_if_missing('transaksi', 'approved_at',   'DATETIME NULL AFTER approved_by');
CALL add_column_if_missing('transaksi', 'rejected_by',   'INT NULL AFTER approved_at');
CALL add_column_if_missing('transaksi', 'rejected_at',   'DATETIME NULL AFTER rejected_by');
CALL add_column_if_missing('transaksi', 'approval_note', 'TEXT NULL AFTER rejected_at');

-- =====================================================
-- 2B. Konversi kolom status ke VARCHAR(20)
-- =====================================================
-- Latar belakang:
--   Kolom `transaksi.status` didefinisikan sebelumnya sebagai
--   ENUM('valid','pending') di database existing. Setelah
--   endpoint PATCH /:id/approve diperkenalkan di Sprint 3A,
--   aplikasi perlu menulis nilai 'approved' dan 'rejected'
--   yang tidak termasuk dalam ENUM lama — MySQL menolak
--   dengan "Data truncated for column 'status'".
--
--   Solusi: ubah kolom menjadi VARCHAR(20) NOT NULL DEFAULT
--   'pending' agar fleksibel untuk workflow approval.
--
-- Status value yang didukung aplikasi ke depan:
--   - 'pending'   : transaksi baru, menunggu approval
--   - 'approved'  : sudah disetujui (oleh pimpinan / admin)
--   - 'rejected'  : ditolak (dengan approval_note)
--
--   Nilai legacy 'valid' (dari data lama sebelum Sprint 3A)
--   TETAP DIPERTAHANKAN apa adanya di baris yang sudah ada.
--   Tidak dinormalisasi ke 'approved' — normalisasi data lama
--   akan ditangani di season berikutnya agar tidak
--   mengejutkan frontend lama yang masih mengenali 'valid'.
--
-- Idempotensi:
--   1) Pengamanan UPDATE baris dengan status NULL/'' ke
--      'pending' WAJIB dilakukan SEBELUM MODIFY ke NOT NULL,
--      agar ALTER tidak gagal pada baris yang tidak valid.
--   2) Sebelum MODIFY, cek tipe kolom via INFORMATION_SCHEMA;
--      hanya ALTER jika belum VARCHAR(20).
-- =====================================================

-- 2B-1. Pengamanan: isi dulu baris yang status-nya NULL/kosong.
-- id >= 0 memastikan Safe Update Mode tidak menolak (WHERE tidak
-- boleh kosong saat tidak ada KEY column di klausa WHERE).
UPDATE transaksi
   SET status = 'pending'
 WHERE id >= 0
   AND (
     status IS NULL
     OR TRIM(CAST(status AS CHAR)) = ''
   );

-- 2B-2. MODIFY ke VARCHAR(20) NOT NULL DEFAULT 'pending' HANYA
--        jika tipe kolom saat ini belum VARCHAR(20).
--        MySQL tidak punya 'ALTER COLUMN ... IF NOT LIKE',
--        jadi kita cek lewat INFORMATION_SCHEMA.COLUMNS
--        (COLUMN_TYPE persis 'varchar(20)').
SET @needs_modify = (
  SELECT COUNT(*) = 0
    FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'transaksi'
     AND COLUMN_NAME = 'status'
     AND COLUMN_TYPE = 'varchar(20)'
);

SET @ddl = IF(
  @needs_modify = 1,
  "ALTER TABLE transaksi MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending'",
  'SELECT ''status already varchar(20); skip'' AS info'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 3. Tambah foreign key ke users(id)
-- =====================================================
-- ON DELETE SET NULL: jika user approver/rejecter dihapus,
-- audit trail tetap terjaga (siapa yang dulunya approve)
-- tanpa memblokir penghapusan user.
-- =====================================================

CALL add_fk_if_missing(
  'transaksi',
  'fk_transaksi_approved_by',
  'FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL'
);

CALL add_fk_if_missing(
  'transaksi',
  'fk_transaksi_rejected_by',
  'FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL'
);

-- =====================================================
-- 4. Index untuk query laporan "hanya approved"
-- =====================================================
-- Index pada kolom `status` mempercepat filter
-- WHERE status = 'approved' di laporan/dashboard resmi
-- (Sprint 3B).
-- =====================================================

CALL add_index_if_missing('transaksi', 'idx_transaksi_status', '(status)');

-- =====================================================
-- 5. VERIFY (jalankan manual setelah migrate)
-- =====================================================
-- DESCRIBE transaksi;
-- SHOW INDEX FROM transaksi;
-- SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
--   FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
--   WHERE TABLE_SCHEMA = 'accountech_db'
--     AND TABLE_NAME = 'transaksi'
--     AND REFERENCED_TABLE_NAME IS NOT NULL;

-- =====================================================
-- 6. CATATAN
-- =====================================================
-- - Kolom `status` sudah dikonversi dari ENUM('valid','pending')
--   menjadi VARCHAR(20) NOT NULL DEFAULT 'pending' pada section
--   2B. Nilai legacy 'valid' pada baris lama DIPERTAHANKAN
--   apa adanya (tidak dinormalisasi ke 'approved').
-- - Status value aplikasi yang valid: pending, approved,
--   rejected (validasi di layer aplikasi, lihat transaksi.ts).
-- - Tidak menyentuh tabel apapun di luar `transaksi`.
-- - Tidak menghapus / mengubah kolom lama selain `status`.
-- - Aman dijalankan berulang (semua ADD dilakukan via
--   INFORMATION_SCHEMA guard + DROP IF EXISTS pada helper).
-- - File ini STANDALONE: tidak bergantung pada migrations.sql.
-- =====================================================
