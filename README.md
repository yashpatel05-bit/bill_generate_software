# BILLU - Multi-Restaurant Billing & Order Management System

## Overview

BILLU is a complete, production-oriented MERN stack web application for multi-restaurant billing, order management, and restaurant administration. The system is designed for admin-only access with full CRUD operations, billing functionality, and comprehensive reporting.

## Architecture

### Technology Stack

**Frontend:**
- React.js with Vite
- Tailwind CSS with custom CSS
- Framer Motion for animations
- React Router for routing
- Axios for API communication
- Lucide React for icons
- Recharts for data visualization

**Backend:**
- Node.js and Express.js
- MongoDB with Mongoose
- JWT-based authentication with bcrypt password hashing
- Zod for request validation
- Helmet and CORS security headers
- Express rate limiting

### Project Structure

```
billu/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context (Auth, Restaurant)
│   │   ├── layout/      # Layout components (Sidebar, DashboardLayout)
│   │   ├── App.jsx      # Main application component
│   │   └── main.jsx     # Entry point
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── server/              # Node.js/Express backend
│   ├── index.js         # Entry point
│   ├── config/          # Configuration files
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   ├── scripts/         # Seed scripts
│   ├── package.json
│   └── .env.example
└── README.md
```

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- npm or yarn

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/billu.git
cd billu
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Install frontend dependencies

```bash
cd ../client
npm install
```

### 3. Configure environment variables

Create a `.env` file in the `server` directory:

```
MONGODB_URI=mongodb://127.0.0.1:27017/billu
JWT_SECRET=your-secure-jwt-secret-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
BCRYPT_SALT_ROUNDS=12
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

Create a `.env` file in the `client` directory (or it will inherit from the server):

```
VITE_API_URL=http://localhost:5000
```

### 4. Start MongoDB

Ensure MongoDB is running:

```bash
mongod --dbpath ./data
```

### 5. Seed the database

```bash
cd server
npm run seed
```

This will create:
- Admin user: `admin@billor.com` / `admin123`
- 6 demonstration restaurants with menus, categories, and tables

### 6. Start the development servers

```bash
# Start the backend
cd server
npm run start

# Start the frontend
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/auth/me` | Get admin profile |
| POST | `/api/auth/logout` | Admin logout |

### Restaurants

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/restaurants` | Get all restaurants |
| GET | `/api/restaurants/:id` | Get single restaurant |
| POST | `/api/restaurants` | Create restaurant |
| PATCH | `/api/restaurants/:id` | Update restaurant |
| PATCH | `/api/restaurants/:id/toggle-status` | Activate/deactivate restaurant |
| DELETE | `/api/restaurants/:id` | Delete restaurant |

### Menu

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu/:restaurantId/categories` | Get all categories |
| POST | `/api/menu/:restaurantId/categories` | Create category |
| GET | `/api/menu/:restaurantId/menu` | Get all menu items |
| POST | `/api/menu/:restaurantId/menu` | Create menu item |
| PATCH | `/api/menu/:restaurantId/menu/:itemId` | Update menu item |
| DELETE | `/api/menu/:restaurantId/menu/:itemId` | Delete menu item |
| PATCH | `/api/menu/:restaurantId/menu/:itemId/toggle-availability` | Toggle availability |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all orders |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/:orderId` | Get single order |
| PATCH | `/api/orders/:orderId` | Update order |
| PATCH | `/api/orders/:orderId/status` | Update order status |
| PATCH | `/api/orders/:orderId/cancel` | Cancel order |

### Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/invoices/:restaurantId` | Generate invoice |
| GET | `/api/invoices` | Get all invoices |
| GET | `/api/invoices/:invoiceId` | Get single invoice |
| GET | `/api/invoices/:invoiceId/pdf` | Download PDF |

