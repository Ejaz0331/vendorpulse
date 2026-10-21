const express = require('express');
const router = express.Router();
const SystemConfig = require('../models/SystemConfig');

// Get configuration
router.get('/', async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({});
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update configuration
router.put('/', async (req, res) => {
  try {
    const { weights } = req.body || {};
    
    if (!weights || typeof weights !== 'object') {
      return res.status(400).json({ message: 'KPI weights object is required' });
    }

    const numericWeights = {
      delivery: Number(weights.delivery) || 0,
      quality: Number(weights.quality) || 0,
      cost: Number(weights.cost) || 0,
      response: Number(weights.response) || 0,
      defect: Number(weights.defect) || 0,
      resolution: Number(weights.resolution) || 0
    };

    const sum = Object.values(numericWeights).reduce((a, b) => a + b, 0);
    if (sum !== 100) {
      return res.status(400).json({ message: `Weights must total exactly 100%. Current sum: ${sum}%` });
    }

    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig();
    }
    
    config.kpiWeights = numericWeights;
    const updatedConfig = await config.save();
    
    res.json(updatedConfig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
