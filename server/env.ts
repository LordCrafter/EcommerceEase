/**
 * Environment Variable Loader
 * Loads environment variables from .env file
 */

import * as fs from 'fs';
import * as path from 'path';

// List of database-related environment variables to validate
const DATABASE_ENV_VARS = [
  'DB_TYPE',
  'DATABASE_URL',
  'MYSQL_DATABASE',
  'MYSQL_HOST',
  'MYSQL_USER',
  'MYSQL_PASSWORD',
  'MYSQL_PORT'
];

// Load environment variables from .env file
export function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  
  try {
    if (fs.existsSync(envPath)) {
      console.log('Loading environment variables from .env file');
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');
      
      for (const line of envLines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          // Support for values with = in them (e.g., DATABASE_URL=postgres://user:pass@host:port/db)
          const firstEqualIndex = trimmedLine.indexOf('=');
          if (firstEqualIndex > 0) {
            const key = trimmedLine.substring(0, firstEqualIndex).trim();
            const value = trimmedLine.substring(firstEqualIndex + 1).trim();
            if (key && value) {
              process.env[key] = value;
            }
          }
        }
      }
      
      // Log database-related environment variables 
      validateAndLogDatabaseEnv();
    }
  } catch (error) {
    console.error('Error loading .env file:', error);
  }
}

// Validate and log database environment variables
function validateAndLogDatabaseEnv() {
  console.log('Environment variables:');
  
  // Log all database-related environment variables
  for (const envVar of DATABASE_ENV_VARS) {
    if (envVar === 'DATABASE_URL' || envVar === 'MYSQL_PASSWORD') {
      // Don't log sensitive values
      console.log(`- ${envVar} exists: ${process.env[envVar] !== undefined}`);
    } else {
      console.log(`- ${envVar}: ${process.env[envVar] || 'not set'}`);
    }
  }
  
  // Check if the database type is valid
  const dbType = process.env.DB_TYPE?.toLowerCase();
  if (dbType && !['mysql', 'postgres', 'auto'].includes(dbType)) {
    console.warn(`Warning: DB_TYPE '${dbType}' is not recognized. Valid options are 'mysql', 'postgres', or 'auto'.`);
  }
  
  // Validate MySQL configuration
  if (dbType === 'mysql' || dbType === 'auto') {
    if (!process.env.MYSQL_DATABASE) {
      console.warn('Warning: MYSQL_DATABASE is not set. This may cause issues with MySQL connections.');
    }
    
    if (!process.env.MYSQL_HOST) {
      console.warn('Warning: MYSQL_HOST is not set. Using default "localhost".');
    }
    
    if (!process.env.MYSQL_USER) {
      console.warn('Warning: MYSQL_USER is not set. Using default "root".');
    }
  }
  
  // Validate PostgreSQL configuration
  if ((dbType === 'postgres' || dbType === 'auto') && !process.env.DATABASE_URL) {
    console.warn('Warning: DATABASE_URL is not set. This will cause issues with PostgreSQL connections.');
  }
}