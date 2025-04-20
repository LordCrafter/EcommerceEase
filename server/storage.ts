import { randomUUID } from "crypto";
import session from "express-session";
import {
  User, InsertUser, Seller, InsertSeller, Product, InsertProduct,
  Category, InsertCategory, ProductCategory, InsertProductCategory,
  Cart, InsertCart, CartItem, InsertCartItem, 
  Order, InsertOrder, OrderItem, InsertOrderItem,
  Payment, InsertPayment, Shipment, InsertShipment,
  Review, InsertReview
} from "@shared/schema";

// Define the storage interface
export interface IStorage {
  // Session store
  sessionStore: any; // Using any as a workaround for session.SessionStore typing issues

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  listUsers(): Promise<User[]>;

  // Seller operations
  getSeller(id: number): Promise<Seller | undefined>;
  getSellerByUserId(userId: number): Promise<Seller | undefined>;
  createSeller(seller: InsertSeller): Promise<Seller>;
  updateSeller(id: number, seller: Partial<Seller>): Promise<Seller | undefined>;
  deleteSeller(id: number): Promise<boolean>;
  listSellers(): Promise<Seller[]>;

  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProductByProductId(productId: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  listProducts(filter?: { sellerId?: number, categoryId?: number, status?: string }): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;

  // Category operations
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryByName(name: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  listCategories(): Promise<Category[]>;

  // Product-Category operations
  assignProductToCategory(productCategory: InsertProductCategory): Promise<ProductCategory>;
  removeProductFromCategory(productId: number, categoryId: number): Promise<boolean>;
  getProductCategories(productId: number): Promise<Category[]>;
  getCategoryProducts(categoryId: number): Promise<Product[]>;

  // Cart operations
  getCart(id: number): Promise<Cart | undefined>;
  getCartByUserId(userId: number): Promise<Cart | undefined>;
  createCart(cart: InsertCart): Promise<Cart>;
  deleteCart(id: number): Promise<boolean>;

  // Cart Item operations
  getCartItem(id: number): Promise<CartItem | undefined>;
  addCartItem(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, cartItem: Partial<CartItem>): Promise<CartItem | undefined>;
  removeCartItem(id: number): Promise<boolean>;
  getCartItems(cartId: number): Promise<CartItem[]>;

  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByOrderId(orderId: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<Order>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;
  listOrders(userId?: number): Promise<Order[]>;
  getSellerOrders(sellerId: number): Promise<Order[]>;

  // Order Item operations
  getOrderItem(id: number): Promise<OrderItem | undefined>;
  addOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: number, orderItem: Partial<OrderItem>): Promise<OrderItem | undefined>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;

  // Payment operations
  getPayment(id: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<Payment>): Promise<Payment | undefined>;
  getOrderPayment(orderId: number): Promise<Payment | undefined>;

  // Shipment operations
  getShipment(id: number): Promise<Shipment | undefined>;
  createShipment(shipment: InsertShipment): Promise<Shipment>;
  updateShipment(id: number, shipment: Partial<Shipment>): Promise<Shipment | undefined>;
  getOrderShipment(orderId: number): Promise<Shipment | undefined>;

  // Review operations
  getReview(id: number): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, review: Partial<Review>): Promise<Review | undefined>;
  deleteReview(id: number): Promise<boolean>;
  getProductReviews(productId: number): Promise<Review[]>;
  getUserReviews(userId: number): Promise<Review[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sellers: Map<number, Seller>;
  private products: Map<number, Product>;
  private categories: Map<number, Category>;
  private productCategories: Map<number, ProductCategory>;
  private carts: Map<number, Cart>;
  private cartItems: Map<number, CartItem>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private payments: Map<number, Payment>;
  private shipments: Map<number, Shipment>;
  private reviews: Map<number, Review>;
  
  sessionStore: any; // Using any as a workaround for session.SessionStore typing issues
  userIdCounter: number;
  sellerIdCounter: number;
  productIdCounter: number;
  categoryIdCounter: number;
  productCategoryIdCounter: number;
  cartIdCounter: number;
  cartItemIdCounter: number;
  orderIdCounter: number;
  orderItemIdCounter: number;
  paymentIdCounter: number;
  shipmentIdCounter: number;
  reviewIdCounter: number;

  constructor() {
    this.users = new Map();
    this.sellers = new Map();
    this.products = new Map();
    this.categories = new Map();
    this.productCategories = new Map();
    this.carts = new Map();
    this.cartItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.payments = new Map();
    this.shipments = new Map();
    this.reviews = new Map();
    
    this.userIdCounter = 1;
    this.sellerIdCounter = 1;
    this.productIdCounter = 1;
    this.categoryIdCounter = 1;
    this.productCategoryIdCounter = 1;
    this.cartIdCounter = 1;
    this.cartItemIdCounter = 1;
    this.orderIdCounter = 1;
    this.orderItemIdCounter = 1;
    this.paymentIdCounter = 1;
    this.shipmentIdCounter = 1;
    this.reviewIdCounter = 1;

    // Create a minimal dummy session store initially
    this.sessionStore = {
      get: async () => null,
      set: async () => {},
      destroy: async () => {},
      all: async () => []
    };
    
    // Use dynamic import for ESM compatibility
    import('memorystore').then(memorystore => {
      const MemoryStore = memorystore.default(session);
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      });
    }).catch(err => {
      console.error("Failed to initialize memory store:", err);
    });

    // Initialize with sample data
    this.initializeData();
  }

