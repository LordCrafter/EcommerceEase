/**
 * Database Configuration
 * This file provides a centralized configuration for database connections.
 * It supports both PostgreSQL and MySQL databases.
 */

// Database type can be 'postgres' or 'mysql'
export const DB_TYPE = process.env.DB_TYPE || 'postgres';

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
  if (process.env.DB_TYPE) {
    // If explicitly set, use that
    return process.env.DB_TYPE;
  }
  
  // Otherwise, use what's available
  if (MYSQL_CONFIG.isAvailable) {
    return 'mysql';
  }
  
  if (POSTGRES_CONFIG.isAvailable) {
    return 'postgres';
  }
  
  // Default fallback
  return 'memory';
};