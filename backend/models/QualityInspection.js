const mongoose = require('mongoose');

const qualitySchema = new mongoose.Schema({
  inspectionId: { type: String, unique: true },
  po: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    required: true,
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
  },
  totalItems: { type: Number, required: true },
  acceptedItems: { type: Number, required: true },
  rejectedItems: { type: Number, required: true },
  defectType: { type: String },
  inspectionDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('QualityInspection', qualitySchema);
