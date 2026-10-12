const express = require('express')
const router = express.Router()
const Order = require('../models/Order')
const Invoice = require('../models/Invoice')
const MenuItem = require('../models/MenuItem')
const Restaurant = require('../models/Restaurant')
const { body, param, query } = require('express-validator')
const authenticate = require('../middleware/auth')

// Get daily sales report
router.get('/daily', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, restaurantId } = req.query
    const rId = restaurantId || req.headers['x-restaurant-id'] || req.restaurantId
    let filter = {}
    if (rId) filter.restaurant = rId

    if (startDate) filter.createdAt = { $gte: new Date(startDate) }
    if (endDate) {
      if (!filter.createdAt) filter.createdAt = {}
      filter.createdAt.$lte = new Date(endDate)
    }

    // Get invoices and orders within date range
    const invoices = await Invoice.find(filter).sort({ createdAt: -1 })
    const orders = await Order.find(filter).sort({ createdAt: -1 })

    // Prefer invoices if present, otherwise orders
    let revenue = 0
    let taxCollected = 0
    let count = 0

    if (invoices.length > 0) {
      revenue = invoices.reduce((total, inv) => total + (inv.total || 0), 0)
      taxCollected = invoices.reduce((total, inv) => total + ((inv.cgst || 0) + (inv.sgst || 0)), 0)
      count = invoices.length
    } else {
      revenue = orders.reduce((total, ord) => total + (ord.total || 0), 0)
      taxCollected = orders.reduce((total, ord) => total + ((ord.cgst || 0) + (ord.sgst || 0)), 0)
      count = orders.length
    }

    res.json({
      success: true,
      data: {
        orders,
        invoices,
        revenue,
        taxCollected,
        orderCount: count,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Get restaurant-wise revenue report
router.get('/restaurant/revenue', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    let filter = {}

    if (startDate) filter.createdAt = { $gte: new Date(startDate) }
    if (endDate) {
      if (!filter.createdAt) filter.createdAt = {}
      filter.createdAt.$lte = new Date(endDate)
    }

    const invoices = await Invoice.find(filter).populate('restaurant', 'name slug').sort({ createdAt: -1 })

    const revenue = invoices.reduce((total, invoice) => {
      return total + (invoice.total || 0)
    }, 0)

    res.json({
      success: true,
      data: {
        invoices,
        revenue,
        invoiceCount: invoices.length,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Get dish-wise report
router.get('/dish-wise', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, restaurantId } = req.query
    const rId = restaurantId || req.headers['x-restaurant-id'] || req.restaurantId
    let filter = {}
    if (rId) filter.restaurant = rId

    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) filter.createdAt.$gte = new Date(startDate)
      if (endDate) filter.createdAt.$lte = new Date(endDate)
    }

    const orders = await Order.find(filter)
    const invoices = await Invoice.find(filter)
    const dishMap = {}

    const processItems = (items) => {
      if (Array.isArray(items)) {
        for (const item of items) {
          const name = item.name || 'Unknown item'
          if (!dishMap[name]) {
            dishMap[name] = { name, revenue: 0, quantity: 0 }
          }
          dishMap[name].quantity += item.quantity || 1
          dishMap[name].revenue += (item.total || (item.quantity * (item.priceAtInvoice || item.priceAtOrder || 0)) || 0)
        }
      }
    }

    for (const order of orders) {
      processItems(order.items)
    }
    for (const inv of invoices) {
      processItems(inv.items)
    }

    const data = Object.values(dishMap).sort((a, b) => b.revenue - a.revenue)

    res.json({
      success: true,
      data,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router