const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');
const Supplier = require('../models/Supplier');
const SystemConfig = require('../models/SystemConfig');
const Notification = require('../models/Notification');

// Get all assessments
router.get('/', async (req, res) => {
  try {
    const filter = req.query.supplierId ? { supplier: req.query.supplierId } : {};
    const assessments = await Assessment.find(filter).populate('supplier').sort({ createdAt: -1 });
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new assessment & Trigger Automated Mathematical Evaluation Engine
router.post('/', async (req, res) => {
  try {
    const raw = req.body || {};
    
    if (!raw.supplier || !mongoose.Types.ObjectId.isValid(raw.supplier)) {
      return res.status(400).json({ message: 'Valid supplier ID is required' });
    }

    // Fetch global KPI weights
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({});
    }
    const w = config.kpiWeights;

    const totalDeliveries = Number(raw.totalDeliveries) || 0;
    const onTimeDeliveries = Number(raw.onTimeDeliveries) || 0;
    const totalItems = Number(raw.totalItems) || 0;
    const acceptedItems = Number(raw.acceptedItems) || 0;
    const defectiveItems = Number(raw.defectiveItems) || 0;
    const marketPrice = Number(raw.marketPrice) || 0;
    const supplierPrice = Number(raw.supplierPrice) || 0;
    const targetResponseHours = Number(raw.targetResponseHours) || 0;
    const actualResponseHours = Number(raw.actualResponseHours) || 0;
    const totalComplaints = Number(raw.totalComplaints) || 0;
    const resolvedComplaints = Number(raw.resolvedComplaints) || 0;

    // --- EXACT MATHEMATICAL FORMULAS ---
    const deliveryRaw = totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 100;
    const qualityRaw = totalItems > 0 ? (acceptedItems / totalItems) * 100 : 100;
    
    let costRaw = supplierPrice > 0 ? (marketPrice / supplierPrice) * 100 : 100;
    if (costRaw > 100) costRaw = 100;
    
    let responseRaw = actualResponseHours > 0 ? (targetResponseHours / actualResponseHours) * 100 : 100;
    if (responseRaw > 100) responseRaw = 100;
    
    const defectRate = totalItems > 0 ? (defectiveItems / totalItems) * 100 : 0;
    const defectRaw = 100 - defectRate; // Invert so higher is better
    
    const resolutionRaw = totalComplaints > 0 ? (resolvedComplaints / totalComplaints) * 100 : 100;

    // Weighted Overall Score for this specific assessment
    const overallScore = (
      (deliveryRaw * (w.delivery / 100)) +
      (qualityRaw * (w.quality / 100)) +
      (costRaw * (w.cost / 100)) +
      (responseRaw * (w.response / 100)) +
      (defectRaw * (w.defect / 100)) +
      (resolutionRaw * (w.resolution / 100))
    );

    const assessment = new Assessment({
      ...raw,
      totalDeliveries,
      onTimeDeliveries,
      totalItems,
      acceptedItems,
      defectiveItems,
      marketPrice,
      supplierPrice,
      targetResponseHours,
      actualResponseHours,
      totalComplaints,
      resolvedComplaints,
      overallScore: Number(overallScore.toFixed(2))
    });
    const newAssessment = await assessment.save();

    // --- RECALCULATE LIFETIME AVERAGES ---
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
    }, { 
      totDel: 0, onTime: 0, totItems: 0, accItems: 0, defItems: 0, 
      mktPrice: 0, supPrice: 0, tgtResp: 0, actResp: 0, totComp: 0, resComp: 0 
    });

    const avgDelivery = sums.totDel > 0 ? ((sums.onTime / sums.totDel) * 100) : 100;
    const avgQuality = sums.totItems > 0 ? ((sums.accItems / sums.totItems) * 100) : 100;
    
    let avgCostCalc = sums.supPrice > 0 ? ((sums.mktPrice / sums.supPrice) * 100) : 100;
    const avgCost = avgCostCalc > 100 ? 100 : avgCostCalc;
    
    let avgCommCalc = sums.actResp > 0 ? ((sums.tgtResp / sums.actResp) * 100) : 100;
    const avgCommunication = avgCommCalc > 100 ? 100 : avgCommCalc;
    
    const avgDefectRate = sums.totItems > 0 ? ((sums.defItems / sums.totItems) * 100) : 0;
    const avgDefectInv = 100 - avgDefectRate;
    
    const avgResolution = sums.totComp > 0 ? ((sums.resComp / sums.totComp) * 100) : 100;

    // Lifetime Weighted Formula
    const lifetimeOverall = (
      (avgDelivery * (w.delivery / 100)) +
      (avgQuality * (w.quality / 100)) +
      (avgCost * (w.cost / 100)) +
      (avgCommunication * (w.response / 100)) +
      (avgDefectInv * (w.defect / 100)) +
      (avgResolution * (w.resolution / 100))
    );

    // 5-Tier Rating System Logic
    let riskLevel = 'Pending';
    let statusUpdate = null;

    if (lifetimeOverall >= 90) {
      riskLevel = 'Excellent';
      statusUpdate = 'Active';
    } else if (lifetimeOverall >= 80) {
      riskLevel = 'Good';
      statusUpdate = 'Active';
    } else if (lifetimeOverall >= 70) {
      riskLevel = 'Average';
    } else if (lifetimeOverall >= 60) {
      riskLevel = 'Poor';
      statusUpdate = 'Under Review';
    } else {
      riskLevel = 'Critical';
      statusUpdate = 'Under Review';
    }

    // Fetch old supplier stats to compare for Notifications
    const oldSupplier = await Supplier.findById(raw.supplier);
    const oldScore100 = oldSupplier && oldSupplier.averageScore ? parseFloat((oldSupplier.averageScore * 20).toFixed(1)) : 100;
    const newScore100 = parseFloat(lifetimeOverall.toFixed(1));

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

    // --- AUTOMATED NOTIFICATION ENGINE ---
    if (oldSupplier && newScore100 < 80) {
      let reason = 'Overall performance deterioration.';
      let type = 'Warning';

      if (newScore100 < 70) type = 'Critical';
      
      if (avgDelivery < 70) reason = 'Late deliveries increased significantly.';
      else if (avgQuality < 70) reason = 'Severe quality failures detected in recent batches.';
      else if (avgCost < 70) reason = 'Pricing non-compliance detected.';
      else if (newScore100 < oldScore100) reason = 'KPI targets missed across multiple metrics.';

      if (newScore100 < oldScore100 - 2 || newScore100 < 70) {
        await Notification.create({
          title: `Supplier performance dropped below ${newScore100 < 70 ? '70' : 'target'}.`,
          supplier: raw.supplier,
          message: reason,
          type,
          details: {
            previous: oldScore100,
            current: newScore100,
            reason
          }
        });
      }
    }

    res.status(201).json(newAssessment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
