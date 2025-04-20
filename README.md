# E-Commerce Platform

A simplified Amazon-like e-commerce platform with user authentication, product management, order processing, and review system.

## Features

- Multiple user roles (customer, seller, admin)
- Product listing and management
- Shopping cart functionality
- Order processing and management
- Rating and review system
- Category management

## Database Configuration

This application supports multiple database backends with automatic fallback mechanisms:

### Database Configuration Options

You can configure the database type in the `.env` file:

```
# Database selection - options: 'mysql', 'postgres', or 'auto'
DB_TYPE=auto
```

- `mysql`: Use MySQL as the primary database
- `postgres`: Use PostgreSQL as the primary database
- `auto`: Automatic detection with fallback (PostgreSQL first, then MySQL, then in-memory)

### MySQL Configuration

If using MySQL, configure the following environment variables:

```
MYSQL_DATABASE=ecommerce
MYSQL_USER=root
MYSQL_PASSWORD=yourpassword
MYSQL_HOST=localhost
MYSQL_PORT=3306
```

### PostgreSQL Configuration

PostgreSQL is automatically configured in the Replit environment via the `DATABASE_URL` environment variable.

### Fallback Mechanism

The application has a built-in fallback system:

1. If the configured database (MySQL or PostgreSQL) is unavailable, it will attempt to use the other database type
2. If neither database is available, it will fall back to an in-memory storage solution
3. This ensures the application remains functional even when database connections fail

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## Technologies Used

- Node.js
- Express
- React
- Drizzle ORM
- PostgreSQL
- MySQL
- TypeScript
- Tailwind CSS