const cron = require('node-cron');
const Supplier = require('./models/Supplier');
const Assessment = require('./models/Assessment');
const SystemConfig = require('./models/SystemConfig');
const Notification = require('./models/Notification');

// Skip scheduling during automated unit tests
if (process.env.NODE_ENV !== 'test') {
  // Run every day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
  console.log('Running daily supplier KPI report recalculation...');
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({}); // fallback defaults
    }
    const w = config.kpiWeights;

    const suppliers = await Supplier.find();
    
    for (const supplier of suppliers) {
      const allAssessments = await Assessment.find({ supplier: supplier._id });
      if (allAssessments.length === 0) continue;

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
      let statusUpdate = supplier.status;

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

      const updateData = { 
        averageScore: (lifetimeOverall / 20).toFixed(2), 
        riskLevel,
        avgDelivery: avgDelivery.toFixed(1),
        avgQuality: avgQuality.toFixed(1),
        avgCost: avgCost.toFixed(1),
        avgCommunication: avgCommunication.toFixed(1),
        avgDefect: avgDefectRate.toFixed(1),
        avgResolution: avgResolution.toFixed(1),
        status: statusUpdate
      };

      await Supplier.findByIdAndUpdate(supplier._id, updateData);
    }
    console.log('Daily supplier KPI report recalculation completed successfully.');
  } catch (err) {
    console.error('Error in daily cron job:', err);
  }
});
}
