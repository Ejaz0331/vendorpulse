const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
  },
  dateOfAssessment: {
    type: Date,
    default: Date.now,
  },
  // 1. On-Time Delivery Data
  totalDeliveries: { type: Number, default: 0 },
  onTimeDeliveries: { type: Number, default: 0 },
  
  // 2 & 5. Quality and Defect Data
  totalItems: { type: Number, default: 0 },
  acceptedItems: { type: Number, default: 0 },
  defectiveItems: { type: Number, default: 0 },
  
  // 3. Cost Data
  marketPrice: { type: Number, default: 0 },
  supplierPrice: { type: Number, default: 0 },
  
  // 4. Response Time Data
  targetResponseHours: { type: Number, default: 0 },
  actualResponseHours: { type: Number, default: 0 },
  
  // 6. Complaint Resolution Data
  totalComplaints: { type: Number, default: 0 },
  resolvedComplaints: { type: Number, default: 0 },

  // Calculated Overall Score for this specific assessment (0-100)
  overallScore: { type: Number, default: 0 },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
