const express = require('express')
const router = express.Router()
const Customer = require('../models/Customer')
const Restaurant = require('../models/Restaurant')
const { body, param } = require('express-validator')
const authenticate = require('../middleware/auth')

// Get all customers for a restaurant
router.get('/', authenticate, async (req, res) => {
  try {
    const restaurantId = req.query.restaurantId || req.params.restaurantId || req.headers['x-restaurant-id']
    const filter = restaurantId ? { restaurant: restaurantId } : {}
    const customers = await Customer.find(filter).sort({ totalSpent: -1 })
    res.json({ success: true, count: customers.length, customers })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Create customer
router.post(
  '/',
  authenticate,
  [body('name').notEmpty().withMessage('Customer name is required'), body('phone').optional().trim()],
  async (req, res) => {
    try {
      const { name, phone, email } = req.body
      const restaurantId = req.body.restaurant || req.body.restaurantId || req.query.restaurantId || req.params.restaurantId || req.headers['x-restaurant-id']
      const restaurant = await Restaurant.findById(restaurantId)
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' })
      }

      const customer = new Customer({
        restaurant: restaurant._id,
        name,
        phone,
        email: email || undefined,
      })

      await customer.save()
      res.status(201).json({ success: true, customer })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Get single customer
router.get('/:customerId', authenticate, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.customerId,
      restaurant: req.params.restaurantId,
    })
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' })
    }
    res.json({ success: true, customer })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Update customer
router.patch(
  '/:customerId',
  authenticate,
  [param('customerId').isMongoId().withMessage('Invalid customer ID')],
  async (req, res) => {
    try {
      const customer = await Customer.findOneAndUpdate(
        { _id: req.params.customerId, restaurant: req.params.restaurantId },
        req.body,
        { new: true, runValidators: true }
      )
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' })
      }
      res.json({ success: true, customer })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

module.exports = router