  // Initialize with sample categories
  private async initializeData() {
    // Create some initial categories
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

  // USER OPERATIONS
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      registration_date: now, 
      last_updated: now 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { 
      ...user, 
      ...userData, 
      last_updated: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // SELLER OPERATIONS
  async getSeller(id: number): Promise<Seller | undefined> {
    return this.sellers.get(id);
  }

  async getSellerByUserId(userId: number): Promise<Seller | undefined> {
    return Array.from(this.sellers.values()).find(
      (seller) => seller.user_id === userId
    );
  }

  async createSeller(insertSeller: InsertSeller): Promise<Seller> {
    const id = this.sellerIdCounter++;
    const seller: Seller = { ...insertSeller, id };
    this.sellers.set(id, seller);
    return seller;
  }

  async updateSeller(id: number, sellerData: Partial<Seller>): Promise<Seller | undefined> {
    const seller = this.sellers.get(id);
    if (!seller) return undefined;

    const updatedSeller = { ...seller, ...sellerData };
    this.sellers.set(id, updatedSeller);
    return updatedSeller;
  }

  async deleteSeller(id: number): Promise<boolean> {
    return this.sellers.delete(id);
  }

  async listSellers(): Promise<Seller[]> {
    return Array.from(this.sellers.values());
  }

  // PRODUCT OPERATIONS
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductByProductId(productId: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(
      (product) => product.product_id === productId
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const now = new Date();
    const product: Product = { 
      ...insertProduct, 
      id, 
      added_date: now, 
      last_updated: now 
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updatedProduct = { 
      ...product, 
      ...productData, 
      last_updated: new Date() 
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  async listProducts(filter?: { sellerId?: number, categoryId?: number, status?: string }): Promise<Product[]> {
    let products = Array.from(this.products.values());
    
    if (filter) {
      if (filter.sellerId !== undefined) {
        products = products.filter(p => p.seller_id === filter.sellerId);
      }
      
      if (filter.status !== undefined) {
        products = products.filter(p => p.status === filter.status);
      }
      
      if (filter.categoryId !== undefined) {
        // Find all product IDs in this category
        const productIds = Array.from(this.productCategories.values())
          .filter(pc => pc.category_id === filter.categoryId)
          .map(pc => pc.product_id);
        
        products = products.filter(p => productIds.includes(p.id));
      }
    }
    
    return products;
  }

  async searchProducts(query: string): Promise<Product[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.products.values()).filter(
      (product) => 
        product.name.toLowerCase().includes(lowerQuery) || 
        product.description.toLowerCase().includes(lowerQuery)
    );
  }

  // CATEGORY OPERATIONS
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.category_name.toLowerCase() === name.toLowerCase()
    );
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;

    const updatedCategory = { ...category, ...categoryData };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  async listCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  // PRODUCT-CATEGORY OPERATIONS
  async assignProductToCategory(insertProductCategory: InsertProductCategory): Promise<ProductCategory> {
    // Check for duplicate
    const existing = Array.from(this.productCategories.values()).find(
      pc => pc.product_id === insertProductCategory.product_id && 
            pc.category_id === insertProductCategory.category_id
    );
    
    if (existing) return existing;
    
    const id = this.productCategoryIdCounter++;
    const productCategory: ProductCategory = { ...insertProductCategory, id };
    this.productCategories.set(id, productCategory);
    return productCategory;
  }

  async removeProductFromCategory(productId: number, categoryId: number): Promise<boolean> {
    const entry = Array.from(this.productCategories.values()).find(
      pc => pc.product_id === productId && pc.category_id === categoryId
    );
    
    if (!entry) return false;
    return this.productCategories.delete(entry.id);
  }

  async getProductCategories(productId: number): Promise<Category[]> {
    const categoryIds = Array.from(this.productCategories.values())
      .filter(pc => pc.product_id === productId)
      .map(pc => pc.category_id);
    
    return Array.from(this.categories.values())
      .filter(category => categoryIds.includes(category.id));
  }

  async getCategoryProducts(categoryId: number): Promise<Product[]> {
    const productIds = Array.from(this.productCategories.values())
      .filter(pc => pc.category_id === categoryId)
      .map(pc => pc.product_id);
    
    return Array.from(this.products.values())
      .filter(product => productIds.includes(product.id));
  }

  // CART OPERATIONS
  async getCart(id: number): Promise<Cart | undefined> {
    return this.carts.get(id);
  }

  async getCartByUserId(userId: number): Promise<Cart | undefined> {
    return Array.from(this.carts.values()).find(
      (cart) => cart.user_id === userId
    );
  }

  async createCart(insertCart: InsertCart): Promise<Cart> {
    const id = this.cartIdCounter++;
    const cart: Cart = { 
      ...insertCart, 
      id, 
      created_at: new Date() 
    };
    this.carts.set(id, cart);
    return cart;
  }

  async deleteCart(id: number): Promise<boolean> {
    return this.carts.delete(id);
  }

  // CART ITEM OPERATIONS
  async getCartItem(id: number): Promise<CartItem | undefined> {
    return this.cartItems.get(id);
  }

  async addCartItem(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if the item already exists in cart
    const existingItem = Array.from(this.cartItems.values()).find(
      item => item.cart_id === insertCartItem.cart_id && item.product_id === insertCartItem.product_id
    );

    if (existingItem) {
      // Update quantity of existing item
      return this.updateCartItem(existingItem.id, { 
        quantity: existingItem.quantity + (insertCartItem.quantity || 1) // Default to 1 if undefined
      }) as Promise<CartItem>;
    }

    // Add new item
    const id = this.cartItemIdCounter++;
    const cartItem: CartItem = { 
      ...insertCartItem, 
      id, 
      added_date: new Date(),
      quantity: insertCartItem.quantity || 1 // Ensure quantity has a value
    };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  async updateCartItem(id: number, cartItemData: Partial<CartItem>): Promise<CartItem | undefined> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem) return undefined;

    const updatedCartItem = { ...cartItem, ...cartItemData };
    this.cartItems.set(id, updatedCartItem);
    return updatedCartItem;
  }

  async removeCartItem(id: number): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async getCartItems(cartId: number): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(
      item => item.cart_id === cartId
    );
  }

  // ORDER OPERATIONS
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderByOrderId(orderId: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(
      (order) => order.order_id === orderId
    );
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const order: Order = { 
      ...insertOrder, 
      id, 
      order_date: new Date() 
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: number, orderData: Partial<Order>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder = { ...order, ...orderData };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<boolean> {
    return this.orders.delete(id);
  }

  async listOrders(userId?: number): Promise<Order[]> {
    let orders = Array.from(this.orders.values());
    
    if (userId !== undefined) {
      orders = orders.filter(order => order.customer_id === userId);
    }
    
    return orders;
  }

  async getSellerOrders(sellerId: number): Promise<Order[]> {
    // Get all products from this seller
    const sellerProducts = await this.listProducts({ sellerId });
    const sellerProductIds = sellerProducts.map(p => p.id);
    
    // Get all order items containing these products
    const relevantOrderItems = Array.from(this.orderItems.values())
      .filter(item => sellerProductIds.includes(item.product_id));
    
    // Get unique order IDs
    const orderIds = [...new Set(relevantOrderItems.map(item => item.order_id))];
    
    // Get orders
    return Array.from(this.orders.values())
      .filter(order => orderIds.includes(order.id));
  }

  // ORDER ITEM OPERATIONS
  async getOrderItem(id: number): Promise<OrderItem | undefined> {
    return this.orderItems.get(id);
  }

  async addOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemIdCounter++;
    const orderItem: OrderItem = { ...insertOrderItem, id };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }

  async updateOrderItem(id: number, orderItemData: Partial<OrderItem>): Promise<OrderItem | undefined> {
    const orderItem = this.orderItems.get(id);
    if (!orderItem) return undefined;

    const updatedOrderItem = { ...orderItem, ...orderItemData };
    this.orderItems.set(id, updatedOrderItem);
    return updatedOrderItem;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      item => item.order_id === orderId
    );
  }

  // PAYMENT OPERATIONS
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.paymentIdCounter++;
    const payment: Payment = { 
      ...insertPayment, 
      id, 
      payment_date: new Date() 
    };
    this.payments.set(id, payment);
    return payment;
  }

  async updatePayment(id: number, paymentData: Partial<Payment>): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;

    const updatedPayment = { ...payment, ...paymentData };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  async getOrderPayment(orderId: number): Promise<Payment | undefined> {
    return Array.from(this.payments.values()).find(
      payment => payment.order_id === orderId
    );
  }

  // SHIPMENT OPERATIONS
  async getShipment(id: number): Promise<Shipment | undefined> {
    return this.shipments.get(id);
  }

  async createShipment(insertShipment: InsertShipment): Promise<Shipment> {
    const id = this.shipmentIdCounter++;
    const shipment: Shipment = { 
      ...insertShipment, 
      id, 
      shipment_date: new Date() 
    };
    this.shipments.set(id, shipment);
    return shipment;
  }

  async updateShipment(id: number, shipmentData: Partial<Shipment>): Promise<Shipment | undefined> {
    const shipment = this.shipments.get(id);
    if (!shipment) return undefined;

    const updatedShipment = { ...shipment, ...shipmentData };
    this.shipments.set(id, updatedShipment);
    return updatedShipment;
  }

  async getOrderShipment(orderId: number): Promise<Shipment | undefined> {
    return Array.from(this.shipments.values()).find(
      shipment => shipment.order_id === orderId
    );
  }

  // REVIEW OPERATIONS
  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.reviewIdCounter++;
    const review: Review = { 
      ...insertReview, 
      id, 
      review_date: new Date() 
    };
    this.reviews.set(id, review);
    return review;
  }

