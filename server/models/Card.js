const mongoose = require('mongoose')

const cardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    company: { type: String },
    jobTitle: { type: String },
    phone: { type: String },
    email: { type: String },
    website: { type: String },
    address: { type: String },
    notes: { type: String },
    tags: { type: [String], default: [] },
    imageUrl: { type: String },
    cloudinaryPublicId: { type: String },
    imageUrlBack: { type: String },
    cloudinaryPublicIdBack: { type: String },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Card', cardSchema)

