import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Pool koneksi — lebih efisien daripada single connection
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || 'b2412skc',
  database: process.env.DB_NAME     || 'accountech_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test koneksi saat startup
export async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL terhubung!');
    conn.release();
  } catch (err) {
    console.error('❌ Koneksi MySQL gagal:', err);
    process.exit(1);
  }
}

export default pool;