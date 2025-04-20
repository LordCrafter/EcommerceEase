# ShopEase E-Commerce Platform

A robust e-commerce platform designed for scalable online retail experiences with comprehensive product management, multi-user support, and dual database capability.

## Features

- **Role-based access control**: Customer, Seller, and Admin roles with different permissions
- **Product management**: Full CRUD operations for products with image uploads
- **Shopping cart**: Add, update, remove items with real-time totals
- **Order processing**: Complete checkout flow with order history
- **Reviews and ratings**: Product review system with star ratings
- **Category system**: Organize products by categories
- **Responsive design**: Mobile-first UI that works on all devices
- **Dual database support**: PostgreSQL and MySQL with automatic fallback

## Tech Stack Overview

### Frontend
- **React 18**: Component-based UI library
- **TypeScript**: Static typing for better developer experience
- **TanStack Query (React Query)**: Data fetching, caching, and state management
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Shadcn UI**: High-quality UI components built on Radix UI
- **Wouter**: Lightweight routing library
- **React Hook Form**: Form validation and submission
- **Zod**: Schema validation for forms and API requests
- **Lucide React**: Modern icon library

### Backend
- **Node.js**: JavaScript runtime for server-side code
- **Express**: Web framework for handling HTTP requests
- **TypeScript**: Type safety for server-side code
- **Drizzle ORM**: Database toolkit with type safety
- **PostgreSQL**: Primary relational database
- **MySQL**: Secondary relational database
- **Express Session**: Session management for authentication
- **Passport.js**: Authentication middleware
- **Bcrypt**: Password hashing
- **Zod**: Schema validation for API requests

