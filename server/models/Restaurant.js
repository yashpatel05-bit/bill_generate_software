const mongoose = require('mongoose')

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    cuisine: {
      type: String,
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, default: 'India' },
    },
    phone: {
      type: String,
      trim: true,
    },
    gstin: {
      type: String,
      trim: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    logo: {
      type: String,
    },
    primaryColor: {
      type: String,
      default: '#ff6b35',
    },
    secondaryColor: {
      type: String,
      default: '#10b981',
    },
    invoiceFooter: {
      type: String,
      default: 'Thank you for dining with us!',
    },
    taxConfiguration: {
      cgstRate: {
        type: Number,
        default: 2.5,
      },
      sgstRate: {
        type: Number,
        default: 2.5,
      },
    },
    branches: [
      {
        name: { type: String, required: true },
        address: { type: String },
        phone: { type: String },
        isMain: { type: Boolean, default: false },
      },
    ],
    subscriptions: [
      {
        featureKey: {
          type: String,
          required: true,
        },
        planName: String,
        price: Number,
        billingCycleMonths: { type: Number, default: 3 },
        status: { type: String, enum: ['active', 'expired'], default: 'active' },
        startDate: { type: Date, default: Date.now },
        expiresAt: { type: Date },
        transactionId: String,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Restaurant', restaurantSchema)