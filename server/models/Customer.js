const mongoose = require('mongoose')

const customerSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
    },
    name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    lastVisit: {
      type: Date,
    },
    orderHistory: [
      {
        order: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Order',
        },
        invoice: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Invoice',
        },
        orderDate: {
          type: Date,
          default: Date.now,
        },
        total: {
          type: Number,
        },
      },
    ],
  },
  { timestamps: true }
)

module.exports = mongoose.model('Customer', customerSchema)