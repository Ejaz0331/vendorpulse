const express = require('express');
const router = express.Router();
const QualityInspection = require('../models/QualityInspection');
const Supplier = require('../models/Supplier');
const Assessment = require('../models/Assessment');
const SystemConfig = require('../models/SystemConfig');

router.get('/', async (req, res) => {
  try {
    const insps = await QualityInspection.find()
      .populate('supplier')
      .populate('po')
      .sort({ createdAt: -1 });
    res.json(insps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    // Generate unique INSP-XXXX ID safely
    const allInsps = await QualityInspection.find({}, 'inspectionId');
    const nums = allInsps
      .map(i => parseInt((i.inspectionId || '').replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n));
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1001;
    const inspectionId = req.body.inspectionId || `INSP-${nextNum}`;
    
    const insp = new QualityInspection({
      ...req.body,
      inspectionId
    });
    const newInsp = await insp.save();

    // ---- AUTOMATED KPI GENERATION ----
    const totalItems = Number(req.body.totalItems) || 0;
    const acceptedItems = Number(req.body.acceptedItems) || 0;
    const rejectedItems = Number(req.body.rejectedItems) || 0;

    const raw = {
      supplier: req.body.supplier,
      totalDeliveries: 0, onTimeDeliveries: 0,
      totalItems,
      acceptedItems,
      defectiveItems: rejectedItems,
      marketPrice: 0, supplierPrice: 0,
      targetResponseHours: 0, actualResponseHours: 0,
      totalComplaints: 0, resolvedComplaints: 0,
      notes: `Automated Quality KPI from ${inspectionId}. Defect Type: ${req.body.defectType || 'None'}`
    };

    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({});
    }
    const w = config.kpiWeights;

    const qualityRaw = totalItems > 0 ? (acceptedItems / totalItems) * 100 : 100;
    const defectRate = totalItems > 0 ? (rejectedItems / totalItems) * 100 : 0;
    const defectRaw = 100 - defectRate;
    
    const overallScore = (qualityRaw * (w.quality / 100)) + (defectRaw * (w.defect / 100));

    const assessment = new Assessment({ ...raw, overallScore: Number(overallScore.toFixed(2)) });
    await assessment.save();

    // Recalculate Lifetime averages
    const allAssessments = await Assessment.find({ supplier: raw.supplier });
    const sums = allAssessments.reduce((acc, curr) => {
      acc.totDel += curr.totalDeliveries || 0;
      acc.onTime += curr.onTimeDeliveries || 0;
      acc.totItems += curr.totalItems || 0;
      acc.accItems += curr.acceptedItems || 0;
      acc.defItems += curr.defectiveItems || 0;
      acc.mktPrice += curr.marketPrice || 0;
      acc.supPrice += curr.supplierPrice || 0;
      acc.tgtResp += curr.targetResponseHours || 0;
      acc.actResp += curr.actualResponseHours || 0;
      acc.totComp += curr.totalComplaints || 0;
      acc.resComp += curr.resolvedComplaints || 0;
      return acc;
    }, { totDel: 0, onTime: 0, totItems: 0, accItems: 0, defItems: 0, mktPrice: 0, supPrice: 0, tgtResp: 0, actResp: 0, totComp: 0, resComp: 0 });

    const avgDelivery = sums.totDel > 0 ? ((sums.onTime / sums.totDel) * 100) : 100;
    const avgQuality = sums.totItems > 0 ? ((sums.accItems / sums.totItems) * 100) : 100;
    let avgCostCalc = sums.supPrice > 0 ? ((sums.mktPrice / sums.supPrice) * 100) : 100;
    const avgCost = avgCostCalc > 100 ? 100 : avgCostCalc;
    let avgCommCalc = sums.actResp > 0 ? ((sums.tgtResp / sums.actResp) * 100) : 100;
    const avgCommunication = avgCommCalc > 100 ? 100 : avgCommCalc;
    const avgDefectRate = sums.totItems > 0 ? ((sums.defItems / sums.totItems) * 100) : 0;
    const avgDefectInv = 100 - avgDefectRate;
    const avgResolution = sums.totComp > 0 ? ((sums.resComp / sums.totComp) * 100) : 100;

    const lifetimeOverall = (
      (avgDelivery * (w.delivery / 100)) + (avgQuality * (w.quality / 100)) + (avgCost * (w.cost / 100)) +
      (avgCommunication * (w.response / 100)) + (avgDefectInv * (w.defect / 100)) + (avgResolution * (w.resolution / 100))
    );

    let riskLevel = 'Pending';
    let statusUpdate = null;
    if (lifetimeOverall >= 90) { riskLevel = 'Excellent'; statusUpdate = 'Active'; }
    else if (lifetimeOverall >= 80) { riskLevel = 'Good'; statusUpdate = 'Active'; }
    else if (lifetimeOverall >= 70) { riskLevel = 'Average'; }
    else if (lifetimeOverall >= 60) { riskLevel = 'Poor'; statusUpdate = 'Under Review'; }
    else { riskLevel = 'Critical'; statusUpdate = 'Under Review'; }

    const updateData = { 
      averageScore: parseFloat((lifetimeOverall / 20).toFixed(2)), 
      riskLevel,
      avgDelivery: parseFloat(avgDelivery.toFixed(1)),
      avgQuality: parseFloat(avgQuality.toFixed(1)),
      avgCost: parseFloat(avgCost.toFixed(1)),
      avgCommunication: parseFloat(avgCommunication.toFixed(1)),
      avgDefect: parseFloat(avgDefectRate.toFixed(1)),
      avgResolution: parseFloat(avgResolution.toFixed(1))
    };
    if (statusUpdate) updateData.status = statusUpdate;
    
    await Supplier.findByIdAndUpdate(raw.supplier, updateData);

    res.status(201).json(newInsp);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
