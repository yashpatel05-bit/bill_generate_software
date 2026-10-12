const express = require('express')
const router = express.Router()
const MenuCategory = require('../models/MenuCategory')
const MenuItem = require('../models/MenuItem')
const Restaurant = require('../models/Restaurant')
const { body, param, query } = require('express-validator')
const authenticate = require('../middleware/auth')

// Get all categories for a restaurant
router.get('/:restaurantId/categories', authenticate, async (req, res) => {
  try {
    const categories = await MenuCategory.find({ restaurant: req.params.restaurantId }).sort({ sortOrder: 1 })
    res.json({ success: true, count: categories.length, categories })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Create category
router.post(
  '/:restaurantId/categories',
  authenticate,
  [body('name').notEmpty().withMessage('Category name is required')],
  async (req, res) => {
    try {
      const { name } = req.body
      const restaurant = await Restaurant.findById(req.params.restaurantId)
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' })
      }

      const slug = name.toLowerCase().replace(/[\s]+/g, '-').replace(/[^a-z0-9-]/g, '')

      const category = new MenuCategory({
        name,
        slug,
        restaurant: req.params.restaurantId,
      })

      await category.save()
      res.status(201).json({ success: true, category })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Get all menu items for a restaurant
router.get('/:restaurantId/menu', authenticate, async (req, res) => {
  try {
    const { category, search, availability, sortBy, sortOrder } = req.query
    let filter = { restaurant: req.params.restaurantId }

    if (category) {
      filter.category = category
    }
    if (availability !== undefined) {
      filter.availability = availability === 'true'
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' }
    }

    let sort = { createdAt: -1 }
    if (sortBy) {
      sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }
    }

    const items = await MenuItem.find(filter).sort(sort)
    res.json({ success: true, count: items.length, items })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Create menu item
router.post(
  '/:restaurantId/menu',
  authenticate,
  [
    body('name').notEmpty().withMessage('Food name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').optional().isMongoId().withMessage('Invalid category ID'),
  ],
  async (req, res) => {
    try {
      const { name, description, price, category, sku, isVegetarian, preparationTime } = req.body
      const restaurant = await Restaurant.findById(req.params.restaurantId)
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' })
      }

      const item = new MenuItem({
        name,
        description,
        sellingPrice: price,
        restaurant: req.params.restaurantId,
        category: category || null,
        sku,
        isVegetarian: isVegetarian === true,
        preparationTime: preparationTime || 0,
      })

      await item.save()
      res.status(201).json({ success: true, item })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Edit menu item
router.patch(
  '/:restaurantId/menu/:itemId',
  authenticate,
  [
    param('itemId').isMongoId().withMessage('Invalid item ID'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  ],
  async (req, res) => {
    try {
      const item = await MenuItem.findOneAndUpdate(
        { _id: req.params.itemId, restaurant: req.params.restaurantId },
        req.body,
        { new: true, runValidators: true }
      )
      if (!item) {
        return res.status(404).json({ success: false, message: 'Menu item not found' })
      }
      res.json({ success: true, item })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Delete menu item
router.delete(
  '/:restaurantId/menu/:itemId',
  authenticate,
  [param('itemId').isMongoId().withMessage('Invalid item ID')],
  async (req, res) => {
    try {
      const item = await MenuItem.findOneAndDelete({
        _id: req.params.itemId,
        restaurant: req.params.restaurantId,
      })
      if (!item) {
        return res.status(404).json({ success: false, message: 'Menu item not found' })
      }
      res.json({ success: true, message: 'Menu item deleted successfully' })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Toggle availability
router.patch(
  '/:restaurantId/menu/:itemId/toggle-availability',
  authenticate,
  [param('itemId').isMongoId().withMessage('Invalid item ID')],
  async (req, res) => {
    try {
      const item = await MenuItem.findOneAndUpdate(
        { _id: req.params.itemId, restaurant: req.params.restaurantId },
        { availability: !item.availability },
        { new: true }
      )
      if (!item) {
        return res.status(404).json({ success: false, message: 'Menu item not found' })
      }
      res.json({ success: true, item })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Get single menu item
router.get('/:restaurantId/menu/:itemId', authenticate, async (req, res) => {
  try {
    const item = await MenuItem.findOne({
      _id: req.params.itemId,
      restaurant: req.params.restaurantId,
    })
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' })
    }
    res.json({ success: true, item })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router