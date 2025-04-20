/**
 * Environment Variable Loader
 * Loads environment variables from .env file
 */

import * as fs from 'fs';
import * as path from 'path';

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
          const [key, value] = trimmedLine.split('=');
          if (key && value) {
            process.env[key.trim()] = value.trim();
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading .env file:', error);
  }
}