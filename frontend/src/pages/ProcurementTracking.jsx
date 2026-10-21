import React, { useState, useEffect, useCallback } from 'react';
import { Plus, CheckCircle, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../config/api';

const ProcurementTracking = () => {
  const [pos, setPos] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(null);
  const [actualDeliveryDate, setActualDeliveryDate] = useState('');
  
  const [formData, setFormData] = useState({
    supplier: '', products: '', quantity: '', orderValue: '', expectedDelivery: ''
  });

  const { user } = useAuth();
  const isReadOnly = user?.role === 'Management';

  const fetchData = useCallback(async () => {
    try {
      const [poRes, supRes] = await Promise.all([
        fetch(apiUrl('/api/pos')),
        fetch(apiUrl('/api/suppliers'))
      ]);
      if (poRes.ok) setPos(await poRes.json());
      if (supRes.ok) {
        const supData = await supRes.json();
        setSuppliers(supData);
        if (supData.length > 0) setFormData(f => ({ ...f, supplier: supData[0]._id }));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!user?._id) {
      alert('Authentication error. Please re-login.');
      return;
    }
    try {
      const payload = {
        ...formData,
        createdBy: user._id
      };
      
      const res = await fetch(apiUrl('/api/pos'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchData();
        setShowAddModal(false);
        setFormData({ supplier: suppliers[0]?._id || '', products: '', quantity: '', orderValue: '', expectedDelivery: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkDelivered = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl(`/api/pos/${showDeliverModal}/deliver`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actualDelivery: actualDeliveryDate })
      });
      if (res.ok) {
        fetchData();
        setShowDeliverModal(null);
        setActualDeliveryDate('');
        alert('PO marked delivered! Automated KPI successfully updated for this supplier.');
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
          <h1 style={{ margin: 0 }}>Purchase Order Tracking</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Manage orders and automatically update supplier delivery KPIs.</p>
        </div>
        {!isReadOnly && (
          <button className="btn" onClick={() => setShowAddModal(true)}>
            <Plus size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.5rem' }}/>
            Create PO
          </button>
        )}
      </div>

      <div className="card glass-panel" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>PO ID</th>
                <th>Supplier</th>
                <th>Order Details</th>
                <th>Created By</th>
                <th>Expected Delivery</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pos.map(po => (
                <tr key={po._id}>
                  <td style={{ fontWeight: '500', color: 'var(--accent-primary)' }}>{po.poId}</td>
                  <td style={{ fontWeight: '500' }}>{po.supplier?.name || 'Unknown Supplier'}</td>
                  <td>
                    <div>{po.products}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Qty: {po.quantity} | Value: ${po.orderValue}</div>
                  </td>
                  <td>
                    {po.createdBy ? (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {po.createdBy.username} <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>({po.createdBy.role})</span>
                      </span>
                    ) : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} color="var(--text-secondary)" />
                      {formatDate(po.expectedDelivery)}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${po.status === 'Delivered' ? 'badge-active' : po.status === 'Pending' ? 'badge-review' : 'badge-inactive'}`}>
                      {po.status}
                    </span>
                  </td>
                  <td>
                    {!isReadOnly && po.status !== 'Delivered' && (
                      <button 
                        onClick={() => setShowDeliverModal(po._id)}
                        className="btn-secondary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                      >
                        <CheckCircle size={14} style={{ display: 'inline', marginRight: '0.4rem' }} />
                        Mark Delivered
                      </button>
                    )}
                    {po.status === 'Delivered' && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Delivered on: <br/>{formatDate(po.actualDelivery)}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {pos.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No Purchase Orders found. Create one to start tracking.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add PO Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '2rem' }}
          >
            <motion.div className="card glass-panel" style={{ width: '100%', maxWidth: '600px' }} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}>
              <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Create Purchase Order</h2>
              <form onSubmit={handleAddSubmit}>
                <div className="form-group">
                  <label className="form-label">Supplier *</label>
                  <select required className="form-control" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})}>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Products / Description *</label>
                  <input required type="text" className="form-control" value={formData.products} onChange={e => setFormData({...formData, products: e.target.value})} placeholder="e.g. 500 Microcontrollers" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Quantity *</label>
                    <input required type="number" min="1" className="form-control" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Order Value ($) *</label>
                    <input required type="number" min="0" step="0.01" className="form-control" value={formData.orderValue} onChange={e => setFormData({...formData, orderValue: e.target.value})} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label className="form-label">Expected Delivery Date *</label>
                  <input required type="date" className="form-control" value={formData.expectedDelivery} onChange={e => setFormData({...formData, expectedDelivery: e.target.value})} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn" style={{ flex: 1 }}>Issue PO</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mark Delivered Modal */}
      <AnimatePresence>
        {showDeliverModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '2rem' }}
          >
            <motion.div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', borderLeft: '4px solid var(--accent-primary)' }} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}>
              <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Mark PO as Delivered</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Entering the actual delivery date will automatically trigger the KPI Engine to evaluate this supplier's On-Time Delivery performance.
              </p>
              <form onSubmit={handleMarkDelivered}>
                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label className="form-label">Actual Delivery Date *</label>
                  <input required type="date" className="form-control" value={actualDeliveryDate} onChange={e => setActualDeliveryDate(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeliverModal(null)}>Cancel</button>
                  <button type="submit" className="btn" style={{ flex: 1 }}>Confirm Delivery</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default ProcurementTracking;
