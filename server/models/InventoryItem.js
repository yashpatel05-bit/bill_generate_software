const mongoose = require('mongoose')

const inventoryItemSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    unit: {
      type: String,
      required: [true, 'Unit of measurement is required'],
    },
    currentStock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    minStockThreshold: {
      type: Number,
      default: 5,
      min: [0, 'Minimum stock must be positive'],
    },
    costPrice: {
      type: Number,
      min: [0, 'Cost price cannot be negative'],
      default: 0,
    },
    supplier: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('InventoryItem', inventoryItemSchema)