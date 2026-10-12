const express = require('express')
const router = express.Router()
const Invoice = require('../models/Invoice')
const Order = require('../models/Order')
const InvoiceSequence = require('../models/InvoiceSequence')
const Restaurant = require('../models/Restaurant')
const { body, param, query } = require('express-validator')
const authenticate = require('../middleware/auth')
const fs = require('fs')
const path = require('path')

// Generate invoice
router.post(
  '/:restaurantId',
  authenticate,
  [
    body('orderId').optional().isMongoId().withMessage('Invalid order ID'),
    body('customerName').notEmpty().withMessage('Customer name is required'),
    body('customerPhone').optional().trim().isMobilePhone().withMessage('Invalid phone number'),
    body('orderType').isIn(['dine-in', 'takeaway', 'delivery']).withMessage('Invalid order type'),
    body('tableNumber').optional().trim(),
  ],
  async (req, res) => {
    try {
      const restaurant = await Restaurant.findById(req.params.restaurantId)
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' })
      }

      let order
      if (req.body.orderId) {
        order = await Order.findById(req.body.orderId)
        if (!order || order.restaurant.toString() !== restaurant._id.toString()) {
          return res.status(404).json({ success: false, message: 'Order not found' })
        }
      }

      const orderType = req.body.orderType || (order ? order.orderType : 'dine-in')
      const tableNumber = req.body.tableNumber || (order ? order.table?.toString() : null)
      const customerName = req.body.customerName || (order ? order.customerName : 'Walk-in Guest')
      const customerPhone = req.body.customerPhone || (order ? order.customerPhone : '')
      const branch = req.body.branch || (restaurant.branches?.[0]?.name || 'Main Branch')

      // Normalize items from request or order
      let rawItems = order ? order.items : (req.body.items || [])
      const items = rawItems.map((item) => {
        const qty = Number(item.quantity) || 1
        const price = Number(item.priceAtInvoice || item.priceAtOrder || item.price || item.sellingPrice || 0)
        return {
          menuItem: item.menuItem,
          name: item.name || 'Dish Item',
          quantity: qty,
          priceAtInvoice: price,
          priceAtOrder: price,
          total: Math.round(qty * price * 100) / 100,
        }
      })

      // Calculate totals
      let subtotal = 0
      items.forEach((item) => {
        subtotal += item.total
      })

      const cgstRate = (restaurant.taxConfiguration?.cgstRate ?? 2.5) / 100
      const sgstRate = (restaurant.taxConfiguration?.sgstRate ?? 2.5) / 100

      const cgst = Math.round(subtotal * cgstRate * 100) / 100
      const sgst = Math.round(subtotal * sgstRate * 100) / 100
      const discount = Number(req.body.discount) || 0
      const total = Math.max(0, Math.round((subtotal + cgst + sgst - discount) * 100) / 100)

      // Generate unique invoice number
      const invoiceNumber = await InvoiceSequence.getNextSequence(restaurant._id)
      const prefix = restaurant.slug || restaurant.name.split(' ').join('-').toUpperCase().substring(0, 2)
      const finalInvoiceNumber = `${prefix}-${invoiceNumber}`

      // Check for duplicate invoice number
      const existing = await Invoice.findOne({ invoiceNumber: finalInvoiceNumber })
      if (existing) {
        return res.status(500).json({ success: false, message: 'Failed to generate unique invoice number' })
      }

      const invoice = new Invoice({
        restaurant: restaurant._id,
        order: order ? order._id : null,
        invoiceNumber: finalInvoiceNumber,
        customerName,
        customerPhone,
        orderType,
        branch,
        tableNumber,
        items,
        subtotal,
        cgst,
        sgst,
        discount,
        total,
        paymentStatus: req.body.paymentStatus || 'paid',
        status: 'finalized',
        invoiceDate: new Date(),
        invoiceFooter: restaurant.invoiceFooter || 'Thank you for dining with us!',
      })

      await invoice.save()

      // If this was created from an order (not existing), update the order
      if (order && !req.body.orderId) {
        order.invoice = invoice._id
        await order.save()
      }

      res.status(201).json({ success: true, invoice })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' })
    }
  }
)

// Get all invoices for a restaurant
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {}
    const rId = req.query.restaurantId || req.params.restaurantId || req.headers['x-restaurant-id']
    if (rId) filter.restaurant = rId
    const invoices = await Invoice.find(filter)
      .populate('restaurant', 'name slug currency')
      .sort({ createdAt: -1 })
      .limit(100)
    res.json({ success: true, count: invoices.length, invoices })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Get single invoice
router.get('/:invoiceId', authenticate, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId)
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' })
    }
    // Check restaurant access if restaurantId specified
    if (req.params.restaurantId && invoice.restaurant.toString() !== req.params.restaurantId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this invoice' })
    }
    res.json({ success: true, invoice })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Get invoice PDF
router.get('/:invoiceId/pdf', authenticate, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId)
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' })
    }
    if (invoice.restaurant.toString() !== req.params.restaurantId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this invoice' })
    }

    // In a full implementation, we would generate PDF here
    // For now, we'll set headers and send a simple response
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${invoice.invoiceNumber}.pdf"`
    )
    res.send(`PDF content for invoice ${invoice.invoiceNumber} would be generated here`)
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router