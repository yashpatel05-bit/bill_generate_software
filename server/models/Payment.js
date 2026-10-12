const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema(
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
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'net banking', 'wallet'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partially_paid', 'paid', 'refunded'],
      default: 'unpaid',
    },
    transactionId: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Payment', paymentSchema)