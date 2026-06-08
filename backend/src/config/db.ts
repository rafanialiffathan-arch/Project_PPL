import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`❌ Environment variable ${key} tidak ditemukan. Mohon set di .env`);
    process.exit(1);
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST as string,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER as string,
  password: process.env.DB_PASSWORD as string,
  database: process.env.DB_NAME as string,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

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
