-- =====================================================
-- Finsped Express - AccounTech DB Migration
-- Run this in MySQL to create required tables
-- =====================================================

USE accountech_db;

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
);

-- ----------------------------
-- Insert sample inventaris data
-- ----------------------------
INSERT INTO inventaris (nama_barang, kategori, jumlah, satuan, harga_satuan, kondisi, status) VALUES
('Laptop Dell XPS 15', 'elektronik', 12, 'unit', 18500000, 'baik', 'digunakan'),
('Printer Canon G3000', 'elektronik', 5, 'unit', 3200000, 'baik', 'digunakan'),
('Meja Kerja Kayu Jati', 'furniture', 20, 'unit', 2500000, 'baik', 'tersedia'),
('AC Panasonic 1 PK', 'elektronik', 8, 'unit', 4500000, 'baik', 'digunakan'),
('Kursi Ergonomis', 'furniture', 30, 'unit', 1800000, 'rusak_ringan', 'maintenance'),
('Motor Honda Beat', 'kendaraan', 3, 'unit', 15000000, 'baik', 'digunakan'),
('Spidol Snowman', 'perlengkapan', 50, 'pcs', 5000, 'baik', 'tersedia'),
('Kertas HVS A4 70gr', 'perlengkapan', 100, 'box', 45000, 'baik', 'tersedia');

-- ----------------------------
-- Verify data
-- ----------------------------
-- SELECT * FROM inventaris;
-- SELECT COUNT(*) as total FROM inventaris;
