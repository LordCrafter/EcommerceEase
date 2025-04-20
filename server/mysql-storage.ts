import { randomUUID } from "crypto";
import session from "express-session";
import mysqlSessionStore from "express-mysql-session";
import {
  User, InsertUser, Seller, InsertSeller, Product, InsertProduct,
  Category, InsertCategory, ProductCategory, InsertProductCategory,
  Cart, InsertCart, CartItem, InsertCartItem, 
  Order, InsertOrder, OrderItem, InsertOrderItem,
  Payment, InsertPayment, Shipment, InsertShipment,
  Review, InsertReview
} from "@shared/mysql-schema";
import { db, pool, initializeMySql } from "./mysql-db";
import * as schema from "@shared/mysql-schema";
import { and, eq, like, inArray, or } from "drizzle-orm";
import { IStorage } from "./storage";

export class MySqlStorage implements IStorage {
  sessionStore: any; // Using any as a workaround for session.SessionStore typing issues
  isAvailable: boolean = false;
  
  constructor() {
    // Use an in-memory session store initially
    const MemoryStore = require('memorystore')(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }
  
  // This method is used by the storage manager to check if MySQL is available
  async checkAvailability(): Promise<boolean> {
    try {
      // Try to initialize MySQL
      const { isAvailable } = await initializeMySql();
      this.isAvailable = isAvailable;
      
      if (this.isAvailable) {
        // If MySQL is available, initialize the sample data
        await this.initializeData().catch(error => {
          console.error("Failed to initialize sample data:", error);
        });
      }
      
      return this.isAvailable;
    } catch (error) {
      console.error("MySQL availability check failed:", error);
      return false;
    }
  }

  private async initializeData() {
    try {
      // Check if categories exist, if not create sample categories
      const existingCategories = await db.select().from(schema.categories);
      
      if (existingCategories.length === 0) {
        const categories = [
          { category_id: `CAT-${randomUUID().slice(0, 8)}`, category_name: "Electronics" },
          { category_id: `CAT-${randomUUID().slice(0, 8)}`, category_name: "Clothing" },
          { category_id: `CAT-${randomUUID().slice(0, 8)}`, category_name: "Home & Kitchen" },
          { category_id: `CAT-${randomUUID().slice(0, 8)}`, category_name: "Books" },
          { category_id: `CAT-${randomUUID().slice(0, 8)}`, category_name: "Beauty" },
          { category_id: `CAT-${randomUUID().slice(0, 8)}`, category_name: "Sports" },
          { category_id: `CAT-${randomUUID().slice(0, 8)}`, category_name: "Toys" }
        ];
        
        for (const category of categories) {
          await this.createCategory(category);
        }
      }
    } catch (error) {
      console.error("Failed to initialize database:", error);
      // Continue even if initialization fails - the app will work with empty data
    }
  }

  // USER OPERATIONS
  async getUser(id: number): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return users[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return users[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return users[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(insertUser);
    const id = Number(result[0].insertId);
    return { ...insertUser, id } as User;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    await db.update(schema.users)
      .set({ ...userData, last_updated: new Date() })
      .where(eq(schema.users.id, id));
    
    return this.getUser(id);
  }

  async deleteUser(id: number): Promise<boolean> {
    await db.delete(schema.users).where(eq(schema.users.id, id));
    return true;
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }

  // SELLER OPERATIONS
  async getSeller(id: number): Promise<Seller | undefined> {
    const sellers = await db.select().from(schema.sellers).where(eq(schema.sellers.id, id));
    return sellers[0];
  }

  async getSellerByUserId(userId: number): Promise<Seller | undefined> {
    const sellers = await db.select().from(schema.sellers).where(eq(schema.sellers.user_id, userId));
    return sellers[0];
  }

  async createSeller(insertSeller: InsertSeller): Promise<Seller> {
    const result = await db.insert(schema.sellers).values(insertSeller);
    const id = Number(result[0].insertId);
    return { ...insertSeller, id } as Seller;
  }

  async updateSeller(id: number, sellerData: Partial<Seller>): Promise<Seller | undefined> {
    await db.update(schema.sellers)
      .set(sellerData)
      .where(eq(schema.sellers.id, id));
    
    return this.getSeller(id);
  }

  async deleteSeller(id: number): Promise<boolean> {
    await db.delete(schema.sellers).where(eq(schema.sellers.id, id));
    return true;
  }

  async listSellers(): Promise<Seller[]> {
    return await db.select().from(schema.sellers);
  }

  // PRODUCT OPERATIONS
  async getProduct(id: number): Promise<Product | undefined> {
    const products = await db.select().from(schema.products).where(eq(schema.products.id, id));
    return products[0];
  }

  async getProductByProductId(productId: string): Promise<Product | undefined> {
    const products = await db.select().from(schema.products).where(eq(schema.products.product_id, productId));
    return products[0];
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const result = await db.insert(schema.products).values(insertProduct);
    const id = Number(result[0].insertId);
    return { ...insertProduct, id } as Product;
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    await db.update(schema.products)
      .set({ ...productData, last_updated: new Date() })
      .where(eq(schema.products.id, id));
    
    return this.getProduct(id);
  }

  async deleteProduct(id: number): Promise<boolean> {
    await db.delete(schema.products).where(eq(schema.products.id, id));
    return true;
  }

  async listProducts(filter?: { sellerId?: number, categoryId?: number, status?: string }): Promise<Product[]> {
    if (!filter) {
      return await db.select().from(schema.products);
    }
    
    let products = await db.select().from(schema.products);
    
    if (filter.sellerId !== undefined) {
      products = products.filter(p => p.seller_id === filter.sellerId);
    }
    
    if (filter.status !== undefined) {
      products = products.filter(p => p.status === filter.status);
    }
    
    if (filter.categoryId !== undefined) {
      // Find all product IDs in this category
      const productCategories = await db.select()
        .from(schema.productCategories)
        .where(eq(schema.productCategories.category_id, filter.categoryId));
      
      if (productCategories.length > 0) {
        const productIds = productCategories.map(pc => pc.product_id);
        products = products.filter(p => productIds.includes(p.id));
      } else {
        return []; // No products in this category
      }
    }
    
    return products;
  }

  async searchProducts(query: string): Promise<Product[]> {
    const products = await db.select().from(schema.products);
    const lowerQuery = query.toLowerCase();
    
    return products.filter(product => 
      product.name.toLowerCase().includes(lowerQuery) || 
      product.description.toLowerCase().includes(lowerQuery)
    );
  }

  // CATEGORY OPERATIONS
  async getCategory(id: number): Promise<Category | undefined> {
    const categories = await db.select().from(schema.categories).where(eq(schema.categories.id, id));
    return categories[0];
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    const categories = await db.select().from(schema.categories)
      .where(eq(schema.categories.category_name, name));
    return categories[0];
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const result = await db.insert(schema.categories).values(insertCategory);
    const id = Number(result[0].insertId);
    return { ...insertCategory, id } as Category;
  }

  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category | undefined> {
    await db.update(schema.categories)
      .set(categoryData)
      .where(eq(schema.categories.id, id));
    
    return this.getCategory(id);
  }

  async deleteCategory(id: number): Promise<boolean> {
    await db.delete(schema.categories).where(eq(schema.categories.id, id));
    return true;
  }

  async listCategories(): Promise<Category[]> {
    return await db.select().from(schema.categories);
  }

  // PRODUCT-CATEGORY OPERATIONS
  async assignProductToCategory(insertProductCategory: InsertProductCategory): Promise<ProductCategory> {
    // Check for duplicates
    const existing = await db.select().from(schema.productCategories).where(
      and(
        eq(schema.productCategories.product_id, insertProductCategory.product_id),
        eq(schema.productCategories.category_id, insertProductCategory.category_id)
      )
    );
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const result = await db.insert(schema.productCategories).values(insertProductCategory);
    const id = Number(result[0].insertId);
    return { ...insertProductCategory, id } as ProductCategory;
  }

  async removeProductFromCategory(productId: number, categoryId: number): Promise<boolean> {
    await db.delete(schema.productCategories).where(
      and(
        eq(schema.productCategories.product_id, productId),
        eq(schema.productCategories.category_id, categoryId)
      )
    );
    
    return true;
  }

  async getProductCategories(productId: number): Promise<Category[]> {
    const categoryIds = await db.select({ categoryId: schema.productCategories.category_id })
      .from(schema.productCategories)
      .where(eq(schema.productCategories.product_id, productId));
    
    if (categoryIds.length === 0) {
      return [];
    }
    
    const ids = categoryIds.map(c => c.categoryId);
    const categories = await db.select().from(schema.categories);
    return categories.filter(category => ids.includes(category.id));
  }

  async getCategoryProducts(categoryId: number): Promise<Product[]> {
    const productIds = await db.select({ productId: schema.productCategories.product_id })
      .from(schema.productCategories)
      .where(eq(schema.productCategories.category_id, categoryId));
    
    if (productIds.length === 0) {
      return [];
    }
    
    const ids = productIds.map(p => p.productId);
    const products = await db.select().from(schema.products);
    return products.filter(product => ids.includes(product.id));
  }

  // CART OPERATIONS
  async getCart(id: number): Promise<Cart | undefined> {
    const carts = await db.select().from(schema.carts).where(eq(schema.carts.id, id));
    return carts[0];
  }

  async getCartByUserId(userId: number): Promise<Cart | undefined> {
    const carts = await db.select().from(schema.carts).where(eq(schema.carts.user_id, userId));
    return carts[0];
  }

  async createCart(insertCart: InsertCart): Promise<Cart> {
    const result = await db.insert(schema.carts).values(insertCart);
    const id = Number(result[0].insertId);
    return { ...insertCart, id, created_at: new Date() } as Cart;
  }

  async deleteCart(id: number): Promise<boolean> {
    await db.delete(schema.carts).where(eq(schema.carts.id, id));
    return true;
  }

  // CART ITEM OPERATIONS
  async getCartItem(id: number): Promise<CartItem | undefined> {
    const cartItems = await db.select().from(schema.cartItems).where(eq(schema.cartItems.id, id));
    return cartItems[0];
  }

  async addCartItem(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const existingItems = await db.select().from(schema.cartItems).where(
      and(
        eq(schema.cartItems.cart_id, insertCartItem.cart_id),
        eq(schema.cartItems.product_id, insertCartItem.product_id)
      )
    );
    
    if (existingItems.length > 0) {
      // Update quantity instead of creating new item
      const existingItem = existingItems[0];
      const newQuantity = existingItem.quantity + (insertCartItem.quantity || 1); // Default to 1 if undefined
      
      await db.update(schema.cartItems)
        .set({ quantity: newQuantity })
        .where(eq(schema.cartItems.id, existingItem.id));
      
      return this.getCartItem(existingItem.id) as Promise<CartItem>;
    }
    
    // Create new cart item
    const result = await db.insert(schema.cartItems).values({
      ...insertCartItem,
      quantity: insertCartItem.quantity || 1 // Ensure quantity has a value
    });
    const id = Number(result[0].insertId);
    return { 
      ...insertCartItem, 
      id, 
      added_date: new Date(),
      quantity: insertCartItem.quantity || 1 
    } as CartItem;
  }

  async updateCartItem(id: number, cartItemData: Partial<CartItem>): Promise<CartItem | undefined> {
    await db.update(schema.cartItems)
      .set(cartItemData)
      .where(eq(schema.cartItems.id, id));
    
    return this.getCartItem(id);
  }

  async removeCartItem(id: number): Promise<boolean> {
    await db.delete(schema.cartItems).where(eq(schema.cartItems.id, id));
    return true;
  }

  async getCartItems(cartId: number): Promise<CartItem[]> {
    return await db.select().from(schema.cartItems).where(eq(schema.cartItems.cart_id, cartId));
  }

  // ORDER OPERATIONS
  async getOrder(id: number): Promise<Order | undefined> {
    const orders = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
    return orders[0];
  }

  async getOrderByOrderId(orderId: string): Promise<Order | undefined> {
    const orders = await db.select().from(schema.orders).where(eq(schema.orders.order_id, orderId));
    return orders[0];
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const result = await db.insert(schema.orders).values(insertOrder);
    const id = Number(result[0].insertId);
    return { 
      ...insertOrder, 
      id, 
      order_date: new Date(),
      status: insertOrder.status || 'pending' // Default status
    } as Order;
  }

  async updateOrder(id: number, orderData: Partial<Order>): Promise<Order | undefined> {
    await db.update(schema.orders)
      .set(orderData)
      .where(eq(schema.orders.id, id));
    
    return this.getOrder(id);
  }

  async deleteOrder(id: number): Promise<boolean> {
    await db.delete(schema.orders).where(eq(schema.orders.id, id));
    return true;
  }

  async listOrders(userId?: number): Promise<Order[]> {
    if (userId !== undefined) {
      return await db.select().from(schema.orders).where(eq(schema.orders.customer_id, userId));
    }
    
    return await db.select().from(schema.orders);
  }

  async getSellerOrders(sellerId: number): Promise<Order[]> {
    // This is a more complex query - we need to find orders that contain products from this seller
    // First, get all products from this seller
    const sellerProducts = await db.select().from(schema.products)
      .where(eq(schema.products.seller_id, sellerId));
    
    if (sellerProducts.length === 0) {
      return [];
    }
    
    const sellerProductIds = sellerProducts.map(p => p.id);
    
    // Find order items containing these products
    const orderItems = await db.select().from(schema.orderItems)
      .where(inArray(schema.orderItems.product_id, sellerProductIds));
    
    if (orderItems.length === 0) {
      return [];
    }
    
    // Get unique order IDs
    const uniqueOrderIds = [...new Set(orderItems.map(item => item.order_id))];
    
    // Fetch the orders
    const orders = await db.select().from(schema.orders);
    return orders.filter(order => uniqueOrderIds.includes(order.id));
  }

  // ORDER ITEM OPERATIONS
  async getOrderItem(id: number): Promise<OrderItem | undefined> {
    const orderItems = await db.select().from(schema.orderItems).where(eq(schema.orderItems.id, id));
    return orderItems[0];
  }

  async addOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const result = await db.insert(schema.orderItems).values(insertOrderItem);
    const id = Number(result[0].insertId);
    return { ...insertOrderItem, id } as OrderItem;
  }

  async updateOrderItem(id: number, orderItemData: Partial<OrderItem>): Promise<OrderItem | undefined> {
    await db.update(schema.orderItems)
      .set(orderItemData)
      .where(eq(schema.orderItems.id, id));
    
    return this.getOrderItem(id);
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(schema.orderItems).where(eq(schema.orderItems.order_id, orderId));
  }

  // PAYMENT OPERATIONS
  async getPayment(id: number): Promise<Payment | undefined> {
    const payments = await db.select().from(schema.payments).where(eq(schema.payments.id, id));
    return payments[0];
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const result = await db.insert(schema.payments).values(insertPayment);
    const id = Number(result[0].insertId);
    return { 
      ...insertPayment, 
      id, 
      payment_date: new Date(),
      status: insertPayment.status || 'pending' // Default status
    } as Payment;
  }

  async updatePayment(id: number, paymentData: Partial<Payment>): Promise<Payment | undefined> {
    await db.update(schema.payments)
      .set(paymentData)
      .where(eq(schema.payments.id, id));
    
    return this.getPayment(id);
  }

  async getOrderPayment(orderId: number): Promise<Payment | undefined> {
    const payments = await db.select().from(schema.payments).where(eq(schema.payments.order_id, orderId));
    return payments[0];
  }

  // SHIPMENT OPERATIONS
  async getShipment(id: number): Promise<Shipment | undefined> {
    const shipments = await db.select().from(schema.shipments).where(eq(schema.shipments.id, id));
    return shipments[0];
  }

  async createShipment(insertShipment: InsertShipment): Promise<Shipment> {
    const result = await db.insert(schema.shipments).values(insertShipment);
    const id = Number(result[0].insertId);
    return { 
      ...insertShipment, 
      id, 
      shipment_date: new Date(),
      status: insertShipment.status || 'pending' // Default status
    } as Shipment;
  }

  async updateShipment(id: number, shipmentData: Partial<Shipment>): Promise<Shipment | undefined> {
    await db.update(schema.shipments)
      .set(shipmentData)
      .where(eq(schema.shipments.id, id));
    
    return this.getShipment(id);
  }

  async getOrderShipment(orderId: number): Promise<Shipment | undefined> {
    const shipments = await db.select().from(schema.shipments).where(eq(schema.shipments.order_id, orderId));
    return shipments[0];
  }

  // REVIEW OPERATIONS
  async getReview(id: number): Promise<Review | undefined> {
    const reviews = await db.select().from(schema.reviews).where(eq(schema.reviews.id, id));
    return reviews[0];
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const result = await db.insert(schema.reviews).values(insertReview);
    const id = Number(result[0].insertId);
    return { 
      ...insertReview, 
      id, 
      review_date: new Date()
    } as Review;
  }

  async updateReview(id: number, reviewData: Partial<Review>): Promise<Review | undefined> {
    await db.update(schema.reviews)
      .set(reviewData)
      .where(eq(schema.reviews.id, id));
    
    return this.getReview(id);
  }

  async deleteReview(id: number): Promise<boolean> {
    await db.delete(schema.reviews).where(eq(schema.reviews.id, id));
    return true;
  }

  async getProductReviews(productId: number): Promise<Review[]> {
    return await db.select().from(schema.reviews).where(eq(schema.reviews.product_id, productId));
  }

  async getUserReviews(userId: number): Promise<Review[]> {
    return await db.select().from(schema.reviews).where(eq(schema.reviews.customer_id, userId));
  }
}