### DevOps
- **Vite**: Frontend build tool and development server
- **ESBuild**: Fast JavaScript/TypeScript bundler
- **tsx**: TypeScript execution environment
- **Replit**: Hosting and deployment platform

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   ├── pages/          # Page components
│   │   └── App.tsx         # Main application component
│
├── server/                 # Backend Express application
│   ├── auth.ts             # Authentication logic
│   ├── config.ts           # Server configuration
│   ├── db.ts               # PostgreSQL database connection
│   ├── db-storage.ts       # PostgreSQL data access layer
│   ├── index.ts            # Server entry point
│   ├── mysql-db.ts         # MySQL database connection
│   ├── mysql-storage.ts    # MySQL data access layer
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Storage interface and factory
│   └── vite.ts             # Vite server configuration
│
├── shared/                 # Shared code between frontend and backend
│   ├── schema.ts           # Database schema and types
│   └── mysql-schema.ts     # MySQL-specific schema
│
├── scripts/                # Utility scripts
│   ├── add-admin.ts        # Script to create admin user
│   ├── reset-admin-password.ts # Password reset script
│   ├── seed-data.ts        # Database seeding script
│   └── verify-database.ts  # Database connectivity verification
│
├── .env                    # Environment variables
├── drizzle.config.ts       # Drizzle ORM configuration
├── package.json            # Project dependencies
└── tsconfig.json           # TypeScript configuration
```

## File Descriptions

### Server Files

| File | Description |
|------|-------------|
| `server/auth.ts` | Implements user authentication using Passport.js with LocalStrategy. Handles login, registration, session management, and role-based access control. Sets up authentication middleware and routes for `/api/login`, `/api/register`, `/api/logout`, and `/api/user`. |
| `server/config.ts` | Contains configuration settings for the application, including database options (PostgreSQL and MySQL), environment-specific settings, and feature toggles. Provides functions to determine which database to use based on environment variables and availability. |
| `server/db.ts` | Establishes and manages the PostgreSQL database connection using Drizzle ORM. Creates a database connection pool and configures the WebSocket client for Neon database connectivity. Initializes the Drizzle ORM with the database schema. |
| `server/db-storage.ts` | Implements the PostgreSQL storage layer adhering to the IStorage interface. Contains all data access functions for users, products, categories, carts, orders, etc. Uses SQL queries via Drizzle ORM to interact with the PostgreSQL database. |
| `server/env.ts` | Loads and validates environment variables from the `.env` file. Ensures required environment variables are present and provides descriptive error messages when they're missing. Also logs the loaded configuration for debugging purposes. |
| `server/index.ts` | The main entry point for the server application. Sets up the Express server, configures middleware, initializes the database connection, sets up authentication, registers API routes, and starts the HTTP server listening on the configured port. |
| `server/mysql-db.ts` | Provides connectivity to MySQL databases using mysql2 with Promise interface. Attempts to establish a connection to the MySQL server based on environment variables. Includes error handling and connection pooling. |
| `server/mysql-storage.ts` | Implements the MySQL version of the storage layer adhering to the IStorage interface. Contains equivalent data access functions to db-storage.ts but optimized for MySQL syntax and features. |
| `server/routes.ts` | Defines all API routes and their handlers. Organizes routes into categories (products, categories, orders, etc.) and implements business logic for each endpoint. Includes middleware for authentication, validation, and error handling. |
| `server/storage.ts` | Defines the IStorage interface that all storage implementations must follow. Provides a factory pattern to create the appropriate storage implementation based on the configured database type (PostgreSQL, MySQL, or in-memory). |
| `server/vite.ts` | Configures and integrates Vite with the Express server for development, enabling features like hot module replacement (HMR) for the frontend while serving the API from the same origin to avoid CORS issues. |

### Shared Files

| File | Description |
|------|-------------|
| `shared/schema.ts` | Defines the PostgreSQL database schema using Drizzle ORM table definitions. Includes all tables (users, products, categories, orders, etc.) with their columns, constraints, and relationships. Also exports TypeScript types and Zod validation schemas for the entities. |
| `shared/mysql-schema.ts` | Similar to schema.ts but optimized for MySQL syntax and features. Defines the same tables and relationships but uses MySQL-specific column types and constraints. Provides a consistent interface for both database types. |

### Client Files

#### Core Files

| File | Description |
|------|-------------|
| `client/src/App.tsx` | The root component of the React application. Sets up providers (QueryClient, Auth) and defines the application's routing using wouter. Contains the main Switch component that maps URL paths to page components. |
| `client/src/main.tsx` | The entry point for the client application. Renders the App component into the DOM and sets up any global configurations or polyfills. |
| `client/src/index.css` | Global CSS styles for the application. Imports Tailwind CSS directives and defines custom utility classes and global style overrides. |

#### Library Files

| File | Description |
|------|-------------|
| `client/src/lib/protected-route.tsx` | A higher-order component that wraps routes requiring authentication. Redirects unauthenticated users to the login page and handles role-based access control. Also manages loading states and error messages for authentication. |
| `client/src/lib/queryClient.ts` | Configures and exports the TanStack Query client with default options. Provides utility functions for API requests, error handling, and cache management. Sets up consistent error handling for 401 responses. |
| `client/src/lib/utils.ts` | Contains utility functions used throughout the application, such as formatting functions, helper methods, and common operations that don't fit elsewhere. Includes the cn function for composing class names with Tailwind. |

#### Hook Files

| File | Description |
|------|-------------|
| `client/src/hooks/use-auth.tsx` | Implements the authentication context and hook. Provides access to the current user, login/logout mutations, and loading states. Manages authentication state across the application and handles login/logout operations. |
| `client/src/hooks/use-toast.tsx` | Provides a hook for displaying toast notifications with Shadcn UI's toast component. Makes it easy to show success, error, and info messages consistently across the application. |
| `client/src/hooks/use-mobile.tsx` | A utility hook that detects if the current viewport is a mobile device. Used for conditional rendering and responsive behavior throughout the application. |

#### Page Components

| File | Description |
|------|-------------|
| `client/src/pages/home-page.tsx` | The landing page component that displays featured products, categories, and promotional sections. Fetches data from the API and presents it in an attractive layout. |
| `client/src/pages/auth-page.tsx` | Handles user authentication with login and registration forms. Manages form validation, submission, and error handling. Redirects authenticated users away from this page. |
| `client/src/pages/product-page.tsx` | Displays detailed information about a single product. Shows images, description, price, stock, reviews, and related products. Includes add-to-cart functionality. |
| `client/src/pages/category-page.tsx` | Lists products belonging to a specific category. Includes filtering, sorting, and pagination of products. Shows category description and related categories. |
| `client/src/pages/cart-page.tsx` | Displays the user's shopping cart with items, quantities, and total price. Allows updating quantities and removing items. Includes a checkout button that leads to the checkout page. |
| `client/src/pages/checkout-page.tsx` | Guides the user through the checkout process with forms for shipping information, payment details, and order confirmation. Validates inputs and submits the order to the API. |
| `client/src/pages/order-page.tsx` | Shows details of a specific order or lists all orders for the current user. Displays order status, items, payment information, and tracking details when available. |
| `client/src/pages/dashboard-page.tsx` | Provides admin/seller dashboard for managing products, orders, and users. Different views based on user role (admin vs. seller). Includes analytics and management tools. |
| `client/src/pages/not-found.tsx` | A 404 page that's shown when a user navigates to a non-existent route. Provides a friendly message and a link back to the home page. |

#### UI Components

| File | Description |
|------|-------------|
| `client/src/components/layout/main-layout.tsx` | The main layout wrapper that includes the navigation header, footer, and main content area. Provides consistent structure across pages. |
| `client/src/components/layout/navigation.tsx` | The site header with logo, search bar, navigation links, and user menu. Adjusts display based on authentication status and user role. Includes responsive mobile menu. |
| `client/src/components/products/product-card.tsx` | A reusable card component for displaying product information in grids and lists. Shows image, name, price, and rating with a consistent design. |
| `client/src/components/products/product-detail.tsx` | Displays detailed product information including gallery, specifications, description, and price. Used within the product page. |
| `client/src/components/cart/cart-item.tsx` | Represents a single item in the shopping cart with product details, price, quantity control, and remove button. |
| `client/src/components/cart/order-summary.tsx` | Shows order total calculations including subtotal, tax, shipping, and final price. Used in cart and checkout pages. |
| `client/src/components/home/hero-section.tsx` | The banner section on the home page with promotional content, call-to-action buttons, and featured imagery. |
| `client/src/components/dashboard/admin-dashboard.tsx` | Dashboard view for admin users with site-wide statistics, user management, and system controls. |
| `client/src/components/dashboard/seller-dashboard.tsx` | Dashboard view for seller users with inventory management, order processing, and sales analytics. |

### Script Files

| File | Description |
|------|-------------|
| `scripts/add-admin.ts` | A utility script for creating an administrative user with full privileges. Used during initial setup or when a new admin user is needed. Takes username, email, and password as parameters. |
| `scripts/reset-admin-password.ts` | Allows resetting an admin user's password when access is lost. Requires knowing the admin username and generates a new secure password. |
| `scripts/seed-data.ts` | Populates the database with initial test data including users, products, categories, and sample orders. Useful for development, testing, and demonstration purposes. |
| `scripts/verify-database.ts` | Tests database connectivity by attempting to connect to all configured database types. Reports which databases are available and provides troubleshooting information for failed connections. |

### Configuration Files

| File | Description |
|------|-------------|
| `.env` | Contains environment variables for configuration, including database settings, session secrets, and feature flags. Used by both server and client applications. |
| `drizzle.config.ts` | Configuration for Drizzle ORM including database connection settings, migration options, and schema locations. Used by Drizzle CLI for migration management. |
| `package.json` | Defines project dependencies, scripts, and metadata. Contains all npm packages required by the application and commands for development, building, and testing. |
| `tsconfig.json` | TypeScript configuration specifying compiler options, included files, and type definitions. Controls how TypeScript code is compiled to JavaScript. |

## Database Architecture

This application features a dual database system with automatic fallback mechanisms:

### Database Configuration Options

You can configure the database type in the `.env` file:

```
# Database selection - options: 'mysql', 'postgres', or 'auto'
DB_TYPE=postgres
```

- `mysql`: Use MySQL as the primary database
- `postgres`: Use PostgreSQL as the primary database
- `auto`: Automatic detection with fallback (PostgreSQL first, then MySQL, then in-memory)

### PostgreSQL Configuration

PostgreSQL is automatically configured in the Replit environment via the `DATABASE_URL` environment variable.

### MySQL Configuration

If using MySQL, configure the following environment variables:

```
MYSQL_DATABASE=ecommerce
MYSQL_USER=root
MYSQL_PASSWORD=yourpassword
MYSQL_HOST=localhost
MYSQL_PORT=3306
```

### Fallback Mechanism

The application has a sophisticated fallback system:

1. It first attempts to connect to the configured database (MySQL or PostgreSQL)
2. If the primary database is unavailable, it will attempt to use the alternative database
3. If both databases are unavailable, it will use an in-memory storage solution
4. This ensures the application remains functional even when database connections fail

## API Endpoints

### Authentication

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|--------------|
| `/api/register` | POST | Register a new user | No |
| `/api/login` | POST | User login | No |
| `/api/logout` | POST | User logout | Yes |
| `/api/user` | GET | Get current user | Yes |

### Products

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|--------------|
| `/api/products` | GET | List all products | No |
| `/api/products/:id` | GET | Get a specific product | No |
| `/api/products` | POST | Create a new product | Yes (seller/admin) |
| `/api/products/:id` | PATCH | Update a product | Yes (seller/admin) |
| `/api/products/:id` | DELETE | Delete a product | Yes (seller/admin) |

### Categories

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|--------------|
| `/api/categories` | GET | List all categories | No |
| `/api/categories/:id` | GET | Get a specific category | No |
| `/api/categories` | POST | Create a new category | Yes (admin) |
| `/api/categories/:id` | PATCH | Update a category | Yes (admin) |
| `/api/categories/:id` | DELETE | Delete a category | Yes (admin) |

### Cart

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|--------------|
| `/api/cart` | GET | Get user's cart | Yes |
| `/api/cart/items` | POST | Add item to cart | Yes |
| `/api/cart/items/:id` | PATCH | Update cart item | Yes |
| `/api/cart/items/:id` | DELETE | Remove item from cart | Yes |

### Orders

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|--------------|
| `/api/orders` | GET | Get user's orders | Yes |
| `/api/orders/:id` | GET | Get a specific order | Yes |
| `/api/orders` | POST | Create a new order | Yes |
| `/api/orders/:id/status` | PATCH | Update order status | Yes (seller/admin) |

### Reviews

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|--------------|
| `/api/products/:id/reviews` | GET | Get product reviews | No |
| `/api/products/:id/reviews` | POST | Add a review | Yes |
| `/api/reviews/:id` | PATCH | Update a review | Yes (owner) |
| `/api/reviews/:id` | DELETE | Delete a review | Yes (owner/admin) |

## Frontend Components

### Pages

- **HomePage**: Landing page with featured products and categories
- **AuthPage**: User login and registration
- **ProductPage**: Detailed product information and reviews
- **CategoryPage**: Products filtered by category
- **CartPage**: Shopping cart management
- **CheckoutPage**: Order placement and payment
- **OrderPage**: Order details and history
- **DashboardPage**: Seller/Admin dashboard for product management

### Core Components

- **MainLayout**: Common layout with navigation and footer
- **Navigation**: Site navigation with user menu
- **ProductCard**: Card display for product listings
- **ProductDetail**: Detailed product information
- **CartItem**: Individual item in shopping cart
- **OrderSummary**: Order totals and checkout button
- **ReviewForm**: Form for submitting product reviews
- **CategoryFilter**: Filter products by category

## Backend Architecture

### Storage Layer

The application uses a storage abstraction layer that allows it to work with multiple database backends:

- **IStorage**: Interface defining all data operations
- **DbStorage**: PostgreSQL implementation of IStorage
- **MySqlStorage**: MySQL implementation of IStorage
- **MemStorage**: In-memory implementation of IStorage

This design allows the application to switch seamlessly between different storage backends without changing the business logic.

### Authentication System

- **Passport.js**: Handles user authentication
- **LocalStrategy**: Username/password authentication
- **Express-Session**: Manages user sessions
- **Bcrypt**: Secures passwords with hashing

### Request Handling

- **Express Router**: Routes HTTP requests to appropriate handlers
- **Middleware**: Handles authentication, error handling, and request preprocessing
- **Controllers**: Processes requests and returns responses
- **Validation**: Uses Zod schemas to validate request data

## Running the Application

### Environment Setup

1. Create a `.env` file with the following variables:
   ```
   DB_TYPE=postgres  # or mysql or auto
   SESSION_SECRET=your_session_secret
   
   # For MySQL (if using)
   MYSQL_DATABASE=ecommerce
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

### Default Users

The application comes with seed data that includes these users:

- **Admin**: Username: `admin`, Password: `admin123`
- **Seller**: Username: `seller`, Password: `seller123`
- **Customer**: Username: `testuser`, Password: `testtest`

## Development Notes

- Local development should use `localhost` instead of `0.0.0.0` in `server/index.ts` to avoid socket binding issues
- For MySQL connectivity, ensure your MySQL server is running and accessible
- The PostgreSQL database is automatically provisioned in the Replit environment
- TypeScript LSP may show errors in some files due to dynamic nature of the storage implementation

## Deployment

The application is designed to be deployed on Replit, which provides:

- Automatic PostgreSQL database provisioning
- Built-in CI/CD pipeline
- Always-on hosting
- Environment variable management

## License

MIT License