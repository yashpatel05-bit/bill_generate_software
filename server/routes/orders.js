const express = require('express')
const router = express.Router()
const Order = require('../models/Order')
const Restaurant = require('../models/Restaurant')
const MenuItem = require('../models/MenuItem')
const { body, param } = require('express-validator')
const authenticate = require('../middleware/auth')

// Get all orders for a restaurant
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, paymentStatus, orderType, search, startDate, endDate, restaurantId } = req.query
    const rId = restaurantId || req.headers['x-restaurant-id'] || req.restaurantId
    let filter = {}
    if (rId) filter.restaurant = rId

    if (status) filter.status = status
    if (paymentStatus) filter.paymentStatus = paymentStatus
    if (orderType) filter.orderType = orderType
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ]
    }
    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) filter.createdAt.$gte = new Date(startDate)
      if (endDate) filter.createdAt.$lte = new Date(endDate)
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, count: orders.length, orders })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Create order
router.post(
  '/',
  authenticate,
  async (req, res) => {
    try {
      const { customerName, customerPhone, orderType, table, items, notes } = req.body

      // Find restaurant
      const restaurant = await Restaurant.findById(req.restaurantId)
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' })
      }

      // Validate all menu items belong to this restaurant
      if (items && items.length > 0) {
        const menuItemIds = items.map((item) => item.menuItem)
        const menuItems = await MenuItem.find({
          _id: { $in: menuItemIds },
          restaurant: restaurant._id,
        })

        const validIds = new Set(menuItems.map((m) => m._id.toString()))
        for (const item of items) {
          if (!validIds.has(item.menuItem.toString())) {
            return res.status(400).json({
              success: false,
              message: `Menu item ${item.menuItem} does not belong to this restaurant`,
            })
          }
        }

        // Validate each item has required fields
        for (const item of items) {
          if (!item.menuItem || item.quantity <= 0 || item.priceAtOrder <= 0) {
            return res.status(400).json({
              success: false,
              message: 'Invalid item data',
            })
          }
        }
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

      const order = new Order({
        restaurant: restaurant._id,
        orderNumber,
        customerName,
        customerPhone,
        orderType,
        table: table || null,
        items,
        status: 'pending',
        paymentStatus: 'unpaid',
      })

      await order.save()

      // Update table status if dine-in
      if (orderType === 'dine-in' && table) {
        await RestaurantTable.findByIdAndUpdate(table, { status: 'occupied' })
      }

      res.status(201).json({ success: true, order })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Get single order
router.get('/:orderId', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }
    // Check restaurant access
    if (order.restaurant.toString() !== req.restaurantId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' })
    }
    res.json({ success: true, order })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Update order
router.patch(
  '/:orderId',
  authenticate,
  [param('orderId').isMongoId().withMessage('Invalid order ID')],
  async (req, res) => {
    try {
      const order = await Order.findOneAndUpdate(
        { _id: req.params.orderId, restaurant: req.restaurantId },
        req.body,
        { new: true, runValidators: true }
      )
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' })
      }
      res.json({ success: true, order })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Update order status
router.patch(
  '/:orderId/status',
  authenticate,
  [param('orderId').isMongoId().withMessage('Invalid order ID')],
  async (req, res) => {
    try {
      const { status } = req.body
      const validStatuses = [
        'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled',
      ]
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' })
      }

      const order = await Order.findOneAndUpdate(
        { _id: req.params.orderId, restaurant: req.restaurantId },
        { status },
        { new: true, runValidators: true }
      )
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' })
      }

      // If order is completed, mark table as available
      if (status === 'completed' && order.table) {
        await RestaurantTable.findByIdAndUpdate(order.table, { status: 'available' })
      }

      res.json({ success: true, order })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Cancel order
router.patch(
  '/:orderId/cancel',
  authenticate,
  [param('orderId').isMongoId().withMessage('Invalid order ID')],
  async (req, res) => {
    try {
      const order = await Order.findOneAndUpdate(
        { _id: req.params.orderId, restaurant: req.restaurantId },
        { status: 'cancelled' },
        { new: true, runValidators: true }
      )
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' })
      }

      // Mark table as available if dine-in
      if (order.table) {
        await RestaurantTable.findByIdAndUpdate(order.table, { status: 'available' })
      }

      res.json({ success: true, order })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Get today's orders count
router.get('/today/count', authenticate, async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const count = await Order.countDocuments({
      restaurant: req.restaurantId,
      createdAt: { $gte: today, $lt: tomorrow },
    })

    res.json({ success: true, count })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router