import { mysqlTable, text, serial, int, boolean, timestamp, double, varchar, index, unique, primaryKey } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User and Authentication
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  phone_number: varchar("phone_number", { length: 20 }),
  address: text("address"),
  registration_date: timestamp("registration_date").defaultNow().notNull(),
  role: varchar("role", { length: 20 }).notNull().default("customer"), // "customer", "seller", "admin"
  last_updated: timestamp("last_updated").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  registration_date: true,
  last_updated: true
});

export const loginUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

// Seller specific information
export const sellers = mysqlTable("sellers", {
  id: serial("id").primaryKey(),
  user_id: int("user_id").notNull(),
  seller_id: varchar("seller_id", { length: 50 }).notNull().unique(),
  shop_name: varchar("shop_name", { length: 100 }).notNull(),
  joined_date: timestamp("joined_date").defaultNow().notNull(),
  rating: double("rating").default(5.0),
  verified: boolean("verified").default(false),
}, (table) => {
  return {
    userIdx: index("user_id_idx").on(table.user_id),
  };
});

export const insertSellerSchema = createInsertSchema(sellers, {
  seller_id: z.string().min(1),
  user_id: z.number().int().positive(),
  shop_name: z.string().min(1),
  joined_date: z.date().optional(),
  rating: z.number().optional(),
  verified: z.boolean().optional(),
}).omit({
  id: true,
});

// Products
export const products = mysqlTable("products", {
  id: serial("id").primaryKey(),
  product_id: varchar("product_id", { length: 50 }).notNull().unique(),
  seller_id: int("seller_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  price: double("price").notNull(),
  stock: int("stock").notNull(),
  image_url: text("image_url"),
  added_date: timestamp("added_date").defaultNow().notNull(),
  last_updated: timestamp("last_updated").defaultNow(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // "active", "pending", "delisted"
}, (table) => {
  return {
    sellerIdx: index("seller_id_idx").on(table.seller_id),
  };
});

export const insertProductSchema = createInsertSchema(products, {
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().positive("Price must be positive"),
  stock: z.coerce.number().int().nonnegative("Stock must be a non-negative integer"),
  image_url: z.string().optional(),
  status: z.string().default("active"),
}).omit({
  id: true,
  product_id: true, // Generated on server
  seller_id: true,  // Derived from the authenticated user
  added_date: true,
  last_updated: true,
});

// Categories
export const categories = mysqlTable("categories", {
  id: serial("id").primaryKey(),
  category_id: varchar("category_id", { length: 50 }).notNull().unique(),
  category_name: varchar("category_name", { length: 100 }).notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

// Product-Category relationship (many-to-many)
export const productCategories = mysqlTable("product_categories", {
  id: serial("id").primaryKey(),
  product_id: int("product_id").notNull(),
  category_id: int("category_id").notNull(),
}, (table) => {
  return {
    unq: unique().on(table.product_id, table.category_id),
    prodIdx: index("product_id_idx").on(table.product_id),
    catIdx: index("category_id_idx").on(table.category_id),
  };
});

export const insertProductCategorySchema = createInsertSchema(productCategories).omit({
  id: true,
});

// Cart
export const carts = mysqlTable("carts", {
  id: serial("id").primaryKey(),
  cart_id: varchar("cart_id", { length: 50 }).notNull().unique(),
  user_id: int("user_id").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    userIdx: index("user_id_idx").on(table.user_id),
  };
});

export const insertCartSchema = createInsertSchema(carts).omit({
  id: true,
  created_at: true,
});

// Cart Items
export const cartItems = mysqlTable("cart_items", {
  id: serial("id").primaryKey(),
  cart_id: int("cart_id").notNull(),
  product_id: int("product_id").notNull(),
  quantity: int("quantity").notNull().default(1),
  added_date: timestamp("added_date").defaultNow().notNull(),
}, (table) => {
  return {
    cartIdx: index("cart_id_idx").on(table.cart_id),
    prodIdx: index("product_id_idx").on(table.product_id),
  };
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  added_date: true,
});

// Orders
export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  order_id: varchar("order_id", { length: 50 }).notNull().unique(),
  customer_id: int("customer_id").notNull(),
  total_price: double("total_price").notNull(),
  order_date: timestamp("order_date").defaultNow().notNull(),
  status: varchar("status", { length: 20 }).notNull().default("processing"), // "processing", "shipped", "delivered", "cancelled"
}, (table) => {
  return {
    custIdx: index("customer_id_idx").on(table.customer_id),
  };
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  order_date: true,
});

// Order Items (products in order)
export const orderItems = mysqlTable("order_items", {
  id: serial("id").primaryKey(),
  order_id: int("order_id").notNull(),
  product_id: int("product_id").notNull(),
  quantity: int("quantity").notNull(),
  price: double("price").notNull(), // Price at time of purchase
}, (table) => {
  return {
    orderIdx: index("order_id_idx").on(table.order_id),
    prodIdx: index("product_id_idx").on(table.product_id),
  };
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

// Payments
export const payments = mysqlTable("payments", {
  id: serial("id").primaryKey(),
  payment_id: varchar("payment_id", { length: 50 }).notNull().unique(),
  order_id: int("order_id").notNull(),
  amount: double("amount").notNull(),
  payment_date: timestamp("payment_date").defaultNow().notNull(),
  method: varchar("method", { length: 50 }).notNull(), // "credit_card", "paypal", etc.
  status: varchar("status", { length: 20 }).notNull().default("pending"), // "pending", "completed", "failed"
}, (table) => {
  return {
    orderIdx: index("order_id_idx").on(table.order_id),
  };
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  payment_date: true,
});

// Shipments
export const shipments = mysqlTable("shipments", {
  id: serial("id").primaryKey(),
  shipment_id: varchar("shipment_id", { length: 50 }).notNull().unique(),
  order_id: int("order_id").notNull(),
  shipment_date: timestamp("shipment_date").defaultNow(),
  estimated_delivery: timestamp("estimated_delivery"),
  tracking_number: varchar("tracking_number", { length: 100 }),
  carrier: varchar("carrier", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("processing"), // "processing", "shipped", "delivered"
}, (table) => {
  return {
    orderIdx: index("order_id_idx").on(table.order_id),
  };
});

export const insertShipmentSchema = createInsertSchema(shipments).omit({
  id: true,
  shipment_date: true,
});

// Product Reviews
export const reviews = mysqlTable("reviews", {
  id: serial("id").primaryKey(),
  review_id: varchar("review_id", { length: 50 }).notNull().unique(),
  product_id: int("product_id").notNull(),
  customer_id: int("customer_id").notNull(),
  rating: int("rating").notNull(),
  review_text: text("review_text"),
  review_date: timestamp("review_date").defaultNow().notNull(),
}, (table) => {
  return {
    prodIdx: index("product_id_idx").on(table.product_id),
    custIdx: index("customer_id_idx").on(table.customer_id),
  };
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  review_date: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type Seller = typeof sellers.$inferSelect;
export type InsertSeller = z.infer<typeof insertSellerSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;

export type Cart = typeof carts.$inferSelect;
export type InsertCart = z.infer<typeof insertCartSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = z.infer<typeof insertShipmentSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;