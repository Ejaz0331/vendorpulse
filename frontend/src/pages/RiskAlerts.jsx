import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import { apiUrl } from '../config/api';

const RiskAlerts = () => {
  const [notifications, setNotifications] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/notifications'));
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const markAsRead = async (id) => {
    try {
      await fetch(apiUrl(`/api/notifications/${id}/read`), { method: 'PUT' });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Risk & Alerts</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Comprehensive log of all automated KPI risk triggers and systemic alerts.</p>
        </div>
      </div>

      <div className="card glass-panel" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Alert Title</th>
                <th>Supplier</th>
                <th>Metric Drop</th>
                <th>Detected Reason</th>
                <th>Timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map(n => (
                <tr key={n._id} style={{ background: n.isRead ? 'transparent' : 'rgba(239, 68, 68, 0.05)' }}>
                  <td>
                    {n.type === 'Critical' ? (
                      <span className="badge badge-inactive" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', width: 'fit-content' }}><ShieldAlert size={14}/> Critical</span>
                    ) : (
                      <span className="badge badge-review" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', width: 'fit-content' }}><AlertTriangle size={14}/> Warning</span>
                    )}
                  </td>
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{n.title}</td>
                  <td style={{ fontWeight: '500' }}>{n.supplier?.name || 'System Wide'}</td>
                  <td>
                    {n.details ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)' }}>{n.details.previous}</span>
                        <span style={{ color: 'var(--accent-primary)' }}>→</span>
                        <span style={{ color: n.details.current < n.details.previous ? '#ef4444' : 'var(--text-primary)', fontWeight: 'bold' }}>{n.details.current}</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{n.details?.reason || n.message || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <Clock size={14} />
                      {formatDate(n.createdAt)}
                    </div>
                  </td>
                  <td>
                    {n.isRead ? (
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem' }}><CheckCircle size={14}/> Reviewed</span>
                    ) : (
                      <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => markAsRead(n._id)}>
                        Mark Reviewed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {notifications.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No alerts in the system. Your supply chain is healthy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default RiskAlerts;
