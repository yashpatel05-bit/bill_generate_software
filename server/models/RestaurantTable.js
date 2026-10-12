const mongoose = require('mongoose')

const restaurantTableSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Table name/number is required'],
    },
    capacity: {
      type: Number,
      required: [true, 'Seating capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'cleaning'],
      default: 'available',
    },
    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('RestaurantTable', restaurantTableSchema)