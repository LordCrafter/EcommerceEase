/**
 * Database Seed Script
 * This script creates test data including admin accounts, sellers, and products
 */

import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { storage } from '../server/storage';

interface TestUser {
  username: string;
  name: string;
  email: string;
  password: string;
  role: string;
}

interface TestSeller {
  userId: number;
  shopName: string;
  verified: boolean;
}

interface TestProduct {
  sellerId: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: string;
  imageUrl?: string;
}

interface TestCategory {
  name: string;
  description: string;
}

// Helper to hash passwords
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// Generate a random product ID
function generateProductId(): string {
  return `PROD-${randomUUID().substring(0, 8)}`;
}

// Helper to generate random prices
function randomPrice(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

// Helper to generate random stock levels
function randomStock(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Create test users (including admin)
async function createTestUsers(): Promise<number[]> {
  const userIds: number[] = [];
  
  const testUsers: TestUser[] = [
    {
      username: 'admin',
      name: 'Admin User',
      email: 'admin@example.com',
      password: await hashPassword('admin123'),
      role: 'admin'
    },
    {
      username: 'seller1',
      name: 'Seller One',
      email: 'seller1@example.com',
      password: await hashPassword('seller123'),
      role: 'seller'
    },
    {
      username: 'seller2',
      name: 'Seller Two',
      email: 'seller2@example.com',
      password: await hashPassword('seller123'),
      role: 'seller'
    },
    {
      username: 'customer1',
      name: 'Customer One',
      email: 'customer1@example.com',
      password: await hashPassword('customer123'),
      role: 'customer'
    }
  ];

  for (const user of testUsers) {
    try {
      const createdUser = await storage.createUser({
        username: user.username,
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
        registration_date: new Date(),
        last_updated: null,
        phone_number: null,
        address: null
      });
      
      userIds.push(createdUser.id);
      console.log(`Created user: ${user.username} (${user.role})`);
    } catch (error) {
      console.error(`Error creating user ${user.username}:`, error);
    }
  }
  
  return userIds;
}

// Create test sellers
async function createTestSellers(userIds: number[]): Promise<number[]> {
  const sellerIds: number[] = [];
  
  const testSellers: TestSeller[] = [
    {
      userId: userIds[1], // seller1
      shopName: 'Awesome Shop',
      verified: true
    },
    {
      userId: userIds[2], // seller2
      shopName: 'Great Deals',
      verified: true
    }
  ];
  
  for (const seller of testSellers) {
    try {
      const sellerId = `SELLER-${randomUUID().substring(0, 8)}`;
      const createdSeller = await storage.createSeller({
        user_id: seller.userId,
        seller_id: sellerId,
        shop_name: seller.shopName,
        joined_date: new Date(),
        rating: 4.5,
        verified: seller.verified
      });
      
      sellerIds.push(createdSeller.id);
      console.log(`Created seller: ${seller.shopName} (ID: ${createdSeller.id})`);
    } catch (error) {
      console.error(`Error creating seller for user ${seller.userId}:`, error);
    }
  }
  
  return sellerIds;
}

// Create test categories
async function createTestCategories(): Promise<number[]> {
  const categoryIds: number[] = [];
  
  const testCategories: TestCategory[] = [
    {
      name: 'Electronics',
      description: 'Electronic devices and accessories'
    },
    {
      name: 'Home & Kitchen',
      description: 'Products for your home and kitchen'
    },
    {
      name: 'Clothing',
      description: 'Apparel and fashion accessories'
    },
    {
      name: 'Books',
      description: 'Books and publications'
    }
  ];
  
  for (const category of testCategories) {
    try {
      const categoryId = `CAT-${randomUUID().substring(0, 8)}`;
      const createdCategory = await storage.createCategory({
        category_id: categoryId,
        category_name: category.name,
        description: category.description
      });
      
      categoryIds.push(createdCategory.id);
      console.log(`Created category: ${category.name}`);
    } catch (error) {
      console.error(`Error creating category ${category.name}:`, error);
    }
  }
  
  return categoryIds;
}

// Create test products
async function createTestProducts(sellerIds: number[], categoryIds: number[]): Promise<void> {
  // Map sellerIds to their actual sellers to get seller_id strings
  const sellers = [];
  for (const id of sellerIds) {
    const seller = await storage.getSeller(id);
    if (seller) {
      sellers.push(seller);
    }
  }
  
  const testProducts: TestProduct[] = [
    // Seller 1 Products
    {
      sellerId: sellerIds[0],
      name: 'Smart Watch',
      description: 'Track your fitness and stay connected with this smartwatch',
      price: randomPrice(99, 199),
      stock: randomStock(5, 20),
      status: 'available',
      imageUrl: 'https://example.com/smartwatch.jpg'
    },
    {
      sellerId: sellerIds[0],
      name: 'Wireless Earbuds',
      description: 'High-quality sound with noise cancellation',
      price: randomPrice(49, 129),
      stock: randomStock(10, 30),
      status: 'available',
      imageUrl: 'https://example.com/earbuds.jpg'
    },
    {
      sellerId: sellerIds[0],
      name: 'Coffee Maker',
      description: 'Programmable coffee maker with timer',
      price: randomPrice(39, 89),
      stock: randomStock(3, 15),
      status: 'available',
      imageUrl: 'https://example.com/coffeemaker.jpg'
    },
    
    // Seller 2 Products
    {
      sellerId: sellerIds[1],
      name: 'Laptop Backpack',
      description: 'Water-resistant backpack with laptop compartment',
      price: randomPrice(29, 59),
      stock: randomStock(15, 40),
      status: 'available',
      imageUrl: 'https://example.com/backpack.jpg'
    },
    {
      sellerId: sellerIds[1],
      name: 'Designer T-Shirt',
      description: 'Premium cotton t-shirt with unique design',
      price: randomPrice(19, 39),
      stock: randomStock(20, 50),
      status: 'available',
      imageUrl: 'https://example.com/tshirt.jpg'
    },
    {
      sellerId: sellerIds[1],
      name: 'Bestselling Novel',
      description: 'Award-winning fiction bestseller',
      price: randomPrice(9, 19),
      stock: randomStock(25, 60),
      status: 'available',
      imageUrl: 'https://example.com/book.jpg'
    }
  ];
  
  for (const product of testProducts) {
    try {
      const seller = sellers.find(s => s.id === product.sellerId);
      if (!seller) {
        console.error(`Could not find seller with ID ${product.sellerId}`);
        continue;
      }
      
      const productId = generateProductId();
      const createdProduct = await storage.createProduct({
        name: product.name,
        seller_id: product.sellerId,
        product_id: productId,
        description: product.description,
        price: product.price,
        stock: product.stock,
        status: product.status,
        image_url: product.imageUrl || null,
        added_date: new Date(),
        last_updated: null
      });
      
      // Assign product to a relevant category
      let categoryId = categoryIds[0]; // Default to Electronics
      
      if (product.name.includes('Coffee') || product.name.includes('Kitchen')) {
        categoryId = categoryIds[1]; // Home & Kitchen
      } else if (product.name.includes('T-Shirt') || product.name.includes('Backpack')) {
        categoryId = categoryIds[2]; // Clothing
      } else if (product.name.includes('Novel') || product.name.includes('Book')) {
        categoryId = categoryIds[3]; // Books
      }
      
      await storage.assignProductToCategory({
        product_id: createdProduct.id,
        category_id: categoryId
      });
      
      console.log(`Created product: ${product.name} from seller ${seller.shop_name}`);
    } catch (error) {
      console.error(`Error creating product ${product.name}:`, error);
    }
  }
}

// Main function to seed the database
async function seedDatabase() {
  console.log('Starting database seeding...');
  
  try {
    // Create users first
    const userIds = await createTestUsers();
    
    // Create sellers
    const sellerIds = await createTestSellers(userIds);
    
    // Create categories
    const categoryIds = await createTestCategories();
    
    // Create products with seller and category associations
    await createTestProducts(sellerIds, categoryIds);
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
  }
}

// Run the seeding process
seedDatabase().catch(console.error);