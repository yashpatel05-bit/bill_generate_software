const mongoose = require('mongoose')

const restaurantSettingsSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    restaurantName: {
      type: String,
    },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String, default: 'India' },
    },
    phone: { type: String },
    gstin: { type: String },
    currency: { type: String, default: 'INR' },
    taxConfiguration: {
      cgstRate: { type: Number, default: 2.5 },
      sgstRate: { type: Number, default: 2.5 },
    },
    invoiceFooter: { type: String, default: 'Thank you for dining with us!' },
    logo: { type: String },
    primaryColor: { type: String, default: '#ff6b35' },
    secondaryColor: { type: String, default: '#10b981' },
  },
  { timestamps: true, _id: false }
)

module.exports = mongoose.model('RestaurantSettings', restaurantSettingsSchema)