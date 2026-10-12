const mongoose = require('mongoose')

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
    },
    slug: {
      type: String,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuCategory',
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    sku: {
      type: String,
      unique: true,
      trim: true,
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Price cannot be negative'],
    },
    costPrice: {
      type: Number,
      min: [0, 'Cost price cannot be negative'],
    },
    availability: {
      type: Boolean,
      default: true,
    },
    isVegetarian: {
      type: Boolean,
      default: false,
    },
    preparationTime: {
      type: Number, // in minutes
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    reorderLevel: {
      type: Number,
      default: 5,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

menuItemSchema.virtual('price').get(function () {
  return this.sellingPrice
})

module.exports = mongoose.model('MenuItem', menuItemSchema)