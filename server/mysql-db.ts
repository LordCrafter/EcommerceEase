import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/mysql-schema";

// Define a dummy pool and db that will be used if MySQL is not available
const dummyPool: any = {
  query: async () => { throw new Error('MySQL not available'); },
  execute: async () => { throw new Error('MySQL not available'); },
  end: async () => { return; }
};

const dummyDb: any = {
  select: () => ({ from: () => [] }),
  insert: () => ({ values: () => [] }),
  update: () => ({ set: () => ({ where: () => [] }) }),
  delete: () => ({ where: () => [] })
};

// This function is used to initialize the MySQL connection
// It will be called by the storage implementation when needed
export async function initializeMySql() {
  try {
    console.log("Attempting to connect to MySQL...");
    // Create a MySQL connection pool
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'ecommerce',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 3000 // Faster timeout for connection
    });

    // Test the connection with a timeout
    await Promise.race([
      pool.query('SELECT 1'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 3000)
      )
    ]);

    console.log("MySQL connection successful");
    // Create a Drizzle ORM instance
    const db = drizzle(pool, { schema, mode: 'default' });
    return { pool, db, isAvailable: true };
  } catch (error) {
    console.error("Failed to initialize MySQL database:", error);
    return { pool: dummyPool, db: dummyDb, isAvailable: false };
  }
}

// Export the dummy pool and db initially
// These will be replaced with real ones if connection succeeds
export let pool = dummyPool;
export let db = dummyDb;