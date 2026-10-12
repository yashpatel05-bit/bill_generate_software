const mongoose = require('mongoose')

const premiumPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Unique feature code is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    durationMonths: {
      type: Number,
      default: 3,
      min: 1,
    },
    badge: {
      type: String,
      default: 'PRO MODULE',
      trim: true,
    },
    headline: {
      type: String,
      trim: true,
    },
    valueJustification: {
      type: String,
      trim: true,
    },
    capabilities: [
      {
        type: String,
        trim: true,
      },
    ],
    iconKey: {
      type: String,
      default: 'Sparkles',
    },
    color: {
      type: String,
      default: '#758C76',
    },
    bgLight: {
      type: String,
      default: '#FAF8F5',
    },
    accentBorder: {
      type: String,
      default: '#E8E1D7',
    },
    tabId: {
      type: String,
      default: 'plans',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFreeForAdmin: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('PremiumPlan', premiumPlanSchema)
