const mongoose = require('mongoose');

const poSchema = new mongoose.Schema({
  poId: { type: String, unique: true },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  products: { type: String, required: true },
  quantity: { type: Number, required: true },
  orderValue: { type: Number, required: true },
  orderDate: { type: Date, default: Date.now },
  expectedDelivery: { type: Date, required: true },
  actualDelivery: { type: Date },
  status: {
    type: String,
    enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  kpiGenerated: { type: Boolean, default: false } // To ensure we only log the KPI once
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', poSchema);
