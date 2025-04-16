import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User and Authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone_number: text("phone_number"),
  address: text("address"),
  registration_date: timestamp("registration_date").defaultNow().notNull(),
  role: text("role").notNull().default("customer"), // "customer", "seller", "admin"
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
export const sellers = pgTable("sellers", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  seller_id: text("seller_id").notNull().unique(),
  shop_name: text("shop_name").notNull(),
});

export const insertSellerSchema = createInsertSchema(sellers).omit({
  id: true,
});

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  product_id: text("product_id").notNull().unique(),
  seller_id: integer("seller_id").notNull().references(() => sellers.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  stock: integer("stock").notNull(),
  image_url: text("image_url"),
  added_date: timestamp("added_date").defaultNow().notNull(),
  last_updated: timestamp("last_updated").defaultNow(),
  status: text("status").notNull().default("active"), // "active", "pending", "delisted"
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  added_date: true,
  last_updated: true,
});

// Categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  category_id: text("category_id").notNull().unique(),
  category_name: text("category_name").notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

// Product-Category relationship (many-to-many)
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  category_id: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
}, (table) => {
  return {
    unq: unique().on(table.product_id, table.category_id),
  };
});

export const insertProductCategorySchema = createInsertSchema(productCategories).omit({
  id: true,
});

// Cart
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  cart_id: text("cart_id").notNull().unique(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertCartSchema = createInsertSchema(carts).omit({
  id: true,
  created_at: true,
});

// Cart Items
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cart_id: integer("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  product_id: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  added_date: timestamp("added_date").defaultNow().notNull(),
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  added_date: true,
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  order_id: text("order_id").notNull().unique(),
  customer_id: integer("customer_id").notNull().references(() => users.id),
  total_price: doublePrecision("total_price").notNull(),
  order_date: timestamp("order_date").defaultNow().notNull(),
  status: text("status").notNull().default("processing"), // "processing", "shipped", "delivered", "cancelled"
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  order_date: true,
});

// Order Items (products in order)
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  product_id: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: doublePrecision("price").notNull(), // Price at time of purchase
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

// Payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  payment_id: text("payment_id").notNull().unique(),
  order_id: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  amount: doublePrecision("amount").notNull(),
  payment_date: timestamp("payment_date").defaultNow().notNull(),
  method: text("method").notNull(), // "credit_card", "paypal", etc.
  status: text("status").notNull().default("pending"), // "pending", "completed", "failed"
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  payment_date: true,
});

// Shipments
export const shipments = pgTable("shipments", {
  id: serial("id").primaryKey(),
  shipment_id: text("shipment_id").notNull().unique(),
  order_id: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  shipment_date: timestamp("shipment_date").defaultNow(),
  estimated_delivery: timestamp("estimated_delivery"),
  tracking_number: text("tracking_number"),
  carrier: text("carrier"),
  status: text("status").notNull().default("processing"), // "processing", "shipped", "delivered"
});

export const insertShipmentSchema = createInsertSchema(shipments).omit({
  id: true,
  shipment_date: true,
});

// Product Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  review_id: text("review_id").notNull().unique(),
  product_id: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  customer_id: integer("customer_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  review_text: text("review_text"),
  review_date: timestamp("review_date").defaultNow().notNull(),
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
