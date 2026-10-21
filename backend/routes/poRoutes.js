const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const Assessment = require('../models/Assessment');
const SystemConfig = require('../models/SystemConfig');

router.get('/', async (req, res) => {
  try {
    const query = req.query.supplierId ? { supplier: req.query.supplierId } : {};
    const pos = await PurchaseOrder.find(query)
      .populate('supplier')
      .populate('createdBy', 'username role')
      .sort({ createdAt: -1 });
    res.json(pos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    // Safely generate unique PO-XXXX ID
    const allPos = await PurchaseOrder.find({}, 'poId');
    const nums = allPos
      .map(p => parseInt((p.poId || '').replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n));
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1001;
    const poId = req.body.poId || `PO-${nextNum}`;
    
    // Ensure createdBy is present
    if (!req.body.createdBy) {
      return res.status(400).json({ message: 'createdBy User ID is required to link User -> PO' });
    }

    const po = new PurchaseOrder({
      ...req.body,
      poId
    });
    const newPo = await po.save();
    res.status(201).json(newPo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id/deliver', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid PO ID' });
    }

    const { actualDelivery } = req.body;
    const po = await PurchaseOrder.findById(req.params.id);
    
    if (!po) return res.status(404).json({ message: 'PO not found' });
    if (po.kpiGenerated) return res.status(400).json({ message: 'KPI already generated for this PO' });

    const actualDateObj = actualDelivery ? new Date(actualDelivery) : new Date();
    if (isNaN(actualDateObj.getTime())) {
      return res.status(400).json({ message: 'Invalid actualDelivery date' });
    }

    po.status = 'Delivered';
    po.actualDelivery = actualDateObj;
    po.kpiGenerated = true;
    await po.save();

    // ---- AUTOMATED KPI GENERATION ----
    // 1. Compare dates
    const expected = new Date(po.expectedDelivery).setHours(0,0,0,0);
    const actual = new Date(po.actualDelivery).setHours(0,0,0,0);
    
    const isOnTime = actual <= expected;

    // 2. Create synthetic Assessment record targeting ONLY Delivery metric
    const raw = {
      supplier: po.supplier,
      totalDeliveries: 1,
      onTimeDeliveries: isOnTime ? 1 : 0,
      totalItems: 0, acceptedItems: 0, defectiveItems: 0,
      marketPrice: 0, supplierPrice: 0,
      targetResponseHours: 0, actualResponseHours: 0,
      totalComplaints: 0, resolvedComplaints: 0,
      notes: `Automated KPI generation from ${po.poId}`
    };

    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({});
    }
    const w = config.kpiWeights;

    const deliveryRaw = isOnTime ? 100 : 0;
    const overallScore = deliveryRaw * (w.delivery / 100); 

    const assessment = new Assessment({ ...raw, overallScore: Number(overallScore.toFixed(2)) });
    await assessment.save();

    // 3. Recalculate Lifetime averages
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

    res.json({ message: 'PO Delivered and KPI Automatically Updated', po });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
