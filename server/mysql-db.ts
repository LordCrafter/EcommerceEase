import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/mysql-schema";
import { MYSQL_CONFIG } from './config';

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

// Real connection variables - will be populated by initializeMySql if successful
let realPool: any = null;
let realDb: any = null;

// This function is used to initialize the MySQL connection
// It will be called by the storage implementation when needed
export async function initializeMySql() {
  try {
    console.log("MYSQL DEBUG: Attempting to connect to MySQL...");
    
    // Check if MySQL configuration is available
    if (!MYSQL_CONFIG.isAvailable) {
      console.log("MYSQL DEBUG: MySQL configuration is not available");
      return { pool: dummyPool, db: dummyDb, isAvailable: false };
    }
    
    // Create a MySQL connection pool
    const port = process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306;
    const mysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: port,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'ecommerce',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000 // Longer timeout for connection
    });

    // Test the connection with a timeout
    console.log("MYSQL DEBUG: Testing connection...");
    await Promise.race([
      mysqlPool.query('SELECT 1'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      )
    ]);

    console.log("MYSQL DEBUG: Connection successful!");
    
    // Create a Drizzle ORM instance
    const mysqlDb = drizzle(mysqlPool, { schema, mode: 'default' });
    
    // Update the exported variables
    realPool = mysqlPool;
    realDb = mysqlDb;
    
    return { pool: mysqlPool, db: mysqlDb, isAvailable: true };
  } catch (error) {
    console.error("MYSQL DEBUG: Failed to initialize MySQL database:", error);
    return { pool: dummyPool, db: dummyDb, isAvailable: false };
  }
}

// Export either the real pool/db or the dummy ones
export const pool = realPool || dummyPool;
export const db = realDb || dummyDb;

// Attempt to initialize MySQL connection at startup
// This helps detect issues early
console.log("MYSQL DEBUG: Attempting initial connection test...");
initializeMySql()
  .then(({ isAvailable }) => {
    if (isAvailable) {
      console.log("MYSQL DEBUG: Initial connection test successful");
    } else {
      console.log("MYSQL DEBUG: Initial connection test failed");
    }
  })
  .catch(err => {
    console.error("MYSQL DEBUG: Error during initial connection test:", err);
  });