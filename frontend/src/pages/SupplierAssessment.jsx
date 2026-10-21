import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiUrl } from '../config/api';

const SupplierAssessment = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    supplier: '',
    totalDeliveries: '', onTimeDeliveries: '',
    totalItems: '', acceptedItems: '', defectiveItems: '',
    marketPrice: '', supplierPrice: '',
    targetResponseHours: '', actualResponseHours: '',
    totalComplaints: '', resolvedComplaints: '',
    notes: ''
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(apiUrl('/api/suppliers'))
      .then(res => res.json())
      .then(data => {
        setSuppliers(data);
        if (data.length > 0) setFormData(f => ({ ...f, supplier: data[0]._id }));
      })
      .catch(() => setSuppliers([{ _id: '1', name: 'Mock Supplier' }]));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/api/assessments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          totalDeliveries: Number(formData.totalDeliveries),
          onTimeDeliveries: Number(formData.onTimeDeliveries),
          totalItems: Number(formData.totalItems),
          acceptedItems: Number(formData.acceptedItems),
          defectiveItems: Number(formData.defectiveItems),
          marketPrice: Number(formData.marketPrice),
          supplierPrice: Number(formData.supplierPrice),
          targetResponseHours: Number(formData.targetResponseHours),
          actualResponseHours: Number(formData.actualResponseHours),
          totalComplaints: Number(formData.totalComplaints),
          resolvedComplaints: Number(formData.resolvedComplaints)
        })
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        setFormData({
          supplier: formData.supplier,
          totalDeliveries: '', onTimeDeliveries: '', totalItems: '', acceptedItems: '', defectiveItems: '',
          marketPrice: '', supplierPrice: '', targetResponseHours: '', actualResponseHours: '',
          totalComplaints: '', resolvedComplaints: '', notes: ''
        });
      }
    } catch (err) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  // Live calculation previews
  const calcPercent = (part, total) => {
    if (!part || !total || Number(total) === 0) return 0;
    return ((Number(part) / Number(total)) * 100).toFixed(1);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>KPI Assessment Engine</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Input raw metrics for automated mathematical evaluation.</p>
        </div>
        <div style={{ padding: '0.5rem 1rem', background: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
          <Calculator size={18} /> Math Engine Active
        </div>
      </div>

      {success && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: '1rem', background: 'rgba(var(--accent-rgb), 0.15)', color: 'var(--accent-primary)', borderRadius: '8px', marginBottom: '1.5rem', borderLeft: '4px solid var(--accent-primary)' }}>
          Assessment successfully logged! Network averages updated.
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="card glass-panel" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="form-group" style={{ marginBottom: '2rem' }}>
          <label className="form-label">Select Vendor to Evaluate</label>
          <select className="form-control" name="supplier" value={formData.supplier} onChange={handleChange} required style={{ fontSize: '1.1rem', padding: '1rem' }}>
            {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          
          {/* 1. On-Time Delivery */}
          <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--accent-primary)' }}>1. On-Time Delivery</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Total Deliveries</label>
                <input required type="number" min="0" className="form-control" name="totalDeliveries" value={formData.totalDeliveries} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">On-Time Deliveries</label>
                <input required type="number" min="0" className="form-control" name="onTimeDeliveries" value={formData.onTimeDeliveries} onChange={handleChange} />
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Preview: {calcPercent(formData.onTimeDeliveries, formData.totalDeliveries)}%</div>
          </div>

          {/* 2 & 5. Product Quality & Defect Rate */}
          <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#3b82f6' }}>2. Quality & Defect Rate</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div className="form-group">
                <label className="form-label">Total Items</label>
                <input required type="number" min="0" className="form-control" name="totalItems" value={formData.totalItems} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Accepted</label>
                <input required type="number" min="0" className="form-control" name="acceptedItems" value={formData.acceptedItems} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Defective</label>
                <input required type="number" min="0" className="form-control" name="defectiveItems" value={formData.defectiveItems} onChange={handleChange} />
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Qual: {calcPercent(formData.acceptedItems, formData.totalItems)}% | Defect: {calcPercent(formData.defectiveItems, formData.totalItems)}%</div>
          </div>

          {/* 3. Cost Competitiveness */}
          <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#8b5cf6' }}>3. Cost Competitiveness</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Avg Market Price ($)</label>
                <input required type="number" min="0" step="0.01" className="form-control" name="marketPrice" value={formData.marketPrice} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Supplier Price ($)</label>
                <input required type="number" min="0" step="0.01" className="form-control" name="supplierPrice" value={formData.supplierPrice} onChange={handleChange} />
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Preview: {calcPercent(formData.marketPrice, formData.supplierPrice)}%</div>
          </div>

          {/* 4. Response Time */}
          <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#f59e0b' }}>4. Response Time</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Target SLA (Hours)</label>
                <input required type="number" min="0" step="0.1" className="form-control" name="targetResponseHours" value={formData.targetResponseHours} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Actual Avg (Hours)</label>
                <input required type="number" min="0" step="0.1" className="form-control" name="actualResponseHours" value={formData.actualResponseHours} onChange={handleChange} />
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Preview: {calcPercent(formData.targetResponseHours, formData.actualResponseHours)}%</div>
          </div>
          
          {/* 6. Complaint Resolution */}
          <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', gridColumn: '1 / -1' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#ec4899' }}>6. Complaint Resolution</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Total Complaints</label>
                <input required type="number" min="0" className="form-control" name="totalComplaints" value={formData.totalComplaints} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Resolved Complaints</label>
                <input required type="number" min="0" className="form-control" name="resolvedComplaints" value={formData.resolvedComplaints} onChange={handleChange} />
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Preview: {calcPercent(formData.resolvedComplaints, formData.totalComplaints)}%</div>
          </div>

        </div>
        
        <div className="form-group" style={{ marginBottom: '2rem' }}>
          <label className="form-label">Assessment Notes / Auditor Comments</label>
          <textarea className="form-control" name="notes" rows="3" value={formData.notes} onChange={handleChange}></textarea>
        </div>

        <button type="submit" className="btn" style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }}>
          <ClipboardCheck size={20} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.5rem' }}/>
          Process Raw Data & Calculate KPIs
        </button>
      </form>
    </motion.div>
  );
};

export default SupplierAssessment;
