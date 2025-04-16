import { randomUUID } from "crypto";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import {
  User, InsertUser, Seller, InsertSeller, Product, InsertProduct,
  Category, InsertCategory, ProductCategory, InsertProductCategory,
  Cart, InsertCart, CartItem, InsertCartItem, 
  Order, InsertOrder, OrderItem, InsertOrderItem,
  Payment, InsertPayment, Shipment, InsertShipment,
  Review, InsertReview
} from "@shared/schema";
import { db } from "./db";
import * as schema from "@shared/schema";
import { and, eq, ilike, inArray, or } from "drizzle-orm";
import { IStorage } from "./storage";
import { Pool } from "@neondatabase/serverless";

export class DbStorage implements IStorage {
  sessionStore: any; // Using any as a workaround for session.SessionStore typing issues
  
  constructor() {
    // Setup session store with PostgreSQL
    const PgStore = connectPgSimple(session);
    this.sessionStore = new PgStore({
      pool: new Pool({ connectionString: process.env.DATABASE_URL }),
      tableName: 'session',
      createTableIfMissing: true
    });
    
    // Initialize sample data
    this.initializeData().catch(console.error);
  }

  private async initializeData() {
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
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const users = await db.update(schema.users)
      .set({ ...userData, last_updated: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    
    return users[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(schema.users).where(eq(schema.users.id, id));
    return true; // In Drizzle, if the operation completes without error, it was successful
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
    const [seller] = await db.insert(schema.sellers).values(insertSeller).returning();
    return seller;
  }

  async updateSeller(id: number, sellerData: Partial<Seller>): Promise<Seller | undefined> {
    const sellers = await db.update(schema.sellers)
      .set(sellerData)
      .where(eq(schema.sellers.id, id))
      .returning();
    
    return sellers[0];
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
    const [product] = await db.insert(schema.products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    const products = await db.update(schema.products)
      .set({ ...productData, last_updated: new Date() })
      .where(eq(schema.products.id, id))
      .returning();
    
    return products[0];
  }

  async deleteProduct(id: number): Promise<boolean> {
    await db.delete(schema.products).where(eq(schema.products.id, id));
    return true;
  }

  async listProducts(filter?: { sellerId?: number, categoryId?: number, status?: string }): Promise<Product[]> {
    let query = db.select().from(schema.products);
    
    if (filter) {
      if (filter.sellerId !== undefined) {
        query = query.where(eq(schema.products.seller_id, filter.sellerId));
      }
      
      if (filter.status !== undefined) {
        query = query.where(eq(schema.products.status, filter.status));
      }
      
      if (filter.categoryId !== undefined) {
        // Find all product IDs in this category
        const productCategories = await db.select()
          .from(schema.productCategories)
          .where(eq(schema.productCategories.category_id, filter.categoryId));
        
        if (productCategories.length > 0) {
          const productIds = productCategories.map(pc => pc.product_id);
          query = query.where(inArray(schema.products.id, productIds));
        } else {
          return []; // No products in this category
        }
      }
    }
    
    return await query;
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db.select().from(schema.products).where(
      or(
        ilike(schema.products.name, `%${query}%`),
        ilike(schema.products.description, `%${query}%`)
      )
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
    const [category] = await db.insert(schema.categories).values(insertCategory).returning();
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category | undefined> {
    const categories = await db.update(schema.categories)
      .set(categoryData)
      .where(eq(schema.categories.id, id))
      .returning();
    
    return categories[0];
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
    
    const [productCategory] = await db.insert(schema.productCategories)
      .values(insertProductCategory)
      .returning();
    
    return productCategory;
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
    
    return await db.select().from(schema.categories)
      .where(inArray(schema.categories.id, categoryIds.map(c => c.categoryId)));
  }

  async getCategoryProducts(categoryId: number): Promise<Product[]> {
    const productIds = await db.select({ productId: schema.productCategories.product_id })
      .from(schema.productCategories)
      .where(eq(schema.productCategories.category_id, categoryId));
    
    if (productIds.length === 0) {
      return [];
    }
    
    return await db.select().from(schema.products)
      .where(inArray(schema.products.id, productIds.map(p => p.productId)));
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
    const [cart] = await db.insert(schema.carts).values(insertCart).returning();
    return cart;
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
      
      const [updatedItem] = await db.update(schema.cartItems)
        .set({ quantity: newQuantity })
        .where(eq(schema.cartItems.id, existingItem.id))
        .returning();
      
      return updatedItem;
    }
    
    // Create new cart item
    const [cartItem] = await db.insert(schema.cartItems).values(insertCartItem).returning();
    return cartItem;
  }

  async updateCartItem(id: number, cartItemData: Partial<CartItem>): Promise<CartItem | undefined> {
    const cartItems = await db.update(schema.cartItems)
      .set(cartItemData)
      .where(eq(schema.cartItems.id, id))
      .returning();
    
    return cartItems[0];
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
    const [order] = await db.insert(schema.orders).values(insertOrder).returning();
    return order;
  }

  async updateOrder(id: number, orderData: Partial<Order>): Promise<Order | undefined> {
    const orders = await db.update(schema.orders)
      .set(orderData)
      .where(eq(schema.orders.id, id))
      .returning();
    
    return orders[0];
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
    const sellerProducts = await db.select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.seller_id, sellerId));
    
    if (sellerProducts.length === 0) {
      return [];
    }
    
    // Find order items containing these products
    const orderItems = await db.select({ orderId: schema.orderItems.order_id })
      .from(schema.orderItems)
      .where(inArray(schema.orderItems.product_id, sellerProducts.map(p => p.id)));
    
    if (orderItems.length === 0) {
      return [];
    }
    
    // Get unique order IDs
    const uniqueOrderIds = [...new Set(orderItems.map(item => item.orderId))];
    
    // Fetch the orders
    return await db.select().from(schema.orders)
      .where(inArray(schema.orders.id, uniqueOrderIds));
  }

  // ORDER ITEM OPERATIONS
  async getOrderItem(id: number): Promise<OrderItem | undefined> {
    const orderItems = await db.select().from(schema.orderItems).where(eq(schema.orderItems.id, id));
    return orderItems[0];
  }

  async addOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const [orderItem] = await db.insert(schema.orderItems).values(insertOrderItem).returning();
    return orderItem;
  }

  async updateOrderItem(id: number, orderItemData: Partial<OrderItem>): Promise<OrderItem | undefined> {
    const orderItems = await db.update(schema.orderItems)
      .set(orderItemData)
      .where(eq(schema.orderItems.id, id))
      .returning();
    
    return orderItems[0];
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
    const [payment] = await db.insert(schema.payments).values(insertPayment).returning();
    return payment;
  }

  async updatePayment(id: number, paymentData: Partial<Payment>): Promise<Payment | undefined> {
    const payments = await db.update(schema.payments)
      .set(paymentData)
      .where(eq(schema.payments.id, id))
      .returning();
    
    return payments[0];
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
    const [shipment] = await db.insert(schema.shipments).values(insertShipment).returning();
    return shipment;
  }

  async updateShipment(id: number, shipmentData: Partial<Shipment>): Promise<Shipment | undefined> {
    const shipments = await db.update(schema.shipments)
      .set(shipmentData)
      .where(eq(schema.shipments.id, id))
      .returning();
    
    return shipments[0];
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
    const [review] = await db.insert(schema.reviews).values(insertReview).returning();
    return review;
  }

  async updateReview(id: number, reviewData: Partial<Review>): Promise<Review | undefined> {
    const reviews = await db.update(schema.reviews)
      .set(reviewData)
      .where(eq(schema.reviews.id, id))
      .returning();
    
    return reviews[0];
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