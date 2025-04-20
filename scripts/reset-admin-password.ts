#!/usr/bin/env tsx
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

// Reset the admin user password to "admin123" (now plain text since encryption is removed)
async function resetAdminPassword() {
  console.log("Resetting admin password...");
  
  // Check if admin user exists
  const admin = await db.select().from(users).where(eq(users.username, "admin"));
  
  if (admin.length > 0) {
    // Update the admin's password
    await db.update(users)
      .set({ password: "admin123" }) // Plain text password as requested
      .where(eq(users.username, "admin"));
    
    console.log("Admin password has been reset to 'admin123'");
  } else {
    // Create admin user if it doesn't exist
    const newAdmin = await db.insert(users).values({
      username: "admin",
      name: "Administrator",
      email: "admin@example.com",
      password: "admin123", // Plain text password as requested
      role: "admin",
      registration_date: new Date()
    }).returning();
    
    console.log("Created new admin user with password 'admin123'");
  }
}

resetAdminPassword().catch(console.error);