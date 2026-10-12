const mongoose = require('mongoose')

const invoiceSequenceSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
    },
    current: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

invoiceSequenceSchema.statics.getNextSequence = async function (restaurantId) {
  const sequenceDoc = await this.findOneAndUpdate(
    { restaurant: restaurantId || '' },
    { $inc: { current: 1 } },
    { new: true, upsert: true }
  )
  return sequenceDoc.current
}

module.exports = mongoose.model('InvoiceSequence', invoiceSequenceSchema)