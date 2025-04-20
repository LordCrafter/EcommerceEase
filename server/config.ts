/**
 * Database Configuration
 * This file provides a centralized configuration for database connections.
 * It supports both PostgreSQL and MySQL databases.
 */

// Import and load environment variables first
import { loadEnv } from "./env";
loadEnv();

// Database type can be 'postgres' or 'mysql'
export const DB_TYPE = process.env.DB_TYPE || 'postgres';

// Print environment variables for debugging
console.log('Environment variables:');
console.log('- DB_TYPE:', process.env.DB_TYPE);
console.log('- DATABASE_URL exists:', process.env.DATABASE_URL !== undefined);
console.log('- MYSQL_DATABASE:', process.env.MYSQL_DATABASE);
console.log('- MYSQL_HOST:', process.env.MYSQL_HOST);
console.log('- MYSQL_USER:', process.env.MYSQL_USER);

// PostgreSQL Configuration
export const POSTGRES_CONFIG = {
  connectionString: process.env.DATABASE_URL,
  isAvailable: process.env.DATABASE_URL !== undefined
};

// MySQL Configuration
export const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'ecommerce',
  isAvailable: process.env.MYSQL_DATABASE !== undefined
};

// Check if database configuration is available
export const isDatabaseConfigured = () => {
  if (DB_TYPE === 'mysql') {
    return MYSQL_CONFIG.isAvailable;
  } else {
    return POSTGRES_CONFIG.isAvailable;
  }
};

// Get the database type in use
export const getDatabaseType = () => {
  console.log('Determining database type...');
  console.log('- DB_TYPE explicitly set to:', process.env.DB_TYPE);
  console.log('- MYSQL_CONFIG.isAvailable:', MYSQL_CONFIG.isAvailable);
  console.log('- POSTGRES_CONFIG.isAvailable:', POSTGRES_CONFIG.isAvailable);
  
  if (process.env.DB_TYPE) {
    // If explicitly set, use that
    console.log('Using explicitly set DB_TYPE:', process.env.DB_TYPE);
    return process.env.DB_TYPE;
  }
  
  // Otherwise, use what's available
  if (MYSQL_CONFIG.isAvailable) {
    console.log('MySQL config is available, using MySQL');
    return 'mysql';
  }
  
  if (POSTGRES_CONFIG.isAvailable) {
    console.log('PostgreSQL config is available, using PostgreSQL');
    return 'postgres';
  }
  
  // Default fallback
  console.log('No database config found, using in-memory storage');
  return 'memory';
};