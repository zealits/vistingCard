const mongoose = require('mongoose')

const industrySchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    icon: { type: String, trim: true },
    color: { type: String, trim: true },
  },
  { timestamps: true }
)

industrySchema.index({ order: 1 })

module.exports = mongoose.model('Industry', industrySchema)
