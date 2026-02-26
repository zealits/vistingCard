const mongoose = require('mongoose')

const pendingChangeSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: ['edit', 'delete'] },
    cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true },
    payload: { type: mongoose.Schema.Types.Mixed },
    scheduledAt: { type: Date, required: true },
  },
  { timestamps: true },
)

module.exports = mongoose.model('PendingChange', pendingChangeSchema)
