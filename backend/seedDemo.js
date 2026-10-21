require('dotenv').config();
const mongoose = require('mongoose');
const Supplier = require('./models/Supplier');
const Assessment = require('./models/Assessment');
const PurchaseOrder = require('./models/PurchaseOrder');
const QualityInspection = require('./models/QualityInspection');
const Notification = require('./models/Notification');
const SystemConfig = require('./models/SystemConfig');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/supplier_platform';

const seedData = async (shouldExit = true) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to DB for seeding');
    }

    // Clear existing collections
    await Supplier.deleteMany({});
    await Assessment.deleteMany({});
    await PurchaseOrder.deleteMany({});
    await QualityInspection.deleteMany({});
    await Notification.deleteMany({});
    await SystemConfig.deleteMany({});
    await User.deleteMany({});

    // 1. Create Default Users for all 4 roles
    const users = await User.insertMany([
      { username: 'admin', password: 'password123', role: 'Admin' },
      { username: 'manager', password: 'password123', role: 'Manager' },
      { username: 'staff', password: 'password123', role: 'Staff' },
      { username: 'management', password: 'password123', role: 'Management' }
    ]);
    const adminUser = users[0];
    const managerUser = users[1];
    const staffUser = users[2];

    // 2. Create System Configuration with dynamic KPI weights
    await SystemConfig.create({
      kpiWeights: {
        delivery: 20,
        quality: 20,
        cost: 20,
        response: 15,
        defect: 15,
        resolution: 10
      }
    });

    // 3. Create Diverse Suppliers across multiple categories and risk tiers
    const suppliers = await Supplier.insertMany([
      {
        supplierId: 'SUP-001',
        name: 'Apex Global Logistics',
        contactPerson: 'Sarah Jenkins',
        contactEmail: 'sarah@apexglobal.com',
        phone: '+1 555-0101',
        address: '450 Freight Blvd, Chicago, IL',
        category: 'Logistics',
        productsServices: 'International Freight, Cold-chain Transport, Warehousing',
        contractStart: new Date('2025-01-01'),
        contractEnd: new Date('2027-12-31'),
        status: 'Active',
        averageScore: 4.68,
        avgDelivery: 98.2,
        avgQuality: 96.0,
        avgCost: 91.5,
        avgCommunication: 95.0,
        avgDefect: 1.2,
        avgResolution: 96.0,
        riskLevel: 'Excellent'
      },
      {
        supplierId: 'SUP-002',
        name: 'NovaTech Microelectronics',
        contactPerson: 'Dr. Aris Thorne',
        contactEmail: 'thorne@novatech-micro.io',
        phone: '+1 555-0102',
        address: '100 Silicon Way, San Jose, CA',
        category: 'Electronics',
        productsServices: 'Arm Processors, IoT Sensor Hubs, Power Regulators',
        contractStart: new Date('2025-03-01'),
        contractEnd: new Date('2028-03-01'),
        status: 'Active',
        averageScore: 4.85,
        avgDelivery: 99.0,
        avgQuality: 98.5,
        avgCost: 94.0,
        avgCommunication: 97.5,
        avgDefect: 0.5,
        avgResolution: 98.0,
        riskLevel: 'Excellent'
      },
      {
        supplierId: 'SUP-003',
        name: 'Titanium Manufacturing Corp',
        contactPerson: 'Marcus Vance',
        contactEmail: 'marcus@titanium-mfg.com',
        phone: '+1 555-0103',
        address: '88 Industrial Way, Detroit, MI',
        category: 'Manufacturing',
        productsServices: 'Aerospace Grade Bolts, CNC Milled Titanium Brackets',
        contractStart: new Date('2024-06-01'),
        contractEnd: new Date('2026-12-31'),
        status: 'Active',
        averageScore: 3.90,
        avgDelivery: 84.0,
        avgQuality: 86.5,
        avgCost: 71.0,
        avgCommunication: 80.0,
        avgDefect: 7.5,
        avgResolution: 82.0,
        riskLevel: 'Average'
      },
      {
        supplierId: 'SUP-004',
        name: 'Vanguard Raw Materials Ltd',
        contactPerson: 'Claire Beauchamp',
        contactEmail: 'c.beauchamp@vanguardraw.com',
        phone: '+1 555-0104',
        address: '12 Harbor Road, Houston, TX',
        category: 'Raw Materials',
        productsServices: 'Industrial Aluminum Ingots, High-tensile Steel, Copper Rods',
        contractStart: new Date('2025-02-15'),
        contractEnd: new Date('2027-02-15'),
        status: 'Active',
        averageScore: 4.25,
        avgDelivery: 88.0,
        avgQuality: 92.0,
        avgCost: 84.0,
        avgCommunication: 85.0,
        avgDefect: 3.5,
        avgResolution: 87.0,
        riskLevel: 'Good'
      },
      {
        supplierId: 'SUP-005',
        name: 'EcoPack Sustainable Solutions',
        contactPerson: 'Liam O’Connor',
        contactEmail: 'liam@ecopack-global.com',
        phone: '+1 555-0105',
        address: '22 Greenleaf Park, Portland, OR',
        category: 'Packaging',
        productsServices: 'Recycled Corrugated Containers, Biodegradable Foam Inserts',
        contractStart: new Date('2025-04-01'),
        contractEnd: new Date('2026-10-01'),
        status: 'Active',
        averageScore: 4.15,
        avgDelivery: 89.5,
        avgQuality: 88.0,
        avgCost: 87.0,
        avgCommunication: 82.0,
        avgDefect: 2.8,
        avgResolution: 84.0,
        riskLevel: 'Good'
      },
      {
        supplierId: 'SUP-006',
        name: 'Quantum IT Cloud Solutions',
        contactPerson: 'Elena Rostova',
        contactEmail: 'elena@quantum-it.io',
        phone: '+1 555-0106',
        address: '500 Innovation Loop, Seattle, WA',
        category: 'IT Services',
        productsServices: 'Enterprise ERP Hosting, Cloud Redundancy, 24/7 Monitoring',
        contractStart: new Date('2024-01-01'),
        contractEnd: new Date('2026-06-30'),
        status: 'Under Review',
        averageScore: 3.15,
        avgDelivery: 68.0,
        avgQuality: 74.0,
        avgCost: 79.0,
        avgCommunication: 52.0,
        avgDefect: 14.0,
        avgResolution: 64.0,
        riskLevel: 'Poor'
      },
      {
        supplierId: 'SUP-007',
        name: 'BioChem Synthetics Corp',
        contactPerson: 'Dr. Victor Franke',
        contactEmail: 'v.franke@biochemsynth.de',
        phone: '+1 555-0107',
        address: '77 Chemical Corridor, Elizabeth, NJ',
        category: 'Chemicals',
        productsServices: 'Industrial Adhesives, Thermal Pastes, Cleaning Solvents',
        contractStart: new Date('2024-09-01'),
        contractEnd: new Date('2026-09-01'),
        status: 'Under Review',
        averageScore: 2.95,
        avgDelivery: 62.0,
        avgQuality: 58.0,
        avgCost: 67.0,
        avgCommunication: 55.0,
        avgDefect: 24.0,
        avgResolution: 52.0,
        riskLevel: 'Critical'
      },
      {
        supplierId: 'SUP-008',
        name: 'Starlight Electronics Components',
        contactPerson: 'James Chen',
        contactEmail: 'james@starlight-elec.com',
        phone: '+1 555-0108',
        address: '9 Pioneer Zone, Austin, TX',
        category: 'Electronics',
        productsServices: 'Surface Mount Capacitors, Micro-relays, Transistors',
        contractStart: new Date('2024-11-01'),
        contractEnd: new Date('2025-11-01'),
        status: 'Under Review',
        averageScore: 2.40,
        avgDelivery: 48.0,
        avgQuality: 56.0,
        avgCost: 62.0,
        avgCommunication: 38.0,
        avgDefect: 32.0,
        avgResolution: 42.0,
        riskLevel: 'Critical'
      },
      {
        supplierId: 'SUP-009',
        name: 'IronClad Heavy Fasteners',
        contactPerson: 'Kurt Schmidt',
        contactEmail: 'kurt@ironclad-fasteners.com',
        phone: '+1 555-0109',
        address: '3 Foundry Row, Pittsburgh, PA',
        category: 'Manufacturing',
        productsServices: 'Heavy Duty Structural Rivets, High-vibration Washers',
        contractStart: new Date('2023-01-01'),
        contractEnd: new Date('2025-01-01'),
        status: 'Blacklisted',
        averageScore: 1.85,
        avgDelivery: 35.0,
        avgQuality: 42.0,
        avgCost: 48.0,
        avgCommunication: 25.0,
        avgDefect: 45.0,
        avgResolution: 30.0,
        riskLevel: 'Critical'
      },
      {
        supplierId: 'SUP-010',
        name: 'Solaris Green Energy',
        contactPerson: 'Maya Lin',
        contactEmail: 'maya@solaris-energy.org',
        phone: '+1 555-0110',
        address: '150 Sunburst Drive, Phoenix, AZ',
        category: 'Energy',
        productsServices: 'Commercial Solar Inverters, Lithium Battery Banks',
        contractStart: new Date('2026-01-10'),
        contractEnd: new Date('2028-01-10'),
        status: 'Active',
        averageScore: 0,
        avgDelivery: 0,
        avgQuality: 0,
        avgCost: 0,
        avgCommunication: 0,
        avgDefect: 0,
        avgResolution: 0,
        riskLevel: 'Pending'
      }
    ]);

    const now = new Date();
    const assessments = [];

    // 4. Generate Multi-Month Historical Assessments (enables Linear Regression AI Prediction in Profile view)
    // Supplier 0: Apex Global (Consistently Excellent)
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      assessments.push({
        supplier: suppliers[0]._id,
        dateOfAssessment: d,
        createdAt: d,
        totalDeliveries: 100,
        onTimeDeliveries: 98,
        totalItems: 5000,
        acceptedItems: 4950,
        defectiveItems: 50,
        marketPrice: 100,
        supplierPrice: 95,
        targetResponseHours: 24,
        actualResponseHours: 12,
        totalComplaints: 4,
        resolvedComplaints: 4,
        overallScore: 93 + i
      });
    }

    // Supplier 1: NovaTech (Ascending to #1 Top Ranking)
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      assessments.push({
        supplier: suppliers[1]._id,
        dateOfAssessment: d,
        createdAt: d,
        totalDeliveries: 120,
        onTimeDeliveries: 119,
        totalItems: 10000,
        acceptedItems: 9980,
        defectiveItems: 20,
        marketPrice: 150,
        supplierPrice: 140,
        targetResponseHours: 24,
        actualResponseHours: 8,
        totalComplaints: 2,
        resolvedComplaints: 2,
        overallScore: 94 + i
      });
    }

    // Supplier 2: Titanium Mfg (Moderate stable with occasional cost friction)
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      assessments.push({
        supplier: suppliers[2]._id,
        dateOfAssessment: d,
        createdAt: d,
        totalDeliveries: 80,
        onTimeDeliveries: 68,
        totalItems: 4000,
        acceptedItems: 3500,
        defectiveItems: 500,
        marketPrice: 100,
        supplierPrice: 120,
        targetResponseHours: 24,
        actualResponseHours: 28,
        totalComplaints: 12,
        resolvedComplaints: 10,
        overallScore: 78 + (i % 2)
      });
    }

    // Supplier 3: Vanguard Raw Materials (Solid Good Tier)
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      assessments.push({
        supplier: suppliers[3]._id,
        dateOfAssessment: d,
        createdAt: d,
        totalDeliveries: 90,
        onTimeDeliveries: 80,
        totalItems: 8000,
        acceptedItems: 7400,
        defectiveItems: 600,
        marketPrice: 200,
        supplierPrice: 195,
        targetResponseHours: 24,
        actualResponseHours: 20,
        totalComplaints: 6,
        resolvedComplaints: 5,
        overallScore: 83 + i
      });
    }

    // Supplier 4: EcoPack Packaging (Healthy Good Tier)
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      assessments.push({
        supplier: suppliers[4]._id,
        dateOfAssessment: d,
        createdAt: d,
        totalDeliveries: 70,
        onTimeDeliveries: 63,
        totalItems: 25000,
        acceptedItems: 24300,
        defectiveItems: 700,
        marketPrice: 50,
        supplierPrice: 48,
        targetResponseHours: 24,
        actualResponseHours: 22,
        totalComplaints: 8,
        resolvedComplaints: 7,
        overallScore: 80 + i
      });
    }

    // Supplier 5: Quantum IT Solutions (Deteriorating Trend -> Linear Regression predicts drop)
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      assessments.push({
        supplier: suppliers[5]._id,
        dateOfAssessment: d,
        createdAt: d,
        totalDeliveries: 50,
        onTimeDeliveries: 35,
        totalItems: 500,
        acceptedItems: 380,
        defectiveItems: 120,
        marketPrice: 500,
        supplierPrice: 530,
        targetResponseHours: 12,
        actualResponseHours: 36,
        totalComplaints: 25,
        resolvedComplaints: 14,
        overallScore: 82 - (4 - i) * 5
      });
    }

    // Supplier 6: BioChem Synthetics (Critical drop)
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      assessments.push({
        supplier: suppliers[6]._id,
        dateOfAssessment: d,
        createdAt: d,
        totalDeliveries: 40,
        onTimeDeliveries: 25,
        totalItems: 2000,
        acceptedItems: 1400,
        defectiveItems: 600,
        marketPrice: 300,
        supplierPrice: 350,
        targetResponseHours: 24,
        actualResponseHours: 48,
        totalComplaints: 30,
        resolvedComplaints: 15,
        overallScore: 74 - (4 - i) * 4
      });
    }

    // Supplier 7: Starlight Electronics (Severe Critical Failure)
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      assessments.push({
        supplier: suppliers[7]._id,
        dateOfAssessment: d,
        createdAt: d,
        totalDeliveries: 60,
        onTimeDeliveries: 28,
        totalItems: 6000,
        acceptedItems: 3600,
        defectiveItems: 2400,
        marketPrice: 80,
        supplierPrice: 110,
        targetResponseHours: 24,
        actualResponseHours: 72,
        totalComplaints: 45,
        resolvedComplaints: 12,
        overallScore: 58 - (4 - i) * 3
      });
    }

    // Supplier 8: IronClad Fasteners (Blacklisted baseline)
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - (i + 3));
      assessments.push({
        supplier: suppliers[8]._id,
        dateOfAssessment: d,
        createdAt: d,
        totalDeliveries: 30,
        onTimeDeliveries: 10,
        totalItems: 10000,
        acceptedItems: 5000,
        defectiveItems: 5000,
        marketPrice: 20,
        supplierPrice: 35,
        targetResponseHours: 24,
        actualResponseHours: 96,
        totalComplaints: 50,
        resolvedComplaints: 8,
        overallScore: 37
      });
    }

    await Assessment.insertMany(assessments);

    // 5. Create Realistic Purchase Orders spanning multiple statuses
    const pos = await PurchaseOrder.insertMany([
      {
        poId: 'PO-1001',
        supplier: suppliers[0]._id, // Apex Logistics
        createdBy: adminUser._id,
        products: 'Fleet Transport & Cold-chain Service Package',
        quantity: 12,
        orderValue: 36000,
        expectedDelivery: new Date(now.getTime() + 86400000 * 4),
        status: 'Pending'
      },
      {
        poId: 'PO-1002',
        supplier: suppliers[1]._id, // NovaTech
        createdBy: managerUser._id,
        products: 'Cortex-M7 Microcontroller Boards',
        quantity: 5000,
        orderValue: 85000,
        expectedDelivery: new Date(now.getTime() - 86400000 * 4),
        actualDelivery: new Date(now.getTime() - 86400000 * 4),
        status: 'Delivered',
        kpiGenerated: true
      },
      {
        poId: 'PO-1003',
        supplier: suppliers[2]._id, // Titanium Mfg
        createdBy: staffUser._id,
        products: 'Titanium Engine Mounting Bolts',
        quantity: 2500,
        orderValue: 18500,
        expectedDelivery: new Date(now.getTime() - 86400000 * 6),
        actualDelivery: new Date(now.getTime() - 86400000 * 5),
        status: 'Delivered',
        kpiGenerated: true
      },
      {
        poId: 'PO-1004',
        supplier: suppliers[3]._id, // Vanguard Raw Materials
        createdBy: adminUser._id,
        products: 'Grade 6061 Aluminum Extrusion Billets',
        quantity: 150,
        orderValue: 42000,
        expectedDelivery: new Date(now.getTime() + 86400000 * 2),
        status: 'Shipped'
      },
      {
        poId: 'PO-1005',
        supplier: suppliers[4]._id, // EcoPack
        createdBy: managerUser._id,
        products: 'Custom Die-Cut Protective Packaging Sets',
        quantity: 10000,
        orderValue: 14500,
        expectedDelivery: new Date(now.getTime() - 86400000 * 3),
        actualDelivery: new Date(now.getTime() - 86400000 * 3),
        status: 'Delivered',
        kpiGenerated: true
      },
      {
        poId: 'PO-1006',
        supplier: suppliers[5]._id, // Quantum IT
        createdBy: adminUser._id,
        products: 'Dedicated Cloud Database Server Tier 3',
        quantity: 4,
        orderValue: 28000,
        expectedDelivery: new Date(now.getTime() - 86400000 * 12),
        actualDelivery: new Date(now.getTime() - 86400000 * 6),
        status: 'Delivered',
        kpiGenerated: true
      },
      {
        poId: 'PO-1007',
        supplier: suppliers[6]._id, // BioChem
        createdBy: staffUser._id,
        products: 'Industrial Epoxy Bonding Agent (55 Gallon Drums)',
        quantity: 40,
        orderValue: 19800,
        expectedDelivery: new Date(now.getTime() - 86400000 * 5),
        actualDelivery: new Date(now.getTime() - 86400000 * 3),
        status: 'Delivered',
        kpiGenerated: true
      },
      {
        poId: 'PO-1008',
        supplier: suppliers[7]._id, // Starlight Electronics
        createdBy: managerUser._id,
        products: 'Low-ESR Solid State Capacitor Bundles',
        quantity: 15000,
        orderValue: 9200,
        expectedDelivery: new Date(now.getTime() - 86400000 * 2),
        status: 'Shipped'
      },
      {
        poId: 'PO-1009',
        supplier: suppliers[1]._id, // NovaTech
        createdBy: adminUser._id,
        products: 'Automotive Sensor Subsystem Units',
        quantity: 800,
        orderValue: 64000,
        expectedDelivery: new Date(now.getTime() + 86400000 * 7),
        status: 'Pending'
      },
      {
        poId: 'PO-1010',
        supplier: suppliers[2]._id, // Titanium Mfg
        createdBy: staffUser._id,
        products: 'Precision Aerospace Fastener Clips',
        quantity: 1200,
        orderValue: 8900,
        expectedDelivery: new Date(now.getTime() + 86400000 * 1),
        status: 'Pending'
      }
    ]);

    // 6. Create Quality Inspections linked to Delivered POs
    await QualityInspection.insertMany([
      {
        inspectionId: 'INSP-1001',
        po: pos[1]._id, // NovaTech
        supplier: suppliers[1]._id,
        totalItems: 5000,
        acceptedItems: 5000,
        rejectedItems: 0,
        defectType: 'None',
        inspectionDate: new Date(now.getTime() - 86400000 * 4)
      },
      {
        inspectionId: 'INSP-1002',
        po: pos[2]._id, // Titanium Mfg
        supplier: suppliers[2]._id,
        totalItems: 2500,
        acceptedItems: 2470,
        rejectedItems: 30,
        defectType: 'Dimensional Variance',
        inspectionDate: new Date(now.getTime() - 86400000 * 5)
      },
      {
        inspectionId: 'INSP-1003',
        po: pos[4]._id, // EcoPack
        supplier: suppliers[4]._id,
        totalItems: 10000,
        acceptedItems: 9940,
        rejectedItems: 60,
        defectType: 'Packaging Moisture Breach',
        inspectionDate: new Date(now.getTime() - 86400000 * 3)
      },
      {
        inspectionId: 'INSP-1004',
        po: pos[5]._id, // Quantum IT
        supplier: suppliers[5]._id,
        totalItems: 4,
        acceptedItems: 3,
        rejectedItems: 1,
        defectType: 'SLA Throughput Failure',
        inspectionDate: new Date(now.getTime() - 86400000 * 6)
      },
      {
        inspectionId: 'INSP-1005',
        po: pos[6]._id, // BioChem
        supplier: suppliers[6]._id,
        totalItems: 40,
        acceptedItems: 30,
        rejectedItems: 10,
        defectType: 'Chemical Contamination',
        inspectionDate: new Date(now.getTime() - 86400000 * 3)
      }
    ]);

    // 7. Create System Notifications & Risk Alerts
    await Notification.insertMany([
      {
        title: 'Critical Score Drop Alert',
        supplier: suppliers[7]._id, // Starlight
        message: 'Starlight Electronics performance score collapsed to 48.0%, breaching critical threshold (60.0).',
        type: 'Critical',
        details: {
          previous: 68.0,
          current: 48.0,
          reason: 'Severe quality failures and high defect rate (32%) detected across recent batches.'
        },
        isRead: false
      },
      {
        title: 'Critical Quality Alert',
        supplier: suppliers[6]._id, // BioChem
        message: 'BioChem Synthetics entered Critical Risk tier. Immediate quality audit recommended.',
        type: 'Critical',
        details: {
          previous: 72.0,
          current: 59.0,
          reason: '10 defective chemical drums detected in batch INSP-1005 (Contamination).'
        },
        isRead: false
      },
      {
        title: 'Delayed Delivery Warning',
        supplier: suppliers[5]._id, // Quantum IT
        message: 'Quantum IT Cloud Solutions delivered server infrastructure PO-1006 6 days late.',
        type: 'Warning',
        details: {
          previous: 82.0,
          current: 63.0,
          reason: 'Late deliveries and severe response time lag (52h average).'
        },
        isRead: false
      },
      {
        title: 'Margin & Cost Variance Warning',
        supplier: suppliers[2]._id, // Titanium Mfg
        message: 'Titanium Manufacturing pricing variance flagged above acceptable market standard.',
        type: 'Warning',
        details: {
          previous: 84.0,
          current: 78.0,
          reason: 'Pricing non-compliance detected relative to global benchmark.'
        },
        isRead: false
      },
      {
        title: 'Top Supplier Leaderboard Achievement',
        supplier: suppliers[1]._id, // NovaTech
        message: 'NovaTech Microelectronics achieved #1 overall stack rank with a 97.0% score.',
        type: 'Info',
        details: {
          previous: 94.0,
          current: 97.0,
          reason: 'Perfect 100% quality inspection INSP-1001 with zero defects.'
        },
        isRead: true
      },
      {
        title: 'New Supplier Onboarded',
        supplier: suppliers[9]._id, // Solaris Green Energy
        message: 'Solaris Green Energy successfully onboarded into platform. Pending initial assessment.',
        type: 'Info',
        details: {
          previous: 0,
          current: 0,
          reason: 'New partner profile active. Initial procurement contract initiated.'
        },
        isRead: true
      }
    ]);

    console.log('✅ Comprehensive demo dataset seeded successfully!');
    console.log(`- 10 Suppliers across 7 categories (Excellent, Good, Average, Poor, Critical, Pending, Blacklisted)`);
    console.log(`- 4 System Users (admin, manager, staff, management)`);
    console.log(`- 40+ Historical Assessments with Multi-Month Prediction Trends`);
    console.log(`- 10 Purchase Orders across all delivery lifecycle stages`);
    console.log(`- 5 Quality Inspections with diverse defect classifications`);
    console.log(`- 6 Risk & Systemic Notifications`);

    if (shouldExit) {
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    if (shouldExit) {
      process.exit(1);
    } else {
      throw err;
    }
  }
};

if (require.main === module) {
  seedData(true);
}

module.exports = seedData;
