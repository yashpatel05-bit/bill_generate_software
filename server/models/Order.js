const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    orderNumber: {
      type: String,
      unique: true,
    },
    customerName: {
      type: String,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    orderType: {
      type: String,
      enum: ['dine-in', 'takeaway', 'delivery'],
      required: true,
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RestaurantTable',
    },
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MenuItem',
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1'],
        },
        priceAtOrder: {
          type: Number,
          required: true,
        },
        total: {
          type: Number,
          required: true,
        },
      },
    ],
    subtotal: {
      type: Number,
      default: 0,
    },
    cgst: {
      type: Number,
      default: 0,
    },
    sgst: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'net banking', 'wallet'],
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partially_paid', 'paid', 'refunded'],
      default: 'unpaid',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
)

orderSchema.pre('save', async function (next) {
  // Calculate subtotal, taxes, and total
  let subtotal = 0
  this.items.forEach((item) => {
    subtotal += item.quantity * item.priceAtOrder
  })

  const cgstRate = this.restaurant.taxConfiguration.cgstRate / 100
  const sgstRate = this.restaurant.taxConfiguration.sgstRate / 100

  const cgst = Math.round(subtotal * cgstRate * 100) / 100
  const sgst = Math.round(subtotal * sgstRate * 100) / 100
  const total = Math.round((subtotal + cgst + sgst - (this.discount || 0)) * 100) / 100

  this.subtotal = subtotal
  this.cgst = cgst
  this.sgst = sgst
  this.total = total
  next()
})

module.exports = mongoose.model('Order', orderSchema)