const express = require('express')
const router = express.Router()
const InventoryItem = require('../models/InventoryItem')
const StockMovement = require('../models/StockMovement')
const Restaurant = require('../models/Restaurant')
const { body, param, query } = require('express-validator')
const authenticate = require('../middleware/auth')

// Get all inventory items for a restaurant
router.get('/', authenticate, async (req, res) => {
  try {
    const { lowStockOnly } = req.query
    const restaurantId = req.query.restaurantId || req.params.restaurantId || req.headers['x-restaurant-id']
    let filter = restaurantId ? { restaurant: restaurantId } : {}

    if (lowStockOnly === 'true') {
      filter.$expr = { $lte: ['$currentStock', '$minStockThreshold'] }
    }

    const items = await InventoryItem.find(filter).sort({ name: 1 })
    res.json({ success: true, count: items.length, items })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Create inventory item
router.post(
  '/',
  authenticate,
  [
    body('name').notEmpty().withMessage('Item name is required'),
    body('unit').notEmpty().withMessage('Unit of measurement is required'),
    body('currentStock').optional().isInt({ min: 0 }).withMessage('Stock must be a positive number'),
    body('minStockThreshold').optional().isInt({ min: 0 }).withMessage('Minimum stock must be a positive number'),
    body('costPrice').optional().isFloat({ min: 0 }).withMessage('Cost price must be a positive number'),
  ],
  async (req, res) => {
    try {
      const { name, unit, currentStock, minStockThreshold, costPrice, supplier } = req.body
      const restaurantId = req.body.restaurant || req.body.restaurantId || req.query.restaurantId || req.params.restaurantId || req.headers['x-restaurant-id']
      const restaurant = await Restaurant.findById(restaurantId)
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' })
      }

      const item = new InventoryItem({
        restaurant: restaurant._id,
        name,
        unit,
        currentStock: currentStock || 0,
        minStockThreshold: minStockThreshold || 5,
        costPrice: costPrice || 0,
        supplier: supplier || '',
      })

      await item.save()
      res.status(201).json({ success: true, item })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Record stock purchase
router.post(
  '/:itemId/purchase',
  authenticate,
  [body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'), body('unitCost').optional().isFloat({ min: 0 })],
  async (req, res) => {
    try {
      const { quantity, unitCost } = req.body
      const item = await InventoryItem.findOne({
        _id: req.params.itemId,
        restaurant: req.params.restaurantId,
      })
      if (!item) {
        return res.status(404).json({ success: false, message: 'Inventory item not found' })
      }

      const previousStock = item.currentStock
      item.currentStock += quantity
      await item.save()

      // Record stock movement
      const movement = new StockMovement({
        restaurant: req.params.restaurantId,
        menuItem: item._id,
        itemName: item.name,
        type: 'purchase',
        quantity,
        unitCost: unitCost || item.costPrice,
        previousStock,
        newStock: item.currentStock,
      })

      await movement.save()

      res.json({ success: true, item, movement })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Record stock adjustment
router.post(
  '/:itemId/adjustment',
  authenticate,
  [
    body('quantity').isInt({ min: 1 }).withMessage('Adjustment quantity must be at least 1'),
    body('type').isIn(['increase', 'decrease']).withMessage('Type must be increase or decrease'),
  ],
  async (req, res) => {
    try {
      const { quantity, type } = req.body
      const item = await InventoryItem.findOne({
        _id: req.params.itemId,
        restaurant: req.params.restaurantId,
      })
      if (!item) {
        return res.status(404).json({ success: false, message: 'Inventory item not found' })
      }

      const previousStock = item.currentStock

      if (type === 'increase') {
        item.currentStock += quantity
      } else if (type === 'decrease') {
        item.currentStock = Math.max(0, item.currentStock - quantity)
      }

      await item.save()

      // Record stock movement
      const movement = new StockMovement({
        restaurant: req.params.restaurantId,
        menuItem: item._id,
        itemName: item.name,
        type: 'adjustment',
        quantity: type === 'decrease' ? -quantity : quantity,
        previousStock,
        newStock: item.currentStock,
      })

      await movement.save()

      res.json({ success: true, item, movement })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Get low stock alerts
router.get('/alerts/low-stock', authenticate, async (req, res) => {
  try {
    const items = await InventoryItem.find({
      restaurant: req.params.restaurantId,
      currentStock: { $lte: '$minStockThreshold' },
    })
    res.json({ success: true, count: items.length, items })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router