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
│   └── seed-data.ts        # Database seeding script
│
├── .env                    # Environment variables
├── drizzle.config.ts       # Drizzle ORM configuration
├── package.json            # Project dependencies
└── tsconfig.json           # TypeScript configuration
```

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