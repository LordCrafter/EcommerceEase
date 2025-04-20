#!/usr/bin/env tsx
import { db } from "../server/db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

async function checkDatabase() {
  console.log("Checking database...");
  
  // Get all products
  const products = await db.select().from(schema.products);
  console.log(`Found ${products.length} products in the database:`);
  products.forEach(p => console.log(` - Product ${p.id}: ${p.name} (${p.status})`));
  
  // Get all product-category associations
  const associations = await db.select().from(schema.productCategories);
  console.log(`\nFound ${associations.length} product-category associations:`);
  associations.forEach(a => console.log(` - Product ${a.product_id} is in category ${a.category_id}`));
  
  // Get all products in category 1
  const electronicsProducts = await db.select().from(schema.products)
    .innerJoin(
      schema.productCategories,
      eq(schema.products.id, schema.productCategories.product_id)
    )
    .where(eq(schema.productCategories.category_id, 1));
  
  console.log(`\nProducts in Electronics category (${electronicsProducts.length}):`);
  electronicsProducts.forEach(row => console.log(` - ${row.products.id}: ${row.products.name}`));
  
  // Compare to get products with status=active directly
  const activeProducts = await db.select().from(schema.products)
    .where(eq(schema.products.status, "active"));
  
  console.log(`\nActive products (${activeProducts.length}):`);
  activeProducts.forEach(p => console.log(` - ${p.id}: ${p.name}`));
}

checkDatabase().catch(console.error);