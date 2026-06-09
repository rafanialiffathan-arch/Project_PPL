-- =====================================================
-- Finsped Express — Database Migration
-- Versi: Phase 1A (Role Foundation + User Management Tables)
-- Run this file in MySQL Workbench / CLI.
-- Idempotent: aman dijalankan berulang.
-- =====================================================

-- =====================================================
-- 0. DATABASE
-- =====================================================
CREATE DATABASE IF NOT EXISTS accountech_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE accountech_db;

-- =====================================================
-- 1. TABEL: users
-- =====================================================
-- Tabel users sengaja menggunakan VARCHAR(50) untuk role, bukan ENUM,
-- agar migrasi role lama (admin/pimpinan) ke role baru
-- (admin_sistem/pimpinan/pengelola_internal) tidak terhenti oleh ENUM check.
--
-- Mapping role (JALANKAN MANUAL setelah review):
--   admin lama (yang sebenarnya Admin Sistem) -> admin_sistem
--   admin lama (yang sebenarnya staff)       -> pengelola_internal
--   pimpinan lama                              -> pimpinan (nama tetap)
--
-- Contoh query review (JANGAN dijalankan otomatis):
--   SELECT id, username, email, role FROM users;
--   UPDATE users SET role='admin_sistem' WHERE id=<id_admin_sejati>;
--   UPDATE users SET role='pengelola_internal' WHERE role='admin' AND id<>1;
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_lengkap VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'pengelola_internal',
  permissions JSON NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_users_email (email),
  UNIQUE KEY uk_users_username (username),

  -- Role final yang valid: admin_sistem, pimpinan, pengelola_internal
  -- Disimpan sebagai VARCHAR (lihat catatan di atas).
  CONSTRAINT chk_users_role CHECK (
    role IN ('admin_sistem', 'pimpinan', 'pengelola_internal')
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 1B. TABEL: permissions
-- =====================================================
-- Daftar permission yang tersedia di sistem.
-- Baris di sini adalah katalog — bukan assignment ke user.
-- Assignment ada di tabel role_permissions.
-- =====================================================
CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uk_permissions_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 1C. TABEL: role_permissions
-- =====================================================
-- Definisi permission default untuk setiap role.
-- Saat login, backend me-resolve permission user dengan cara:
--   1) Jika users.permissions (JSON) terisi -> pakai itu (override).
--   2) Jika NULL -> fallback ke role_permissions berdasarkan users.role.
-- =====================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  permission_code VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uk_role_permission (role, permission_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. EXISTING TABLES (dijaga agar tidak rusak)
-- =====================================================

-- ----------------------------
-- Table: inventaris
-- ----------------------------
CREATE TABLE IF NOT EXISTS inventaris (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_barang VARCHAR(255) NOT NULL,
  kategori ENUM('elektronik', 'furniture', 'kendaraan', 'perlengkapan', 'lainnya') DEFAULT 'lainnya',
  jumlah INT NOT NULL DEFAULT 1,
  satuan ENUM('unit', 'pcs', 'box', 'lembar', 'meter', 'kg', 'liter') DEFAULT 'unit',
  harga_satuan DECIMAL(15, 2) NOT NULL,
  total_nilai DECIMAL(15, 2) GENERATED ALWAYS AS (jumlah * harga_satuan) STORED,
  tanggal_masuk DATE DEFAULT (CURRENT_DATE),
  kondisi ENUM('baik', 'rusak_ringan', 'rusak_berat') DEFAULT 'baik',
  status ENUM('tersedia', 'digunakan', 'maintenance', 'dibuang') DEFAULT 'tersedia',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: rekonsiliasi_bank
-- ----------------------------
CREATE TABLE IF NOT EXISTS rekonsiliasi_bank (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  nama_bank VARCHAR(100) NOT NULL,
  nomor_rekening VARCHAR(50) NOT NULL,
  saldo_buku DECIMAL(15, 2) NOT NULL,
  saldo_bank DECIMAL(15, 2) NOT NULL,
  selisih DECIMAL(15, 2) GENERATED ALWAYS AS (saldo_bank - saldo_buku) STORED,
  tanggal_rekonsiliasi DATE NOT NULL,
  status ENUM('sesuai', 'selisih', 'pending') DEFAULT 'pending',
  catatan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. SEED: permissions (katalog)
-- =====================================================
-- Idempotent: INSERT IGNORE agar aman dijalankan ulang.
-- =====================================================
INSERT IGNORE INTO permissions (code, name, module) VALUES
  ('manage_users',         'Manajemen User',                'admin'),
  ('manage_coa',           'Manajemen Chart of Accounts',   'admin'),
  ('view_audit_log',       'Lihat Audit Log',               'admin'),
  ('view_dashboard',       'Lihat Dashboard',               'shared'),
  ('view_reports',         'Lihat Laporan',                 'shared'),
  ('view_pembukuan',       'Lihat Pembukuan',               'shared'),
  ('manage_transaksi',     'Kelola Transaksi',              'operasional'),
  ('manage_aset',          'Kelola Aset',                   'operasional'),
  ('manage_inventaris',    'Kelola Inventaris',             'operasional'),
  ('manage_rekonsiliasi',  'Kelola Rekonsiliasi Bank',      'operasional'),
  ('manage_perencanaan',   'Kelola Perencanaan',            'operasional'),
  ('approve_transaction',  'Setujui Transaksi',             'approval');

-- =====================================================
-- 4. SEED: role_permissions (default per role)
-- =====================================================
-- admin_sistem: SEMUA permission (sumber: tabel permissions)
-- pimpinan: read-only + approval
-- pengelola_internal: operasional harian
-- =====================================================

-- 4A. admin_sistem -> semua permission
INSERT IGNORE INTO role_permissions (role, permission_code)
SELECT 'admin_sistem', code FROM permissions;

-- 4B. pimpinan
INSERT IGNORE INTO role_permissions (role, permission_code) VALUES
  ('pimpinan', 'view_dashboard'),
  ('pimpinan', 'view_reports'),
  ('pimpinan', 'view_pembukuan'),
  ('pimpinan', 'approve_transaction');

-- 4C. pengelola_internal
INSERT IGNORE INTO role_permissions (role, permission_code) VALUES
  ('pengelola_internal', 'view_dashboard'),
  ('pengelola_internal', 'view_reports'),
  ('pengelola_internal', 'view_pembukuan'),
  ('pengelola_internal', 'manage_transaksi'),
  ('pengelola_internal', 'manage_aset'),
  ('pengelola_internal', 'manage_inventaris'),
  ('pengelola_internal', 'manage_rekonsiliasi'),
  ('pengelola_internal', 'manage_perencanaan');

-- =====================================================
-- 5. EXISTING DATABASE MIGRATION (ALTER untuk users lama)
-- =====================================================
-- Bagian ini HANYA untuk database yang SUDAH memiliki tabel users
-- dengan kolom role('admin'/'pimpinan') atau tanpa kolom permissions.
--
-- MySQL 8 TIDAK mendukung 'ADD COLUMN IF NOT EXISTS' (fitur MariaDB saja).
-- Gunakan PROCEDURE di bawah ini untuk safe-add kolom.
-- Jalankan blok ini di MySQL Workbench.
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

DELIMITER ;

-- Panggil procedure untuk menambah kolom yang mungkin belum ada
CALL add_column_if_missing('users', 'permissions', 'JSON NULL AFTER role');
CALL add_column_if_missing('users', 'is_active', 'TINYINT(1) NOT NULL DEFAULT 1 AFTER permissions');
CALL add_column_if_missing('users', 'created_by', 'INT NULL AFTER is_active');
CALL add_column_if_missing('users', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER created_by');
CALL add_column_if_missing('users', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');

-- Tambah index/unique jika belum ada (untuk email & username)
-- Catatan: pastikan dulu tidak ada data duplikat sebelum menambah index.
-- Aman dijalankan setelah cleaning data:
--   ALTER TABLE users ADD UNIQUE KEY uk_users_email (email);
--   ALTER TABLE users ADD UNIQUE KEY uk_users_username (username);
-- Cek index yang sudah ada:
--   SHOW INDEX FROM users;

-- =====================================================
-- 6. VERIFY (jalankan manual setelah migrate)
-- =====================================================
-- SHOW TABLES;
-- DESCRIBE users;
-- SELECT * FROM permissions;
-- SELECT * FROM role_permissions;
--
-- Cek user existing (JANGAN auto-update, hanya review):
--   SELECT id, username, email, role, is_active FROM users;
--
-- Mapping role lama ke role baru (jalankan manual setelah konfirmasi):
--   UPDATE users SET role = 'admin_sistem'        WHERE id = <id_admin_sejati>;
--   UPDATE users SET role = 'pengelola_internal'  WHERE role = 'admin' AND id <> <id_admin_sejati>;
--   -- 'pimpinan' lama tetap 'pimpinan' (nama tidak berubah)
--
-- =====================================================
-- 7. CATATAN KEAMANAN
-- =====================================================
-- - TIDAK ADA akun admin hardcoded di migration ini.
-- - Akun admin_sistem pertama harus dibuat lewat:
--     a) CLI seeder terpisah (lihat backend/sql/seeder.sql), ATAU
--     b) Admin Panel (akan dibuat di Phase 1B).
-- - Password akan di-hash dengan bcrypt di aplikasi, JANGAN simpan plain.
-- - Migration ini tidak menyentuh backend route, tidak menyentuh frontend.
-- =====================================================
