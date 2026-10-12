const express = require('express')
const router = express.Router()
const Restaurant = require('../models/Restaurant')
const MenuItem = require('../models/MenuItem')
const Order = require('../models/Order')
const Invoice = require('../models/Invoice')
const { body, param, query } = require('express-validator')
const authenticate = require('../middleware/auth')

// Get all restaurants
router.get('/', authenticate, async (req, res) => {
  try {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const restaurants = await Restaurant.find().sort({ createdAt: -1 })

    const enriched = await Promise.all(
      restaurants.map(async (r) => {
        const [menuCount, todayOrders, todayInvoices] = await Promise.all([
          MenuItem.countDocuments({ restaurant: r._id }),
          Order.countDocuments({ restaurant: r._id, createdAt: { $gte: startOfDay } }),
          Invoice.find({ restaurant: r._id, createdAt: { $gte: startOfDay } }),
        ])
        const todayRevenue = todayInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
        return {
          ...r.toObject(),
          menuItemCount: menuCount,
          todayOrderCount: todayOrders || todayInvoices.length,
          todayRevenue: todayRevenue,
        }
      })
    )
    res.json({ success: true, count: enriched.length, restaurants: enriched })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Search restaurants
router.get('/search', authenticate, [query('q').optional().trim()], async (req, res) => {
  try {
    const query = {}
    if (req.query.q) {
      query.name = { $regex: req.query.q, $options: 'i' }
    }
    const restaurants = await Restaurant.find(query)
    res.json({ success: true, count: restaurants.length, restaurants })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Get single restaurant
router.get('/:id', authenticate, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' })
    }
    res.json({ success: true, restaurant })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Create restaurant
router.post(
  '/',
  authenticate,
  [body('name').notEmpty().withMessage('Restaurant name is required')],
  async (req, res) => {
    try {
      const { name, cuisine, address, phone, gstin, currency, logo, primaryColor, secondaryColor, invoiceFooter, taxConfiguration } = req.body

      const restaurant = new Restaurant({
        name,
        slug: name.toLowerCase().replace(/[\s]+/g, '-').replace(/[^a-z0-9-]/g, ''),
        cuisine,
        address,
        phone,
        gstin,
        currency,
        logo,
        primaryColor,
        secondaryColor,
        invoiceFooter,
        taxConfiguration,
        createdBy: req.admin.id,
      })

      await restaurant.save()
      res.status(201).json({ success: true, restaurant })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Edit restaurant
router.patch(
  '/:id',
  authenticate,
  [param('id').isMongoId().withMessage('Invalid restaurant ID')],
  async (req, res) => {
    try {
      const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      })
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' })
      }
      res.json({ success: true, restaurant })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Activate/Deactivate restaurant
router.patch(
  '/:id/toggle-status',
  authenticate,
  [param('id').isMongoId().withMessage('Invalid restaurant ID')],
  async (req, res) => {
    try {
      const restaurant = await Restaurant.findById(req.params.id)
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' })
      }
      restaurant.status = restaurant.status === 'open' ? 'closed' : 'open'
      await restaurant.save()
      res.json({ success: true, restaurant })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Delete restaurant
router.delete(
  '/:id',
  authenticate,
  [param('id').isMongoId().withMessage('Invalid restaurant ID')],
  async (req, res) => {
    try {
      const restaurant = await Restaurant.findByIdAndDelete(req.params.id)
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' })
      }
      res.json({ success: true, message: 'Restaurant deleted successfully' })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Get branches of a restaurant
router.get(
  '/:id/branches',
  authenticate,
  [param('id').isMongoId().withMessage('Invalid restaurant ID')],
  async (req, res) => {
    try {
      const restaurant = await Restaurant.findById(req.params.id)
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' })
      }
      res.json({ success: true, branches: restaurant.branches || [] })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Add branch to a restaurant
router.post(
  '/:id/branches',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid restaurant ID'),
    body('name').notEmpty().withMessage('Branch name is required'),
  ],
  async (req, res) => {
    try {
      const restaurant = await Restaurant.findById(req.params.id)
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' })
      }

      const { name, address, phone, isMain } = req.body

      if (!restaurant.branches) {
        restaurant.branches = []
      }

      // If marked as main, unmark existing main branches
      if (isMain) {
        restaurant.branches.forEach((b) => {
          b.isMain = false
        })
      }

      const newBranch = {
        name: name.trim(),
        address: address ? address.trim() : '',
        phone: phone ? phone.trim() : '',
        isMain: isMain === true || restaurant.branches.length === 0,
      }

      restaurant.branches.push(newBranch)
      await restaurant.save()

      res.status(201).json({
        success: true,
        message: 'Branch added successfully',
        branch: restaurant.branches[restaurant.branches.length - 1],
        branches: restaurant.branches,
        restaurant,
      })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Delete branch from a restaurant
router.delete(
  '/:id/branches/:branchId',
  authenticate,
  [param('id').isMongoId().withMessage('Invalid restaurant ID')],
  async (req, res) => {
    try {
      const restaurant = await Restaurant.findById(req.params.id)
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' })
      }

      restaurant.branches = restaurant.branches.filter(
        (b) => b._id.toString() !== req.params.branchId && b.name !== req.params.branchId
      )

      await restaurant.save()
      res.json({
        success: true,
        message: 'Branch deleted successfully',
        branches: restaurant.branches,
        restaurant,
      })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Get subscriptions for a restaurant
router.get(
  '/:id/subscriptions',
  authenticate,
  [param('id').isMongoId().withMessage('Invalid restaurant ID')],
  async (req, res) => {
    try {
      const restaurant = await Restaurant.findById(req.params.id)
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' })
      }
      res.json({
        success: true,
        subscriptions: restaurant.subscriptions || [],
        isAdmin: true, // Logged in user is system admin - all features are totally free for admin
      })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Activate/Purchase a premium subscription for a restaurant
router.post(
  '/:id/subscriptions',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid restaurant ID'),
    body('featureKey').notEmpty().withMessage('Feature key is required'),
  ],
  async (req, res) => {
    try {
      const restaurant = await Restaurant.findById(req.params.id)
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' })
      }

      const { featureKey, planName, price, billingCycleMonths } = req.body

      if (!restaurant.subscriptions) {
        restaurant.subscriptions = []
      }

      const months = Number(billingCycleMonths) || 3
      const expiresAt = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000)
      const txId = 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase()

      const existingIndex = restaurant.subscriptions.findIndex((s) => s.featureKey === featureKey)
      if (existingIndex >= 0) {
        restaurant.subscriptions[existingIndex] = {
          featureKey,
          planName: planName || featureKey,
          price: Number(price) || 0,
          billingCycleMonths: months,
          status: 'active',
          startDate: new Date(),
          expiresAt,
          transactionId: txId,
        }
      } else {
        restaurant.subscriptions.push({
          featureKey,
          planName: planName || featureKey,
          price: Number(price) || 0,
          billingCycleMonths: months,
          status: 'active',
          startDate: new Date(),
          expiresAt,
          transactionId: txId,
        })
      }

      await restaurant.save()

      res.status(201).json({
        success: true,
        message: 'Premium feature activated successfully for 3 months!',
        subscriptions: restaurant.subscriptions,
        restaurant,
      })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Admin Revoke/Cancel Subscription
router.delete('/:id/subscriptions/:featureKey', authenticate, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' })
    }

    restaurant.subscriptions = (restaurant.subscriptions || []).filter(
      (s) => s.featureKey !== req.params.featureKey
    )
    await restaurant.save()

    res.json({
      success: true,
      message: 'Subscription removed successfully',
      subscriptions: restaurant.subscriptions,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router