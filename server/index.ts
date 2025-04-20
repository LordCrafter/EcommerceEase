import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { loadEnv } from "./env";

// Load environment variables from .env file
loadEnv();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  
  // Get the hostname - use 'localhost' for local development to avoid ENOTSUP errors
  const isLocalDev = process.env.NODE_ENV === 'development' && 
                     (!process.env.REPL_SLUG && !process.env.REPL_ID);
  const hostname = isLocalDev ? 'localhost' : '0.0.0.0';
  
  try {
    // First try with the detailed configuration
    server.listen({
      port,
      host: hostname,
      reusePort: true,
    }, () => {
      log(`serving on ${hostname}:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server with initial settings, trying fallback:', error);
    
    // If the first attempt fails (which can happen locally), try simplified approach
    server.listen(port, () => {
      log(`serving on port ${port} with fallback configuration`);
    });
  }
})();
