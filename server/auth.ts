import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { User, InsertUser, loginUserSchema } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

// Removed password encryption for simplicity as requested
async function hashPassword(password: string) {
  return password; // No encryption, store as plain text
}

async function comparePasswords(supplied: string, stored: string) {
  return supplied === stored; // Direct string comparison
}

export function setupAuth(app: Express) {
  console.log("Setting up auth with sessionStore:", !!storage.sessionStore);
  
  const sessionSettings: session.SessionOptions = {
    secret: "super-secret-key-for-development",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: false, // Setting to false for development
      sameSite: "lax"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate request body
      const validationResult = loginUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validationResult.error.errors 
        });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists (if provided)
      if (req.body.email) {
        const existingEmail = await storage.getUserByEmail(req.body.email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      // Create the user with hashed password
      const hashedPassword = await hashPassword(req.body.password);
      const userToCreate: InsertUser = {
        ...req.body,
        password: hashedPassword,
        role: req.body.role || "customer"
      };

      const user = await storage.createUser(userToCreate);

      // If user is a seller, create seller profile
      if (user.role === "seller" && req.body.shop_name) {
        await storage.createSeller({
          user_id: user.id,
          seller_id: `SELLER-${randomBytes(4).toString("hex")}`,
          shop_name: req.body.shop_name
        });
      }

      // Auto login after registration
      req.login(user, (err) => {
        if (err) return next(err);
        // Don't send password in response
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error, user: User, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info.message || "Authentication failed" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        // Don't send password in response
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie("connect.sid");
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    // Don't send password in response
    const { password, ...userWithoutPassword } = req.user as User;
    res.json(userWithoutPassword);
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check if user has specific role
export function hasRole(roles: string | string[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = req.user as User;
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    next();
  };
}
