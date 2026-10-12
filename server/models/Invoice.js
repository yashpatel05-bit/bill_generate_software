const mongoose = require('mongoose')

const invoiceSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    invoiceNumber: {
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
    },
    branch: {
      type: String,
      trim: true,
    },
    tableNumber: {
      type: String,
    },
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MenuItem',
        },
        name: {
          type: String,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        priceAtInvoice: {
          type: Number,
          default: 0,
        },
        priceAtOrder: {
          type: Number,
          default: 0,
        },
        total: {
          type: Number,
          default: 0,
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
      enum: ['draft', 'finalized', 'printed', 'emailed'],
      default: 'draft',
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    invoiceFooter: {
      type: String,
      default: 'Thank you for dining with us!',
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Invoice', invoiceSchema)