### Tables

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tables/:restaurantId` | Get all tables |
| POST | `/api/tables` | Create table |
| PATCH | `/api/tables/:tableId` | Update table |
| DELETE | `/api/tables/:tableId` | Delete table |
| PATCH | `/api/tables/:tableId/assign-order` | Assign order to table |

### Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers/:restaurantId` | Get all customers |
| POST | `/api/customers` | Create customer |
| GET | `/api/customers/:customerId` | Get single customer |
| PATCH | `/api/customers/:customerId` | Update customer |

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/:restaurantId` | Get all inventory items |
| POST | `/api/inventory` | Create inventory item |
| POST | `/api/inventory/:itemId/purchase` | Record stock purchase |
| POST | `/api/inventory/:itemId/adjustment` | Record stock adjustment |
| GET | `/api/inventory/alerts/low-stock` | Get low stock alerts |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/daily` | Daily sales report |
| GET | `/api/reports/restaurant/revenue` | Restaurant-wise revenue |
| GET | `/api/reports/dish-wise` | Dish-wise report |

## Admin Credentials

**Development:**
- Email: `admin@billor.com`
- Password: `admin123`

**Note:** These credentials are for development only. In production, create a new admin account and secure the password.

## Core Features

### Authentication

- JWT-based authentication with secure HTTP-only cookies
- Bcrypt password hashing
- Rate-limited login endpoint (5 attempts per 15 minutes)
- Protected routes with middleware authorization
- Session expiration and logout functionality

### Restaurant Management

- Create, view, edit, activate/deactivate, and delete restaurants
- Each restaurant supports configurable branding:
  - Logo, primary/secondary colors
  - Display name, address, phone, GSTIN
  - Invoice footer, currency
  - Tax configuration (CGST/SGST rates)
- Search and filtering support

### Menu & Food Management

- Complete CRUD for menu categories and items
- Each food item supports:
  - Name, description, image, SKU
  - Selling price, cost price
  - Availability status, vegetarian indicator
  - Preparation time, stock tracking
  - Restaurant association with data isolation

### Order Management

- Order types: dine-in, takeaway, delivery
- Order statuses: pending, confirmed, preparing, ready, completed, cancelled
- Payment statuses: unpaid, partially_paid, paid, refunded
- Table assignment for dine-in orders
- Item validation (items must belong to the restaurant)
- Automatic subtotal, CGST, SGST, and total calculation

### Bill Generation

**Billing Workflow:**
1. Select existing order or create new order
2. Enter customer name and optional phone number
3. Select order type (dine-in, takeaway, delivery)
4. Select table when applicable
5. Search and add food items
6. Set quantities using plus/minus controls
7. Automatic calculation of subtotal, taxes, discount, and final amount
8. Select payment method
9. Generate and save the invoice

**Invoice Format:**
- Restaurant logo and name
- Address and contact information
- GSTIN (if configured)
- Invoice number and order number
- Invoice date and time
- Customer name and phone number
- Order type and table number
- Itemized food list with quantity and unit price
- Line totals
- Subtotal, CGST (2.5%), SGST (2.5%)
- Discount (if applicable)
- Final payable amount
- Payment method and status
- Amount paid and balance due
- Thank-you message and configurable footer

**Tax Calculation:**
- CGST: 2.5% of taxable subtotal
- SGST: 2.5% of taxable subtotal
- Final Total = Taxable Subtotal + CGST + SGST - Discount
- Rates are configurable per restaurant

### Invoice Numbering

- Unique invoice numbers per restaurant using atomic sequence mechanism
- Format: `{restaurant_prefix}-{sequence_number}`
- Example: `TP-2026-000001`, `BD-2026-000001`

### Billing History

- Search by invoice number, order number, or customer
- Filter by date range, payment status, order type
- Sort by date and amount
- Open invoice details
- Reprint invoice
- Download PDF
- Export to CSV

### PDF Generation and Printing

