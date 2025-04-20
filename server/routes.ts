import type { Express } from "express";
import { createServer, type Server } from "http";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hasRole } from "./auth";
import {
  insertProductSchema,
  insertCartItemSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertPaymentSchema,
  insertShipmentSchema,
  insertReviewSchema,
  insertCategorySchema,
  insertProductCategorySchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // CATEGORY ROUTES
  app.get("/api/categories", async (req, res, next) => {
    try {
      const categories = await storage.listCategories();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/categories/:id", async (req, res, next) => {
    try {
      const category = await storage.getCategory(parseInt(req.params.id));
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/categories", hasRole("admin"), async (req, res, next) => {
    try {
      const validationResult = insertCategorySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validationResult.error.errors 
        });
      }

      const categoryData = {
        ...validationResult.data,
        category_id: `CAT-${randomBytes(4).toString("hex")}`
      };

      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/categories/:id", hasRole("admin"), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      const updatedCategory = await storage.updateCategory(id, req.body);
      res.json(updatedCategory);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/categories/:id", hasRole("admin"), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      await storage.deleteCategory(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // PRODUCT ROUTES
  app.get("/api/products", async (req, res, next) => {
    try {
      const { sellerId, categoryId, status, search } = req.query;
      
      console.log('GET /api/products query params:', { sellerId, categoryId, status, search });
      
      // TEMPORARY: Direct database check for debugging removed - causing errors
      
      let products = [];
      
      if (search) {
        console.log(`Searching for products with query: ${search}`);
        products = await storage.searchProducts(search as string);
      } else {
        const filter: any = {};
        
        if (sellerId) filter.sellerId = parseInt(sellerId as string);
        if (categoryId) filter.categoryId = parseInt(categoryId as string);
        if (status) filter.status = status as string;
        
        console.log('Fetching products with filter:', filter);
        
        // Apply the filter to fetch products
        products = await storage.listProducts(filter);
        console.log(`Found ${products.length} products with filter: ${JSON.stringify(filter)}`)
      }
      
      console.log('Raw products from database:', products);
      
      // Enhance products with category information
      const enhancedProducts = await Promise.all(
        products.map(async (product) => {
          try {
            const categories = await storage.getProductCategories(product.id);
            console.log(`Product ${product.id} has ${categories.length} categories`);
            return {
              ...product,
              categories
            };
          } catch (error) {
            console.error(`Error enhancing product ${product.id}:`, error);
            return {
              ...product,
              categories: []
            };
          }
        })
      );
      
      console.log(`Sending ${enhancedProducts.length} enhanced products`);
      res.json(enhancedProducts);
    } catch (error) {
      console.error('Error in GET /api/products:', error);
      next(error);
    }
  });

  app.get("/api/products/:id", async (req, res, next) => {
    try {
      const product = await storage.getProduct(parseInt(req.params.id));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const categories = await storage.getProductCategories(product.id);
      const reviews = await storage.getProductReviews(product.id);
      
      res.json({
        ...product,
        categories,
        reviews
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/products", hasRole(["seller", "admin"]), async (req, res, next) => {
    try {
      const validationResult = insertProductSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validationResult.error.errors 
        });
      }

      const user = req.user!;
      
      // Get seller_id from user
      let sellerId;
      if (user.role === "seller") {
        let seller = await storage.getSellerByUserId(user.id);
        if (!seller) {
          // Create a seller profile automatically for this user
          seller = await storage.createSeller({
            user_id: user.id,
            seller_id: `SELLER-${randomBytes(4).toString("hex")}`,
            shop_name: `${user.name || user.username}'s Store`,
            joined_date: new Date(),
            rating: 5.0,
            verified: true
          });
          console.log("Created seller profile for user:", user.id);
        }
        sellerId = seller.id;
      } else {
        // Admin can specify seller_id
        sellerId = req.body.seller_id;
      }

      const productData = {
        ...validationResult.data,
        product_id: `PROD-${randomBytes(4).toString("hex")}`,
        seller_id: sellerId,
        status: user.role === "admin" ? "active" : "pending" // Sellers' products need approval
      };

      const product = await storage.createProduct(productData);
      
      // Add categories if specified
      if (req.body.categories && Array.isArray(req.body.categories)) {
        for (const categoryId of req.body.categories) {
          try {
            const category = await storage.getCategory(parseInt(categoryId));
            if (category) {
              await storage.assignProductToCategory({
                product_id: product.id,
                category_id: category.id
              });
            }
          } catch (error) {
            console.error(`Error adding category ${categoryId} to product:`, error);
            // Continue with other categories even if one fails
          }
        }
      }
      
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/products/:id", hasRole(["seller", "admin"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const user = req.user!;
      
      // Check if the user has permission to update this product
      if (user.role === "seller") {
        const seller = await storage.getSellerByUserId(user.id);
        if (!seller || seller.id !== product.seller_id) {
          return res.status(403).json({ message: "You don't have permission to update this product" });
        }
      }

      const updatedProduct = await storage.updateProduct(id, req.body);
      
      // Update categories if specified
      if (req.body.categories && Array.isArray(req.body.categories)) {
        try {
          // Get current categories
          const currentCategories = await storage.getProductCategories(id);
          const currentCategoryIds = currentCategories.map(c => c.id);
          
          // Add new categories
          for (const categoryId of req.body.categories) {
            const catId = parseInt(categoryId);
            if (!currentCategoryIds.includes(catId)) {
              await storage.assignProductToCategory({
                product_id: id,
                category_id: catId
              });
            }
          }
          
          // Remove categories not in the new list
          for (const category of currentCategories) {
            if (!req.body.categories.includes(category.id.toString()) && 
                !req.body.categories.includes(category.id)) {
              await storage.removeProductFromCategory(id, category.id);
            }
          }
        } catch (error) {
          console.error("Error updating product categories:", error);
          // Continue with the response even if category updates fail
        }
      }
      
      res.json(updatedProduct);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/products/:id", hasRole(["seller", "admin"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const user = req.user!;
      
      // Check if the user has permission to delete this product
      if (user.role === "seller") {
        const seller = await storage.getSellerByUserId(user.id);
        if (!seller || seller.id !== product.seller_id) {
          return res.status(403).json({ message: "You don't have permission to delete this product" });
        }
      }

      await storage.deleteProduct(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // PRODUCT CATEGORY ASSIGNMENT
  app.post("/api/products/:productId/categories", hasRole(["seller", "admin"]), async (req, res, next) => {
    try {
      const productId = parseInt(req.params.productId);
      const { categoryId } = req.body;
      
      if (!categoryId) {
        return res.status(400).json({ message: "categoryId is required" });
      }
      
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const category = await storage.getCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      const user = req.user!;
      
      // Check if the user has permission
      if (user.role === "seller") {
        const seller = await storage.getSellerByUserId(user.id);
        if (!seller || seller.id !== product.seller_id) {
          return res.status(403).json({ message: "You don't have permission to update this product" });
        }
      }

      const validationResult = insertProductCategorySchema.safeParse({
        product_id: productId,
        category_id: categoryId
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validationResult.error.errors 
        });
      }

      const productCategory = await storage.assignProductToCategory(validationResult.data);
      res.status(201).json(productCategory);
    } catch (error) {
      next(error);
    }
  });

  // CART ROUTES
  app.get("/api/cart", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      let cart = await storage.getCartByUserId(user.id);
      
      if (!cart) {
        // Create a cart if it doesn't exist
        cart = await storage.createCart({
          user_id: user.id,
          cart_id: `CART-${randomBytes(4).toString("hex")}`
        });
      }
      
      const cartItems = await storage.getCartItems(cart.id);
      
      // Get product details for each cart item
      const itemsWithDetails = await Promise.all(
        cartItems.map(async (item) => {
          const product = await storage.getProduct(item.product_id);
          return {
            ...item,
            product
          };
        })
      );
      
      res.json({
        ...cart,
        items: itemsWithDetails
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/cart/items", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      let cart = await storage.getCartByUserId(user.id);
      
      if (!cart) {
        // Create a cart if it doesn't exist
        cart = await storage.createCart({
          user_id: user.id,
          cart_id: `CART-${randomBytes(4).toString("hex")}`
        });
      }
      
      const validationResult = insertCartItemSchema.safeParse({
        ...req.body,
        cart_id: cart.id
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validationResult.error.errors 
        });
      }

      // Check if product exists and has enough stock
      const product = await storage.getProduct(validationResult.data.product_id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.stock < validationResult.data.quantity) {
        return res.status(400).json({ message: "Not enough stock available" });
      }

      const cartItem = await storage.addCartItem(validationResult.data);
      
      // Include product details in response
      const itemWithProduct = {
        ...cartItem,
        product
      };
      
      res.status(201).json(itemWithProduct);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/cart/items/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const cart = await storage.getCartByUserId(user.id);
      
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }
      
      const itemId = parseInt(req.params.id);
      const cartItem = await storage.getCartItem(itemId);
      
      if (!cartItem || cartItem.cart_id !== cart.id) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      // Check if product has enough stock
      if (req.body.quantity) {
        const product = await storage.getProduct(cartItem.product_id);
        if (product && product.stock < req.body.quantity) {
          return res.status(400).json({ message: "Not enough stock available" });
        }
      }
      
      const updatedItem = await storage.updateCartItem(itemId, req.body);
      
      // Include product details
      const product = await storage.getProduct(cartItem.product_id);
      const itemWithProduct = {
        ...updatedItem,
        product
      };
      
      res.json(itemWithProduct);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/cart/items/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const cart = await storage.getCartByUserId(user.id);
      
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }
      
      const itemId = parseInt(req.params.id);
      const cartItem = await storage.getCartItem(itemId);
      
      if (!cartItem || cartItem.cart_id !== cart.id) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      await storage.removeCartItem(itemId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // CHECKOUT AND ORDER ROUTES
  app.post("/api/orders", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const cart = await storage.getCartByUserId(user.id);
      
      if (!cart) {
        return res.status(400).json({ message: "Cart is empty" });
      }
      
      const cartItems = await storage.getCartItems(cart.id);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
      
      // Calculate total price and verify stock
      let totalPrice = 0;
      for (const item of cartItems) {
        const product = await storage.getProduct(item.product_id);
        if (!product) {
          return res.status(400).json({ message: `Product with ID ${item.product_id} not found` });
        }
        
        if (product.stock < item.quantity) {
          return res.status(400).json({ message: `Not enough stock for ${product.name}` });
        }
        
        totalPrice += product.price * item.quantity;
      }
      
      // Create order
      const orderData = {
        order_id: `ORD-${randomBytes(4).toString("hex")}`,
        customer_id: user.id,
        total_price: totalPrice,
        ...req.body
      };
      
      const validationResult = insertOrderSchema.safeParse(orderData);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validationResult.error.errors 
        });
      }
      
      const order = await storage.createOrder(validationResult.data);
      
      // Create order items
      for (const item of cartItems) {
        const product = await storage.getProduct(item.product_id);
        if (product) {
          await storage.addOrderItem({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: product.price
          });
          
          // Update product stock
          await storage.updateProduct(product.id, {
            stock: product.stock - item.quantity
          });
        }
      }
      
      // Create payment record
      const paymentData = {
        payment_id: `PAY-${randomBytes(4).toString("hex")}`,
        order_id: order.id,
        amount: totalPrice,
        method: req.body.payment_method || "credit_card",
        status: "completed" // Mock payment is always successful
      };
      
      const payment = await storage.createPayment(paymentData);
      
      // Create shipment record
      const shipmentData = {
        shipment_id: `SHIP-${randomBytes(4).toString("hex")}`,
        order_id: order.id,
        estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: "processing"
      };
      
      const shipment = await storage.createShipment(shipmentData);
      
      // Clear the cart
      for (const item of cartItems) {
        await storage.removeCartItem(item.id);
      }
      
      res.status(201).json({
        order,
        payment,
        shipment
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/orders", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      let orders = [];
      
      if (user.role === "customer") {
        // Customers see their own orders
        orders = await storage.listOrders(user.id);
      } else if (user.role === "seller") {
        // Sellers see orders for their products
        const seller = await storage.getSellerByUserId(user.id);
        if (seller) {
          orders = await storage.getSellerOrders(seller.id);
        }
      } else if (user.role === "admin") {
        // Admins see all orders
        orders = await storage.listOrders();
      }
      
      // Get order items for each order
      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          const payment = await storage.getOrderPayment(order.id);
          const shipment = await storage.getOrderShipment(order.id);
          
          return {
            ...order,
            items,
            payment,
            shipment
          };
        })
      );
      
      res.json(ordersWithDetails);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/orders/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check if user has permission to view this order
      if (user.role === "customer" && order.customer_id !== user.id) {
        return res.status(403).json({ message: "You don't have permission to view this order" });
      }
      
      if (user.role === "seller") {
        // Check if any product in this order belongs to this seller
        const seller = await storage.getSellerByUserId(user.id);
        if (!seller) {
          return res.status(403).json({ message: "Seller profile not found" });
        }
        
        const orderItems = await storage.getOrderItems(order.id);
        const sellerProducts = await storage.listProducts({ sellerId: seller.id });
        const sellerProductIds = sellerProducts.map(p => p.id);
        
        const hasSellerProducts = orderItems.some(item => sellerProductIds.includes(item.product_id));
        
        if (!hasSellerProducts) {
          return res.status(403).json({ message: "You don't have permission to view this order" });
        }
      }
      
      // Get order details
      const items = await storage.getOrderItems(order.id);
      const payment = await storage.getOrderPayment(order.id);
      const shipment = await storage.getOrderShipment(order.id);
      
      // Get product details for each item
      const itemsWithProducts = await Promise.all(
        items.map(async (item) => {
          const product = await storage.getProduct(item.product_id);
          return {
            ...item,
            product
          };
        })
      );
      
      res.json({
        ...order,
        items: itemsWithProducts,
        payment,
        shipment
      });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/orders/:id", hasRole(["admin"]), async (req, res, next) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const updatedOrder = await storage.updateOrder(orderId, req.body);
      res.json(updatedOrder);
    } catch (error) {
      next(error);
    }
  });

  // SHIPMENT ROUTES
  app.put("/api/shipments/:id", hasRole(["admin", "seller"]), async (req, res, next) => {
    try {
      const shipmentId = parseInt(req.params.id);
      const shipment = await storage.getShipment(shipmentId);
      
      if (!shipment) {
        return res.status(404).json({ message: "Shipment not found" });
      }
      
      const user = req.user!;
      
      // If seller, check if they have permission
      if (user.role === "seller") {
        const order = await storage.getOrder(shipment.order_id);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }
        
        const orderItems = await storage.getOrderItems(order.id);
        const seller = await storage.getSellerByUserId(user.id);
        
        if (!seller) {
          return res.status(403).json({ message: "Seller profile not found" });
        }
        
        const sellerProducts = await storage.listProducts({ sellerId: seller.id });
        const sellerProductIds = sellerProducts.map(p => p.id);
        
        const hasSellerProducts = orderItems.some(item => sellerProductIds.includes(item.product_id));
        
        if (!hasSellerProducts) {
          return res.status(403).json({ message: "You don't have permission to update this shipment" });
        }
      }
      
      const updatedShipment = await storage.updateShipment(shipmentId, req.body);
      
      // If status changed to "shipped", update order status
      if (req.body.status === "shipped") {
        await storage.updateOrder(shipment.order_id, { status: "shipped" });
      } else if (req.body.status === "delivered") {
        await storage.updateOrder(shipment.order_id, { status: "delivered" });
      }
      
      res.json(updatedShipment);
    } catch (error) {
      next(error);
    }
  });

  // REVIEW ROUTES
  app.post("/api/reviews", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      
      if (user.role !== "customer") {
        return res.status(403).json({ message: "Only customers can post reviews" });
      }
      
      const productId = req.body.product_id;
      if (!productId) {
        return res.status(400).json({ message: "product_id is required" });
      }
      
      // Check if product exists
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if user has purchased this product
      const userOrders = await storage.listOrders(user.id);
      const userOrderIds = userOrders.map(o => o.id);
      
      let hasPurchased = false;
      for (const orderId of userOrderIds) {
        const orderItems = await storage.getOrderItems(orderId);
        if (orderItems.some(item => item.product_id === productId)) {
          hasPurchased = true;
          break;
        }
      }
      
      if (!hasPurchased) {
        return res.status(403).json({ message: "You can only review products you have purchased" });
      }
      
      // Check if user has already reviewed this product
      const userReviews = await storage.getUserReviews(user.id);
      if (userReviews.some(review => review.product_id === productId)) {
        return res.status(400).json({ message: "You have already reviewed this product" });
      }
      
      const reviewData = {
        ...req.body,
        review_id: `REV-${randomBytes(4).toString("hex")}`,
        customer_id: user.id
      };
      
      const validationResult = insertReviewSchema.safeParse(reviewData);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validationResult.error.errors 
        });
      }
      
      const review = await storage.createReview(validationResult.data);
      res.status(201).json(review);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/products/:id/reviews", async (req, res, next) => {
    try {
      const productId = parseInt(req.params.id);
      
      // Check if product exists
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const reviews = await storage.getProductReviews(productId);
      
      // Get user details for each review
      const reviewsWithUser = await Promise.all(
        reviews.map(async (review) => {
          const user = await storage.getUser(review.customer_id);
          return {
            ...review,
            customer: user ? {
              id: user.id,
              username: user.username,
              name: user.name
            } : null
          };
        })
      );
      
      res.json(reviewsWithUser);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/reviews/:id", hasRole(["admin"]), async (req, res, next) => {
    try {
      const reviewId = parseInt(req.params.id);
      const review = await storage.getReview(reviewId);
      
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      await storage.deleteReview(reviewId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // USER MANAGEMENT (ADMIN)
  app.get("/api/users", hasRole("admin"), async (req, res, next) => {
    try {
      const users = await storage.listUsers();
      
      // Don't send passwords
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/users/:id", hasRole("admin"), async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await storage.deleteUser(userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // SELLER MANAGEMENT
  app.get("/api/sellers", isAuthenticated, async (req, res, next) => {
    try {
      const { userId } = req.query;
      const user = req.user!; // Always defined due to isAuthenticated middleware
      
      // If userId query param is provided and user is a seller, only return their own seller profile
      if (userId && user.role === "seller" && parseInt(userId as string) !== user.id) {
        return res.status(403).json({ message: "You can only view your own seller profile" });
      }
      
      // If user is a seller and no userId is provided, default to their own profile
      if (user.role === "seller" && !userId) {
        const seller = await storage.getSellerByUserId(user.id);
        if (!seller) {
          return res.status(404).json({ message: "Seller profile not found" });
        }
        
        return res.json([{
          ...seller,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }]);
      }
      
      // For specific userId (admin can view any, seller only their own)
      if (userId) {
        const seller = await storage.getSellerByUserId(parseInt(userId as string));
        if (!seller) {
          return res.status(404).json({ message: "Seller profile not found" });
        }
        
        const sellerUser = await storage.getUser(seller.user_id);
        return res.json([{
          ...seller,
          user: sellerUser ? {
            id: sellerUser.id,
            username: sellerUser.username,
            name: sellerUser.name,
            email: sellerUser.email,
            role: sellerUser.role
          } : null
        }]);
      }
      
      // Admin can list all sellers
      if (user.role === "admin") {
        const sellers = await storage.listSellers();
        
        // Get user details for each seller
        const sellersWithDetails = await Promise.all(
          sellers.map(async (seller) => {
            const user = await storage.getUser(seller.user_id);
            return {
              ...seller,
              user: user ? {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role
              } : null
            };
          })
        );
        
        res.json(sellersWithDetails);
      } else {
        // Non-admin users can't list all sellers
        return res.status(403).json({ message: "Unauthorized" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
