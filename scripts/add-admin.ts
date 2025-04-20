/**
 * Quick script to add an admin user and test products
 */

import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { db } from '../server/db';
import * as schema from '../shared/schema';
import { eq } from 'drizzle-orm';

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

async function addAdmin() {
  console.log('Adding admin user...');
  
  // Create admin user
  const hashedPassword = await hashPassword('admin123');
  
  // Check if admin already exists
  const existingAdmin = await db.select()
    .from(schema.users)
    .where(eq(schema.users.username, 'admin'));
  
  if (existingAdmin.length > 0) {
    console.log('Admin user already exists, skipping creation.');
    return existingAdmin[0].id;
  }
  
  const [admin] = await db.insert(schema.users).values({
    username: 'admin',
    name: 'Admin User',
    email: 'admin@example.com',
    password: hashedPassword,
    role: 'admin',
    registration_date: new Date(),
    last_updated: null,
    phone_number: null,
    address: null
  }).returning();
  
  console.log(`Created admin user with ID: ${admin.id}`);
  return admin.id;
}

async function addTestSeller(userId: number) {
  console.log('Adding test seller...');
  
  // Check if seller already exists for this user
  const existingSeller = await db.select()
    .from(schema.sellers)
    .where(eq(schema.sellers.user_id, userId));
    
  if (existingSeller.length > 0) {
    console.log('Seller already exists for this user, skipping creation.');
    return existingSeller[0];
  }
  
  // Create seller
  const [seller] = await db.insert(schema.sellers).values({
    user_id: userId,
    seller_id: `SELLER-${randomUUID().substring(0, 8)}`,
    shop_name: 'Admin Test Shop',
    joined_date: new Date(),
    rating: 5.0,
    verified: true
  }).returning();
  
  console.log(`Created seller with ID: ${seller.id}`);
  return seller;
}

async function addTestProducts(sellerId: number) {
  console.log('Adding test products...');
  
  // Check if this seller already has products
  const existingProducts = await db.select()
    .from(schema.products)
    .where(eq(schema.products.seller_id, sellerId));
    
  if (existingProducts.length > 0) {
    console.log(`Seller already has ${existingProducts.length} products, skipping creation.`);
    return;
  }
  
  // Add a test product
  const [product] = await db.insert(schema.products).values({
    name: 'Test Product',
    description: 'This is a test product',
    price: 99.99,
    stock: 100,
    status: 'active',
    seller_id: sellerId,
    product_id: `PROD-${randomUUID().substring(0, 8)}`,
    image_url: 'https://picsum.photos/200',
    added_date: new Date(),
    last_updated: null
  }).returning();
  
  console.log(`Created product with ID: ${product.id}`);
  
  // Create or get Electronics category
  let electronicsCategory;
  const existingCategories = await db.select()
    .from(schema.categories)
    .where(eq(schema.categories.category_name, 'Electronics'));
  
  if (existingCategories.length > 0) {
    electronicsCategory = existingCategories[0];
  } else {
    [electronicsCategory] = await db.insert(schema.categories).values({
      category_id: `CAT-${randomUUID().substring(0, 8)}`,
      category_name: 'Electronics',
      description: 'Electronic devices and gadgets'
    }).returning();
  }
  
  // Assign product to category
  await db.insert(schema.productCategories).values({
    product_id: product.id,
    category_id: electronicsCategory.id
  });
  
  console.log(`Assigned product to category: ${electronicsCategory.category_name}`);
}

async function main() {
  try {
    // Add admin
    const adminId = await addAdmin();
    
    // Add seller profile for admin
    const seller = await addTestSeller(adminId);
    
    // Add test products
    await addTestProducts(seller.id);
    
    console.log('All test data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

// Run the script
main();