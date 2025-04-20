import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@shared/schema";
import ws from "ws";
import { DB_TYPE } from "./config";

// This is required for Neon serverless to work in Node.js environment
neonConfig.webSocketConstructor = ws;

// Define a dummy pool and db that will be used if PostgreSQL is not available
const dummyPool: any = {
  query: async () => { throw new Error('PostgreSQL not available'); },
  execute: async () => { throw new Error('PostgreSQL not available'); },
  end: async () => { return; }
};

const dummyDb: any = {
  select: () => ({ from: () => [] }),
  insert: () => ({ values: () => [] }),
  update: () => ({ set: () => ({ where: () => [] }) }),
  delete: () => ({ where: () => [] })
};

// Only initialize the real connection if we're using PostgreSQL
let realPool: Pool | null = null;
let realDb: any = null;

// Check if we have a DATABASE_URL and if we're supposed to use PostgreSQL
if (process.env.DATABASE_URL && (DB_TYPE === 'postgres' || DB_TYPE === 'auto')) {
  try {
    console.log("DATABASE DEBUG: Creating pool with DATABASE_URL");
    realPool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    console.log("DATABASE DEBUG: Creating Drizzle ORM instance");
    realDb = drizzle(realPool, { schema });
    
    // Test database connection
    realPool.query("SELECT NOW()").then(result => {
      console.log("DATABASE CONNECTION TEST SUCCESSFUL", result.rows[0]);
    }).catch(error => {
      console.error("DATABASE CONNECTION TEST FAILED", error);
    });
  } catch (error) {
    console.error("Failed to initialize PostgreSQL:", error);
    realPool = null;
    realDb = null;
  }
} else {
  console.log("PostgreSQL not configured or not selected as DB_TYPE. Using dummy connection.");
}

// Export either the real pool/db or the dummy ones
export const pool = realPool || dummyPool;
export const db = realDb || dummyDb;