  async updateReview(id: number, reviewData: Partial<Review>): Promise<Review | undefined> {
    const review = this.reviews.get(id);
    if (!review) return undefined;

    const updatedReview = { ...review, ...reviewData };
    this.reviews.set(id, updatedReview);
    return updatedReview;
  }

  async deleteReview(id: number): Promise<boolean> {
    return this.reviews.delete(id);
  }

  async getProductReviews(productId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      review => review.product_id === productId
    );
  }

  async getUserReviews(userId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      review => review.customer_id === userId
    );
  }
}

import { DbStorage } from "./db-storage";
import { MySqlStorage } from "./mysql-storage";
import { getDatabaseType, POSTGRES_CONFIG } from "./config";

// Choose which storage implementation to use based on configuration
const dbType = getDatabaseType();

// Create the appropriate storage instance based on database type
let storageInstance: IStorage;

// Function to initialize PostgreSQL storage with fallback
async function initPostgresStorage(): Promise<IStorage> {
  try {
    console.log('Initializing PostgreSQL storage...');
    return new DbStorage();
  } catch (error) {
    console.error("Failed to initialize PostgreSQL storage:", error);
    console.log('Falling back to in-memory storage');
    return new MemStorage();
  }
}

// Function to initialize MySQL storage with fallback
async function initMySqlStorage(): Promise<IStorage> {
  try {
    console.log('Initializing MySQL storage...');
    const mysqlStorage = new MySqlStorage();
    
    // Check if MySQL is actually available
    const isAvailable = await mysqlStorage.checkAvailability();
    if (!isAvailable) {
      console.log('MySQL connection test failed, trying PostgreSQL...');
      if (POSTGRES_CONFIG.isAvailable) {
        console.log('PostgreSQL configuration found, falling back to PostgreSQL');
        return await initPostgresStorage();
      } else {
        console.log('No PostgreSQL available, using in-memory storage');
        return new MemStorage();
      }
    }
    
    return mysqlStorage;
  } catch (error) {
    console.error("Failed to initialize MySQL storage:", error);
    if (POSTGRES_CONFIG.isAvailable) {
      console.log('Falling back to PostgreSQL database storage');
      return await initPostgresStorage();
    } else {
      console.log('No database available, using in-memory storage');
      return new MemStorage();
    }
  }
}

// Use IIFE to initialize storage synchronously
try {
  console.log('STORAGE DEBUG: Initializing storage with dbType =', dbType);
  
  // Initialize storage based on the selected database type
  if (dbType === 'postgres') {
    console.log('STORAGE DEBUG: Using PostgreSQL database');
    storageInstance = new DbStorage();
    console.log('STORAGE DEBUG: Successfully created PostgreSQL DbStorage');
  } else if (dbType === 'mysql') {
    console.log('STORAGE DEBUG: Using MySQL database');
    storageInstance = new MySqlStorage();
    console.log('STORAGE DEBUG: Successfully created MySQL storage');
  } else {
    console.log('STORAGE DEBUG: Using in-memory storage');
    storageInstance = new MemStorage();
    console.log('STORAGE DEBUG: Successfully created in-memory storage');
  }
  
  console.log('STORAGE DEBUG: Exported storage type is:', storageInstance.constructor.name);
  
} catch (error) {
  console.error("CRITICAL ERROR initializing storage:", error);
  console.log('STORAGE DEBUG: Falling back to in-memory storage due to initialization error');
  storageInstance = new MemStorage();
}

export const storage = storageInstance;
console.log('STORAGE DEBUG: Exported storage type is:', storage.constructor.name);