- Downloadable PDF with restaurant logo and currency formatting
- Meaningful filename (e.g., `TP-2026-000001.pdf`)
- Print stylesheet hiding UI elements
- A4 paper support with compact receipt layout
- Print only the invoice, hiding sidebar and navigation

### Inventory Management

- Track stock levels per restaurant
- Record stock purchases and adjustments
- Low-stock alerts
- Stock movement history
- Transactional stock deduction when orders are finalized

### Customer Management

- Store customer name, phone, email
- Order history and total spending
- Last visit tracking
- Reuse customer details for new orders

### Reports & Analytics

- Daily sales report
- Weekly and monthly sales
- Restaurant-wise revenue
- Order count and average order value
- Best-selling food items
- Sales by order type
- Payment method breakdown
- Tax collection summary
- Outstanding balances
- Cancelled orders
- Filters by date range, month, year, category
- Export to CSV/PDF

### Security

- Password hashing with bcrypt
- Protected routes with JWT authentication
- Server-side authorization validation
- Input validation and sanitization with Zod
- Rate-limited login endpoint
- Helmet security headers
- Secure CORS configuration
- Environment-based secrets
- Centralized error handling
- MongoDB injection protection
- Request size limits
- Audit logging for administrative actions
- Duplicate request protection for bill finalization

## Development Workflow

```bash
# Installation
npm install

# Seed the database
npm run seed

# Start development
npm run dev

# The command above starts both frontend (Vite) and backend (Express)
# Frontend runs on http://localhost:5173
# Backend runs on http://localhost:5000
```

## Deployment

### Production Build

```bash
# Build frontend
cd client
npm run build

# The backend serves the built frontend automatically
# Start the server
cd server
npm run start
```

### Production Environment Variables

Set the following environment variables for production:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=production-jwt-secret
NODE_ENV=production
CORS_ORIGIN=your_production_domain
```

### MongoDB Production Considerations

- Use a MongoDB Atlas cluster or self-hosted replica set
- Enable authentication and authorization
- Configure appropriate network access
- Set up regular backups
- Consider using MongoDB transactions for atomic workflows (order finalization, invoice generation, payment recording)

## Screen Descriptions

### Admin Login

Professional login screen with BILLU logo, cartoon mascot, smooth animations, and modern design. Credentials are authenticated through the backend.

### Main Dashboard

After login, display the main BILLU dashboard with:
- Total restaurants, today's orders, today's sales
- Pending and completed orders
- Today's bills generated
- Recent transactions
- Sales overview chart
- Popular food items
- Quick actions
- Restaurant overview

### Restaurant Cards

Each restaurant appears as an attractive card with:
- Restaurant logo or image
- Restaurant name and cuisine/category
- Location
- Open/closed status
- Today's order count and revenue
- Total menu items
- Prominent "Visit Dashboard" button
- Overflow menu for Edit, Activate/Deactivate, and Delete

### Restaurant Dashboard

Dedicated dashboard for each restaurant with:
- Restaurant logo and name
- Today's sales, active orders, available tables
- Pending bills, recent orders, popular menu items
- Quick bill-generation action
- Restaurant-specific navigation: Overview, Manage Menu, Categories, Orders, Tables, Generate Bill, Billing History, Inventory, Customers, Reports, Restaurant Settings

### Bill Generation Screen

The main billing module with:
- Order selection/creation
- Customer information input
- Order type and table selection
- Food item search and addition
- Quantity controls (plus/minus)
- Automatic subtotal, tax, and total calculation
- Payment method selection
- Invoice generation and save
- Print and PDF download options

### Billing History

Display invoices with:
- Invoice number, order number, customer name
- Invoice date, subtotal, CGST, SGST, discount
- Final amount, payment method, payment status
- Search by invoice/order/customer
- Filter by date range, payment status, order type
- Sort by date and amount
- Reprint and download PDF
- Export to CSV

## License

This project is for educational and development purposes. 

## Contact

For support or questions, please refer to the issue tracker or contact the development team.