import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@shared/schema";
import ws from "ws";

// This is required for Neon serverless to work in Node.js environment
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

console.log("DATABASE DEBUG: Creating pool with DATABASE_URL");
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

console.log("DATABASE DEBUG: Creating Drizzle ORM instance");
export const db = drizzle(pool, { schema });

// Test database connection
pool.query("SELECT NOW()").then(result => {
  console.log("DATABASE CONNECTION TEST SUCCESSFUL", result.rows[0]);
}).catch(error => {
  console.error("DATABASE CONNECTION TEST FAILED", error);
});