-- =====================================================
-- Finsped Express — Seeder (Optional)
-- Fase 1A ONLY. Jalankan SEKALI SAJA saat setup awal.
-- TIDAK boleh dijalankan berulang — tidak idempotent.
-- =====================================================

USE accountech_db;

-- =====================================================
-- Buat admin_sistem pertama
-- =====================================================
-- Password yang di-hash: 'admin123' -> di-hash dengan bcrypt, cost=10
-- HASH BAWAH ADALAH CONTOH. GANTI dengan hash bcrypt yang baru:
--   -- Generate hash dengan Node.js:
--   -- node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('admin123',10).then(h=>console.log(h))"
--   -- Lalu paste hasil hash ke bawah ini (ganti value 'password_hash_here').

INSERT INTO users (nama_lengkap, email, username, password, role, is_active, created_at)
VALUES (
  'Administrator Sistem',
  'admin@finsped.id',
  'admin',
  '$2a$10$R7FLDuqOaBnXe0r.Y2HSuODW/j5vtP.7M1CjXpQkV1j8vE5oG8KdW',
  'admin_sistem',
  1,
  NOW()
) ON DUPLICATE KEY UPDATE password = VALUES(password);

-- Password hash di atas adalah contoh untuk 'admin123'.
-- SETELAH login pertama, Wajib ganti password.
-- =====================================================
