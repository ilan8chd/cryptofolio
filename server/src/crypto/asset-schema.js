import mongoose from 'mongoose'

const { Schema } = mongoose

const assetSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
  },
  coinGeckoId: {
    type: String,
    default: null,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
})

export default mongoose.model('Asset', assetSchema)
