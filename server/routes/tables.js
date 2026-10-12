const express = require('express')
const router = express.Router()
const RestaurantTable = require('../models/RestaurantTable')
const Restaurant = require('../models/Restaurant')
const { body, param, query } = require('express-validator')
const authenticate = require('../middleware/auth')

// Get all tables for a restaurant
router.get('/', authenticate, async (req, res) => {
  try {
    const restaurantId = req.query.restaurantId || req.params.restaurantId || req.headers['x-restaurant-id']
    const filter = restaurantId ? { restaurant: restaurantId } : {}
    const tables = await RestaurantTable.find(filter)
    res.json({ success: true, count: tables.length, tables })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Get tables by restaurantId param
router.get('/:restaurantId', authenticate, async (req, res) => {
  try {
    const tables = await RestaurantTable.find({ restaurant: req.params.restaurantId })
    res.json({ success: true, count: tables.length, tables })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Create table
router.post(
  '/',
  authenticate,
  [body('name').notEmpty().withMessage('Table name/number is required'), body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1')],
  async (req, res) => {
    try {
      const { name, capacity } = req.body
      const restaurantId = req.body.restaurant || req.body.restaurantId || req.query.restaurantId || req.params.restaurantId || req.headers['x-restaurant-id']
      const restaurant = await Restaurant.findById(restaurantId)
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' })
      }

      const table = new RestaurantTable({
        name,
        capacity,
        restaurant: restaurant._id,
      })

      await table.save()
      res.status(201).json({ success: true, table })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Update table
router.patch(
  '/:tableId',
  authenticate,
  [param('tableId').isMongoId().withMessage('Invalid table ID')],
  async (req, res) => {
    try {
      const table = await RestaurantTable.findOneAndUpdate(
        { _id: req.params.tableId, restaurant: req.params.restaurantId },
        req.body,
        { new: true, runValidators: true }
      )
      if (!table) {
        return res.status(404).json({ success: false, message: 'Table not found' })
      }
      res.json({ success: true, table })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Delete table
router.delete(
  '/:tableId',
  authenticate,
  [param('tableId').isMongoId().withMessage('Invalid table ID')],
  async (req, res) => {
    try {
      const table = await RestaurantTable.findOneAndDelete({
        _id: req.params.tableId,
        restaurant: req.params.restaurantId,
      })
      if (!table) {
        return res.status(404).json({ success: false, message: 'Table not found' })
      }
      res.json({ success: true, message: 'Table deleted successfully' })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Assign order to table
router.patch(
  '/:tableId/assign-order',
  authenticate,
  [param('tableId').isMongoId().withMessage('Invalid table ID')],
  async (req, res) => {
    try {
      const { orderId } = req.body
      const table = await RestaurantTable.findById(req.params.tableId)
      const order = await Order.findById(orderId)

      if (!table || !order) {
        return res.status(404).json({ success: false, message: 'Table or order not found' })
      }

      // Check if table already has an order
      if (table.currentOrder) {
        return res.status(400).json({ success: false, message: 'Table already has an active order' })
      }

      // Check if order is already assigned to another table
      if (order.table) {
        return res.status(400).json({ success: false, message: 'Order already assigned to a table' })
      }

      // Assign order to table
      await RestaurantTable.findByIdAndUpdate(req.params.tableId, {
        currentOrder: orderId,
        status: 'occupied',
      })

      // Update order with table
      await Order.findByIdAndUpdate(orderId, { table: req.params.tableId })

      res.json({ success: true, table, order })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Remove order from table
router.patch(
  '/:tableId/remove-order',
  authenticate,
  [param('tableId').isMongoId().withMessage('Invalid table ID')],
  async (req, res) => {
    try {
      const table = await RestaurantTable.findByIdAndUpdate(
        req.params.tableId,
        { currentOrder: null, status: 'available' },
        { new: true }
      )
      if (!table) {
        return res.status(404).json({ success: false, message: 'Table not found' })
      }
      res.json({ success: true, table })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

module.exports = router