const mongoose = require('mongoose')

const stockMovementSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
    },
    itemName: {
      type: String,
    },
    type: {
      type: String,
      enum: ['purchase', 'adjustment', ' deduction'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unitCost: {
      type: Number,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    reference: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('StockMovement', stockMovementSchema)