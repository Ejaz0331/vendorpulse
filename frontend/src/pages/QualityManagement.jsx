import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../config/api';

const QualityManagement = () => {
  const [inspections, setInspections] = useState([]);
  const [pos, setPos] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [formData, setFormData] = useState({
    po: '', supplier: '', totalItems: '', acceptedItems: '', rejectedItems: '', defectType: ''
  });

  const { user } = useAuth();
  const isReadOnly = user?.role === 'Management';

  const fetchData = useCallback(async () => {
    try {
      const [inspRes, poRes] = await Promise.all([
        fetch(apiUrl('/api/quality')),
        fetch(apiUrl('/api/pos'))
      ]);
      if (inspRes.ok) setInspections(await inspRes.json());
      if (poRes.ok) {
        const poData = await poRes.json();
        const deliveredPOs = poData.filter(p => p.status === 'Delivered');
        setPos(deliveredPOs);
        if (deliveredPOs.length > 0) {
          setFormData(f => ({ ...f, po: deliveredPOs[0]._id, supplier: deliveredPOs[0].supplier?._id || deliveredPOs[0].supplier, totalItems: deliveredPOs[0].quantity }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePoChange = (e) => {
    const selectedPoId = e.target.value;
    const selectedPo = pos.find(p => p._id === selectedPoId);
    setFormData({
      ...formData,
      po: selectedPoId,
      supplier: selectedPo?.supplier?._id || selectedPo?.supplier,
      totalItems: selectedPo?.quantity || ''
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/api/quality'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchData();
        setShowAddModal(false);
        setFormData({ po: pos[0]?._id, supplier: pos[0]?.supplier?._id, totalItems: pos[0]?.quantity, acceptedItems: '', rejectedItems: '', defectType: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Quality Management</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Log inspections to automatically update Supplier Quality KPIs.</p>
        </div>
        {!isReadOnly && (
          <button className="btn" onClick={() => setShowAddModal(true)}>
            <Plus size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.5rem' }}/>
            Log Inspection
          </button>
        )}
      </div>

      <div className="card glass-panel" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Insp ID</th>
                <th>PO Ref</th>
                <th>Supplier</th>
                <th>Inspection Results</th>
                <th>Defect Details</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map(insp => {
                const total = insp.totalItems || 1;
                const accepted = insp.acceptedItems || 0;
                const qScore = ((accepted / total) * 100).toFixed(1);
                return (
                  <tr key={insp._id}>
                    <td style={{ fontWeight: '500', color: 'var(--accent-primary)' }}>{insp.inspectionId}</td>
                    <td>{insp.po?.poId || 'Unknown'}</td>
                    <td style={{ fontWeight: '500' }}>{insp.supplier?.name || 'Unknown Supplier'}</td>
                    <td>
                      <div>Total: {insp.totalItems}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>Accepted: {insp.acceptedItems}</div>
                      <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>Rejected: {insp.rejectedItems}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginTop: '0.2rem', color: qScore >= 90 ? 'var(--accent-primary)' : qScore >= 75 ? '#f59e0b' : '#ef4444' }}>
                        Score: {qScore}%
                      </div>
                    </td>
                    <td>
                      {insp.defectType ? (
                        <span className="badge badge-review">{insp.defectType}</span>
                      ) : (
                        <span className="badge badge-active">No Defects</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={14} color="var(--text-secondary)" />
                        {formatDate(insp.inspectionDate)}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {inspections.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No quality inspections logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Inspection Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '2rem' }}
          >
            <motion.div className="card glass-panel" style={{ width: '100%', maxWidth: '600px' }} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}>
              <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Log Quality Inspection</h2>
              <form onSubmit={handleAddSubmit}>
                <div className="form-group">
                  <label className="form-label">Select Delivered PO *</label>
                  <select required className="form-control" value={formData.po} onChange={handlePoChange}>
                    {pos.map(p => <option key={p._id} value={p._id}>{p.poId} - {p.supplier?.name} ({p.quantity} units)</option>)}
                  </select>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Total Items *</label>
                    <input required type="number" min="1" className="form-control" value={formData.totalItems} onChange={e => setFormData({...formData, totalItems: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--accent-primary)' }}>Accepted *</label>
                    <input required type="number" min="0" className="form-control" value={formData.acceptedItems} onChange={e => setFormData({...formData, acceptedItems: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#ef4444' }}>Rejected *</label>
                    <input required type="number" min="0" className="form-control" value={formData.rejectedItems} onChange={e => setFormData({...formData, rejectedItems: e.target.value})} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label className="form-label">Defect Type (if any)</label>
                  <input type="text" className="form-control" value={formData.defectType} onChange={e => setFormData({...formData, defectType: e.target.value})} placeholder="e.g. Cosmetic Damage, Electrical Failure" />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn" style={{ flex: 1 }}>Submit Inspection & Run KPI</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default QualityManagement;
