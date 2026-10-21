const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  kpiWeights: {
    delivery: { type: Number, default: 20 },
    quality: { type: Number, default: 20 },
    cost: { type: Number, default: 20 },
    response: { type: Number, default: 15 },
    defect: { type: Number, default: 15 },
    resolution: { type: Number, default: 10 }
  }
});

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
