const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  supplierId: { type: String, unique: true },
  name: {
    type: String,
    required: true,
  },
  contactPerson: { type: String },
  contactEmail: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  address: { type: String },
  category: {
    type: String,
    required: true,
  },
  productsServices: { type: String },
  contractStart: { type: Date },
  contractEnd: { type: Date },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Under Review', 'Blacklisted'],
    default: 'Active'
  },
  averageScore: {
    type: Number,
    default: 0
  },
  avgDelivery: { type: Number, default: 0 },
  avgQuality: { type: Number, default: 0 },
  avgCost: { type: Number, default: 0 },
  avgCommunication: { type: Number, default: 0 },
  avgDefect: { type: Number, default: 0 },
  avgResolution: { type: Number, default: 0 },
  riskLevel: {
    type: String,
    enum: ['Excellent', 'Good', 'Average', 'Poor', 'Critical', 'Pending'],
    default: 'Pending',
  }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
