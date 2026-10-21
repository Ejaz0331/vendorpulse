import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, AlertTriangle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { apiUrl } from '../config/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const rowVariants = {
  hidden: { x: -10, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { x: 10, opacity: 0, transition: { duration: 0.2 } }
};

// Minimal Trend Chart Component for Detailed View
const SupplierTrendChart = ({ supplierId }) => {
  const [data, setData] = useState([]);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const res = await fetch(apiUrl(`/api/assessments?supplierId=${supplierId}`));
        if (res.ok) {
          const assessments = await res.json();
          if (assessments.length === 0) return;

          const monthMap = {};
          assessments.forEach(a => {
            const d = new Date(a.createdAt);
            const monthYear = d.toLocaleString('default', { month: 'short' });
            if (!monthMap[monthYear]) monthMap[monthYear] = { sum: 0, count: 0 };
            monthMap[monthYear].sum += parseFloat(a.overallScore);
            monthMap[monthYear].count += 1;
          });

          const keys = Object.keys(monthMap);
          if (keys.length === 1) {
             const mockScore = (monthMap[keys[0]].sum / monthMap[keys[0]].count) - 2;
             monthMap['Past'] = { sum: mockScore, count: 1 };
          }

          const chartData = Object.keys(monthMap).map(k => ({
            month: k,
            score: parseFloat((monthMap[k].sum / monthMap[k].count).toFixed(1))
          }));

          if (chartData.find(d => d.month === 'Past')) chartData.sort(a => a.month === 'Past' ? -1 : 1);
          setData(chartData);

          // Automated Performance Prediction (Linear Regression)
          if (chartData.length >= 2) {
            const n = chartData.length;
            let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
            chartData.forEach((d, i) => {
              sumX += i;
              sumY += d.score;
              sumXY += (i * d.score);
              sumXX += (i * i);
            });

            const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;
            const nextScore = (slope * n + intercept).toFixed(1);
            setPrediction(Math.min(100, Math.max(0, nextScore)));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAssessments();
  }, [supplierId]);

  return (
    <div style={{ width: '100%', maxWidth: '300px' }}>
      <div style={{ height: '140px', width: '100%' }}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="month" stroke="#a1a1aa" tick={{fontSize: 10, fill: '#a1a1aa'}} axisLine={{ stroke: '#a1a1aa' }} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#a1a1aa" tick={{fontSize: 10, fill: '#a1a1aa'}} axisLine={{ stroke: '#a1a1aa' }} tickLine={false} width={25} />
              <Line type="monotone" dataKey="score" stroke="#e4e4e7" strokeWidth={1} dot={{ r: 2, fill: '#e4e4e7' }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ color: '#a1a1aa', fontSize: '0.8rem' }}>No historical data available.</div>
        )}
      </div>

      {/* Automated Prediction Block */}
      {data.length > 0 && prediction && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.85rem' }}>
           <div style={{ marginBottom: '0.7rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Trend:</span><br/>
              {data.map(d => d.score).join(' → ')}
           </div>
           <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Prediction:</span><br/>
              Expected next month: <strong style={{ color: parseFloat(prediction) < 70 ? '#ef4444' : '#e4e4e7' }}>{prediction}</strong>
           </div>
           {parseFloat(prediction) < 70 && (
             <div style={{ color: '#eab308', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.8rem' }}>
               <AlertTriangle size={14} /> Supplier may enter HIGH-RISK category.
             </div>
           )}
        </div>
      )}
    </div>
  );
};

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  
  const [formData, setFormData] = useState({ 
    name: '', contactPerson: '', contactEmail: '', phone: '', address: '', 
    category: '', productsServices: '', contractStart: '', contractEnd: '', status: 'Active' 
  });
  const [search, setSearch] = useState('');
  
  const { user } = useAuth();
  const isReadOnly = user?.role === 'Management';

  const setMockData = () => {
    setVendors([
      { 
        _id: '1', supplierId: 'SUP-001', name: 'Apex Global Logistics', category: 'Logistics', 
        contactPerson: 'Sarah Jenkins', contactEmail: 'sarah@apexglobal.com', phone: '+1 555-0101', address: '450 Freight Blvd, Chicago, IL',
        productsServices: 'International Freight, Warehousing', contractStart: '2025-01-01', contractEnd: '2027-12-31',
        status: 'Active', averageScore: 4.68, avgDelivery: 98.2, avgQuality: 96.0, avgCost: 91.5, avgCommunication: 95.0, avgResolution: 96.0, riskLevel: 'Excellent' 
      },
      { 
        _id: '2', supplierId: 'SUP-002', name: 'NovaTech Microelectronics', category: 'Electronics', 
        contactPerson: 'Dr. Aris Thorne', contactEmail: 'thorne@novatech-micro.io', phone: '+1 555-0102', address: '100 Silicon Way, San Jose, CA',
        productsServices: 'Arm Processors, IoT Sensor Hubs', contractStart: '2025-03-01', contractEnd: '2028-03-01',
        status: 'Active', averageScore: 4.85, avgDelivery: 99.0, avgQuality: 98.5, avgCost: 94.0, avgCommunication: 97.5, avgResolution: 98.0, riskLevel: 'Excellent' 
      },
      { 
        _id: '3', supplierId: 'SUP-003', name: 'Titanium Manufacturing Corp', category: 'Manufacturing', 
        contactPerson: 'Marcus Vance', contactEmail: 'marcus@titanium-mfg.com', phone: '+1 555-0103', address: '88 Industrial Way, Detroit, MI',
        productsServices: 'Aerospace Grade Bolts, CNC Milled Brackets', contractStart: '2024-06-01', contractEnd: '2026-12-31',
        status: 'Active', averageScore: 3.90, avgDelivery: 84.0, avgQuality: 86.5, avgCost: 71.0, avgCommunication: 80.0, avgResolution: 82.0, riskLevel: 'Average' 
      },
      { 
        _id: '4', supplierId: 'SUP-004', name: 'Vanguard Raw Materials Ltd', category: 'Raw Materials', 
        contactPerson: 'Claire Beauchamp', contactEmail: 'c.beauchamp@vanguardraw.com', phone: '+1 555-0104', address: '12 Harbor Road, Houston, TX',
        productsServices: 'Aluminum Ingots, High-tensile Steel', contractStart: '2025-02-15', contractEnd: '2027-02-15',
        status: 'Active', averageScore: 4.25, avgDelivery: 88.0, avgQuality: 92.0, avgCost: 84.0, avgCommunication: 85.0, avgResolution: 87.0, riskLevel: 'Good' 
      },
      { 
        _id: '5', supplierId: 'SUP-005', name: 'EcoPack Sustainable Solutions', category: 'Packaging', 
        contactPerson: 'Liam O’Connor', contactEmail: 'liam@ecopack-global.com', phone: '+1 555-0105', address: '22 Greenleaf Park, Portland, OR',
        productsServices: 'Recycled Corrugated Boxes, Protective Inserts', contractStart: '2025-04-01', contractEnd: '2026-10-01',
        status: 'Active', averageScore: 4.15, avgDelivery: 89.5, avgQuality: 88.0, avgCost: 87.0, avgCommunication: 82.0, avgResolution: 84.0, riskLevel: 'Good' 
      },
      { 
        _id: '6', supplierId: 'SUP-006', name: 'Quantum IT Cloud Solutions', category: 'IT Services', 
        contactPerson: 'Elena Rostova', contactEmail: 'elena@quantum-it.io', phone: '+1 555-0106', address: '500 Innovation Loop, Seattle, WA',
        productsServices: 'Enterprise ERP Hosting, Cloud SLA', contractStart: '2024-01-01', contractEnd: '2026-06-30',
        status: 'Under Review', averageScore: 3.15, avgDelivery: 68.0, avgQuality: 74.0, avgCost: 79.0, avgCommunication: 52.0, avgResolution: 64.0, riskLevel: 'Poor' 
      },
      { 
        _id: '7', supplierId: 'SUP-007', name: 'BioChem Synthetics Corp', category: 'Chemicals', 
        contactPerson: 'Dr. Victor Franke', contactEmail: 'v.franke@biochemsynth.de', phone: '+1 555-0107', address: '77 Chemical Corridor, Elizabeth, NJ',
        productsServices: 'Industrial Adhesives, Thermal Pastes', contractStart: '2024-09-01', contractEnd: '2026-09-01',
        status: 'Under Review', averageScore: 2.95, avgDelivery: 62.0, avgQuality: 58.0, avgCost: 67.0, avgCommunication: 55.0, avgResolution: 52.0, riskLevel: 'Critical' 
      },
      { 
        _id: '8', supplierId: 'SUP-008', name: 'Starlight Electronics Components', category: 'Electronics', 
        contactPerson: 'James Chen', contactEmail: 'james@starlight-elec.com', phone: '+1 555-0108', address: '9 Pioneer Zone, Austin, TX',
        productsServices: 'Surface Mount Capacitors, Micro-relays', contractStart: '2024-11-01', contractEnd: '2025-11-01',
        status: 'Under Review', averageScore: 2.40, avgDelivery: 48.0, avgQuality: 56.0, avgCost: 62.0, avgCommunication: 38.0, avgResolution: 42.0, riskLevel: 'Critical' 
      },
      { 
        _id: '9', supplierId: 'SUP-009', name: 'IronClad Heavy Fasteners', category: 'Manufacturing', 
        contactPerson: 'Kurt Schmidt', contactEmail: 'kurt@ironclad-fasteners.com', phone: '+1 555-0109', address: '3 Foundry Row, Pittsburgh, PA',
        productsServices: 'Heavy Duty Structural Rivets', contractStart: '2023-01-01', contractEnd: '2025-01-01',
        status: 'Blacklisted', averageScore: 1.85, avgDelivery: 35.0, avgQuality: 42.0, avgCost: 48.0, avgCommunication: 25.0, avgResolution: 30.0, riskLevel: 'Critical' 
      },
      { 
        _id: '10', supplierId: 'SUP-010', name: 'Solaris Green Energy', category: 'Energy', 
        contactPerson: 'Maya Lin', contactEmail: 'maya@solaris-energy.org', phone: '+1 555-0110', address: '150 Sunburst Drive, Phoenix, AZ',
        productsServices: 'Commercial Solar Inverters, Battery Banks', contractStart: '2026-01-10', contractEnd: '2028-01-10',
        status: 'Active', averageScore: 0, avgDelivery: 0, avgQuality: 0, avgCost: 0, avgCommunication: 0, avgResolution: 0, riskLevel: 'Pending' 
      }
    ]);
  };

  const fetchVendors = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/suppliers'));
      if (res.ok) {
        const data = await res.json();
        setVendors(data);
      } else {
        setMockData();
      }
    } catch {
      setMockData();
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const resetForm = () => {
    setFormData({ 
      name: '', contactPerson: '', contactEmail: '', phone: '', address: '', 
      category: '', productsServices: '', contractStart: '', contractEnd: '', status: 'Active' 
    });
    setEditingVendor(null);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    try {
      if (editingVendor) {
        const res = await fetch(apiUrl(`/api/suppliers/${editingVendor._id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          fetchVendors();
          setShowAddModal(false);
          resetForm();
        }
      } else {
        const res = await fetch(apiUrl('/api/suppliers'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          fetchVendors();
          setShowAddModal(false);
          resetForm();
        }
      }
    } catch (err) {
      console.error(err);
      setShowAddModal(false);
      resetForm();
    }
  };

  const handleEditVendor = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name || '',
      contactPerson: vendor.contactPerson || '',
      contactEmail: vendor.contactEmail || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      category: vendor.category || '',
      productsServices: vendor.productsServices || '',
      contractStart: vendor.contractStart ? vendor.contractStart.slice(0, 10) : '',
      contractEnd: vendor.contractEnd ? vendor.contractEnd.slice(0, 10) : '',
      status: vendor.status || 'Active'
    });
    setShowAddModal(true);
  };

  const handleDeleteVendor = async (vendor) => {
    if (!window.confirm(`Are you sure you want to delete supplier "${vendor.name}"?`)) return;
    try {
      const res = await fetch(apiUrl(`/api/suppliers/${vendor._id}`), {
        method: 'DELETE'
      });
      if (res.ok) {
        setVendors(prev => prev.filter(v => v._id !== vendor._id));
      } else {
        alert('Failed to delete supplier.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting supplier.');
    }
  };

  const [supplierPos, setSupplierPos] = useState([]);
  const [supplierIssues, setSupplierIssues] = useState([]);

  const openProfile = async (vendor) => {
    setSelectedVendor(vendor);
    setShowProfileModal(true);
    
    // Fetch related POs and Issues
    try {
      const poRes = await fetch(apiUrl(`/api/pos?supplierId=${vendor._id}`));
      if (poRes.ok) setSupplierPos(await poRes.json());
      
      const issueRes = await fetch(apiUrl(`/api/notifications?supplierId=${vendor._id}`));
      if (issueRes.ok) setSupplierIssues(await issueRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const filteredVendors = vendors.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));

  const toggleCompare = (vendor) => {
    if (selectedForCompare.find(v => v._id === vendor._id)) {
      setSelectedForCompare(selectedForCompare.filter(v => v._id !== vendor._id));
    } else {
      if (selectedForCompare.length < 3) {
        setSelectedForCompare([...selectedForCompare, vendor]);
      } else {
        alert('You can only compare up to 3 suppliers at a time.');
      }
    }
  };

  const getRecommendedSupplier = () => {
    if (selectedForCompare.length === 0) return null;
    return selectedForCompare.reduce((prev, current) => {
      return (current.averageScore || 0) > (prev.averageScore || 0) ? current : prev;
    });
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>Supplier Management</motion.h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <AnimatePresence>
            {selectedForCompare.length > 0 && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="btn-secondary" 
                onClick={() => setShowCompareModal(true)}
                style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
              >
                Compare ({selectedForCompare.length})
              </motion.button>
            )}
          </AnimatePresence>
          {!isReadOnly && (
            <motion.button 
              className="btn" 
              onClick={() => { resetForm(); setShowAddModal(true); }}
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }}
            >
              <Plus size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.5rem' }}/>
              Add Supplier
            </motion.button>
          )}
        </div>
      </div>

      <motion.div 
        className="card glass-panel" 
        style={{ padding: '0' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div style={{ padding: '1.5rem', borderBottom: 'var(--glass-border)' }}>
          <div style={{ position: 'relative', maxWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search suppliers..." 
              style={{ paddingLeft: '2.5rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>ID</th>
                <th>Supplier Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Risk Level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
              <AnimatePresence>
                {filteredVendors.map(vendor => (
                  <motion.tr key={vendor._id} variants={rowVariants} exit="exit" layout>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={!!selectedForCompare.find(v => v._id === vendor._id)}
                        onChange={() => toggleCompare(vendor)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{vendor.supplierId || 'SUP-XXX'}</td>
                    <td style={{ fontWeight: '500' }}>
                      {vendor.name}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{vendor.contactPerson}</div>
                    </td>
                    <td>{vendor.category}</td>
                    <td>
                      <span className={`badge ${
                        vendor.status === 'Active' ? 'badge-active' : 
                        vendor.status === 'Inactive' ? 'badge-inactive' : 'badge-review'
                      }`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 
                        vendor.riskLevel === 'Critical' ? '#ef4444' : 
                        vendor.riskLevel === 'Poor' ? '#f97316' : 
                        vendor.riskLevel === 'Average' ? '#eab308' : 
                        vendor.riskLevel === 'Good' ? '#3b82f6' : 
                        vendor.riskLevel === 'Excellent' ? 'var(--accent-primary)' : 
                        'var(--text-secondary)' 
                      }}>
                        {(vendor.riskLevel === 'Critical' || vendor.riskLevel === 'Poor') && <AlertTriangle size={14} />}
                        <span style={{ fontWeight: '600' }}>{vendor.riskLevel || 'Pending'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => openProfile(vendor)} className="btn-secondary" style={{ padding: '0.4rem 0.6rem', border: 'none', cursor: 'pointer' }} title="View Profile"><Eye size={16} /></button>
                        {!isReadOnly && user?.role !== 'Staff' && (
                          <>
                            <button onClick={() => handleEditVendor(vendor)} className="btn-secondary" style={{ padding: '0.4rem 0.6rem', border: 'none', cursor: 'pointer' }} title="Edit Supplier"><Edit2 size={16} /></button>
                            <button onClick={() => handleDeleteVendor(vendor)} className="btn-secondary" style={{ padding: '0.4rem 0.6rem', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Delete Supplier"><Trash2 size={16} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </motion.tbody>
          </table>
        </div>
      </motion.div>

      {/* Supplier Profile Detailed View Modal */}
      <AnimatePresence>
        {showProfileModal && selectedVendor && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, overflowY: 'auto', padding: '2rem' }}
            onClick={() => setShowProfileModal(false)}
          >
            <motion.div 
              className="card glass-panel" 
              style={{ 
                width: '100%', maxWidth: '500px', background: '#18181b', 
                border: '1px solid #3f3f46', fontFamily: 'monospace', 
                color: '#e4e4e7', padding: '2rem' 
              }}
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ textTransform: 'uppercase', margin: '0 0 1rem 0', letterSpacing: '1px' }}>{selectedVendor.name}</h3>
              <hr style={{ border: 'none', borderTop: '1px dashed #52525b', margin: '1rem 0' }}/>
              
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                 <div>Overall Score</div>
                 <div>
                   <span style={{ fontWeight: 'bold' }}>{selectedVendor.averageScore ? (selectedVendor.averageScore * 20).toFixed(1) : 'N/A'}</span>
                   <div style={{ color: '#eab308', fontSize: '12px', marginTop: '4px' }}>
                     {'★'.repeat(Math.round(selectedVendor.averageScore || 0))}
                   </div>
                 </div>
                 <div style={{ marginTop: '0.5rem' }}>Risk Level</div>
                 <div style={{ marginTop: '0.5rem', textTransform: 'uppercase', fontWeight: 'bold' }}>{selectedVendor.riskLevel || 'PENDING'}</div>
                 <div>Status</div>
                 <div style={{ textTransform: 'uppercase' }}>{selectedVendor.status}</div>
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderLeft: `4px solid ${
                  selectedVendor.riskLevel === 'Critical' ? '#ef4444' : 
                  selectedVendor.riskLevel === 'Poor' ? '#f97316' : 
                  selectedVendor.riskLevel === 'Average' ? '#eab308' : 
                  selectedVendor.riskLevel === 'Good' ? '#3b82f6' : 
                  selectedVendor.riskLevel === 'Excellent' ? 'var(--accent-primary)' : 
                  '#a1a1aa'
                }`}}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.3rem', fontSize: '0.9rem' }}>ACTION RECOMMENDATION</div>
                <div style={{ fontSize: '0.85rem' }}>
                  {selectedVendor.riskLevel === 'Critical' ? "Critical Risk — Halt orders. Review supplier delivery performance and initiate immediate corrective action." :
                   selectedVendor.riskLevel === 'Poor' ? "High Risk — Restrict volume. Review supplier performance and initiate corrective action." :
                   selectedVendor.riskLevel === 'Average' ? "Moderate Risk — Monitor closely for degrading performance." :
                   selectedVendor.riskLevel === 'Good' ? "Low Risk — Reliable supplier. Standard monitoring." :
                   selectedVendor.riskLevel === 'Excellent' ? "Excellent — Prioritize for bulk strategic orders." : "Pending sufficient data."}
                </div>
              </div>
              
              <hr style={{ border: 'none', borderTop: '1px dashed #52525b', margin: '1.5rem 0' }}/>
              
              <h4 style={{ textTransform: 'uppercase', margin: '0 0 1rem 0' }}>KPI PERFORMANCE</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '0.5rem' }}>
                 <div>Delivery</div><div>{selectedVendor.avgDelivery || 'N/A'}%</div>
                 <div>Quality</div><div>{selectedVendor.avgQuality || 'N/A'}%</div>
                 <div>Cost</div><div>{selectedVendor.avgCost || 'N/A'}%</div>
                 <div>Response</div><div>{selectedVendor.avgCommunication || 'N/A'}%</div>
                 <div>Compliance</div><div>{selectedVendor.avgResolution || 'N/A'}%</div>
              </div>
              
              <hr style={{ border: 'none', borderTop: '1px dashed #52525b', margin: '1.5rem 0' }}/>
              
              <h4 style={{ textTransform: 'uppercase', margin: '0 0 1rem 0' }}>PERFORMANCE TREND</h4>
              <SupplierTrendChart supplierId={selectedVendor._id} />
              
              <hr style={{ border: 'none', borderTop: '1px dashed #52525b', margin: '1.5rem 0' }}/>
              
              <h4 style={{ textTransform: 'uppercase', margin: '0 0 1rem 0' }}>PURCHASE ORDERS</h4>
              {supplierPos.length > 0 ? supplierPos.map(po => (
                 <div key={po._id} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '0.5rem', marginBottom: '0.3rem' }}>
                   <div>{po.poId}</div>
                   <div style={{ color: po.status === 'Delivered' ? '#e4e4e7' : 'var(--text-secondary)' }}>{po.status}</div>
                 </div>
              )) : <div style={{ color: '#a1a1aa' }}>No purchase orders</div>}
              
              <hr style={{ border: 'none', borderTop: '1px dashed #52525b', margin: '1.5rem 0' }}/>
              
              <h4 style={{ textTransform: 'uppercase', margin: '0 0 1rem 0' }}>RECENT ISSUES</h4>
              {supplierIssues.length > 0 ? supplierIssues.map(issue => (
                 <div key={issue._id} style={{ marginBottom: '0.5rem', color: issue.type === 'Critical' ? '#ef4444' : '#eab308' }}>
                   - {issue.title}
                 </div>
              )) : <div style={{ color: '#a1a1aa' }}>No critical issues</div>}
              
              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button type="button" onClick={() => setShowProfileModal(false)} style={{ background: 'transparent', border: '1px solid #52525b', color: '#a1a1aa', padding: '0.4rem 1rem', borderRadius: '50%', cursor: 'pointer' }}>
                  ↓
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supplier Comparison Modal */}
      <AnimatePresence>
        {showCompareModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, overflowY: 'auto', padding: '2rem' }}
            onClick={() => setShowCompareModal(false)}
          >
            <motion.div 
              className="card glass-panel" 
              style={{ width: '100%', maxWidth: '700px', background: '#18181b', border: '1px solid #3f3f46', fontFamily: 'monospace', color: '#e4e4e7', padding: '2rem' }}
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ textTransform: 'uppercase', margin: '0 0 1rem 0', letterSpacing: '1px' }}>Supplier Comparison Matrix</h3>
              <hr style={{ border: 'none', borderTop: '1px dashed #52525b', margin: '1.5rem 0' }}/>
              
              <div style={{ display: 'grid', gridTemplateColumns: `120px repeat(${selectedForCompare.length}, 1fr)`, gap: '1rem', textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{ textAlign: 'left', color: 'var(--text-secondary)' }}>Metric</div>
                {selectedForCompare.map(v => (
                  <strong key={v._id}>{v.name.split(' ')[0]}</strong>
                ))}
              </div>
              
              {['Delivery', 'Quality', 'Cost', 'Response'].map(metric => (
                <div key={metric} style={{ display: 'grid', gridTemplateColumns: `120px repeat(${selectedForCompare.length}, 1fr)`, gap: '1rem', textAlign: 'center', marginBottom: '0.8rem' }}>
                  <div style={{ textAlign: 'left', fontWeight: 'bold' }}>{metric}</div>
                  {selectedForCompare.map(v => (
                    <div key={v._id}>{v[`avg${metric === 'Response' ? 'Communication' : metric}`] || 'N/A'}%</div>
                  ))}
                </div>
              ))}
              
              <div style={{ display: 'grid', gridTemplateColumns: `120px repeat(${selectedForCompare.length}, 1fr)`, gap: '1rem', textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #3f3f46' }}>
                <div style={{ textAlign: 'left', fontWeight: 'bold' }}>Overall</div>
                {selectedForCompare.map(v => (
                  <strong key={v._id} style={{ color: 'var(--accent-primary)' }}>{v.averageScore ? (v.averageScore * 20).toFixed(1) : 'N/A'}</strong>
                ))}
              </div>
              
              <hr style={{ border: 'none', borderTop: '1px dashed #52525b', margin: '1.5rem 0' }}/>
              
              {getRecommendedSupplier() && (
                <div style={{ padding: '1rem', background: 'rgba(var(--accent-rgb), 0.1)', borderLeft: '4px solid #10b981' }}>
                  <div style={{ color: 'var(--accent-primary)', fontWeight: 'bold', marginBottom: '0.3rem' }}>RECOMMENDED SUPPLIER:</div>
                  <strong style={{ fontSize: '1.1rem' }}>{getRecommendedSupplier().name}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    Based on dynamic KPI weighting, this supplier yields the highest overall mathematical performance.
                  </div>
                </div>
              )}
              
              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button type="button" onClick={() => setShowCompareModal(false)} style={{ background: 'transparent', border: '1px solid #52525b', color: '#a1a1aa', padding: '0.4rem 1rem', borderRadius: '50%', cursor: 'pointer' }}>
                  Close Matrix
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Vendor Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, overflowY: 'auto', padding: '2rem' }}
          >
            <motion.div 
              className="card glass-panel" style={{ width: '100%', maxWidth: '700px', margin: 'auto' }}
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>{editingVendor ? 'Edit Supplier Profile' : 'Add New Supplier Profile'}</h2>
              <form onSubmit={handleAddSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Company Name *</label>
                    <input required type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <input required type="text" className="form-control" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Person</label>
                    <input type="text" className="form-control" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Email *</label>
                    <input required type="email" className="form-control" value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input type="text" className="form-control" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Blacklisted">Blacklisted</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Products / Services</label>
                    <input type="text" className="form-control" value={formData.productsServices} onChange={e => setFormData({...formData, productsServices: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contract Start</label>
                    <input type="date" className="form-control" value={formData.contractStart} onChange={e => setFormData({...formData, contractStart: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contract End</label>
                    <input type="date" className="form-control" value={formData.contractEnd} onChange={e => setFormData({...formData, contractEnd: e.target.value})} />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Business Address</label>
                  <input type="text" className="form-control" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn" style={{ flex: 1 }}>{editingVendor ? 'Update Supplier Profile' : 'Save Supplier Profile'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VendorManagement;
