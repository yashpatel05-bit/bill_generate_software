require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const helmet = require('helmet')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')
const authRoutes = require('./routes/auth')
const restaurantRoutes = require('./routes/restaurants')
const menuRoutes = require('./routes/menu')
const orderRoutes = require('./routes/orders')
const invoiceRoutes = require('./routes/invoices')
const tableRoutes = require('./routes/tables')
const customerRoutes = require('./routes/customers')
const inventoryRoutes = require('./routes/inventory')
const reportRoutes = require('./routes/reports')
const premiumPlanRoutes = require('./routes/premiumPlans')
const errorHandler = require('./middleware/errorHandler')

const app = express()

// Security middleware
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }))
app.use(cookieParser())
app.use(express.json({ limit: '10kb' }))

// Rate limiting
const limiter = rateLimit({ windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000), max: Number(process.env.RATE_LIMIT_MAX || 100) })
app.use('/api/', limiter)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/restaurants', restaurantRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/tables', tableRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/premium-plans', premiumPlanRoutes)

// Database connection
const connectDB = require('./config/db')
connectDB()

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }))

// Error handler
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))