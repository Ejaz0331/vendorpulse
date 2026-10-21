import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiUrl } from '../config/api';

const SystemConfig = () => {
  const [weights, setWeights] = useState({
    delivery: 20,
    quality: 20,
    cost: 20,
    response: 15,
    defect: 15,
    resolution: 10
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(apiUrl('/api/config'))
      .then(res => res.json())
      .then(data => {
        if (data.kpiWeights) setWeights(data.kpiWeights);
      })
      .catch(err => console.error(err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setWeights(prev => ({ ...prev, [name]: Number(value) }));
    setError('');
  };

  const total = Object.values(weights).reduce((a, b) => a + b, 0);

  const handleSave = async () => {
    if (total !== 100) {
      setError(`Weights must total exactly 100%. Current total: ${total}%`);
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/config'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights })
      });
      
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to save configuration');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>System Configuration</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Global KPI Weighting Engine</p>
        </div>
      </div>

      {success && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: '1rem', background: 'rgba(var(--accent-rgb), 0.15)', color: 'var(--accent-primary)', borderRadius: '8px', marginBottom: '1.5rem', borderLeft: '4px solid var(--accent-primary)' }}>
          System Configuration successfully updated! New weights will apply to all future assessments.
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderRadius: '8px', marginBottom: '1.5rem', borderLeft: '4px solid #ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {error}
        </motion.div>
      )}

      <div className="card glass-panel" style={{ maxWidth: '600px' }}>
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={20} /> Configure KPI Weights
        </h3>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Assign percentage weights to each KPI category. The mathematical engine will use these weights to calculate the overall supplier performance score. The total must equal exactly 100%.
        </p>

        <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
          <button 
            className="btn-secondary" 
            style={{ flex: 1, padding: '0.8rem', fontSize: '0.9rem' }}
            onClick={() => { setWeights({ delivery: 20, quality: 40, cost: 20, response: 10, defect: 5, resolution: 5 }); setError(''); }}
          >
            <strong>Manufacturing</strong><br/><span style={{ fontSize: '0.75rem', opacity: 0.8 }}>(Focus: Quality)</span>
          </button>
          <button 
            className="btn-secondary" 
            style={{ flex: 1, padding: '0.8rem', fontSize: '0.9rem' }}
            onClick={() => { setWeights({ delivery: 50, quality: 15, cost: 15, response: 10, defect: 5, resolution: 5 }); setError(''); }}
          >
            <strong>Logistics</strong><br/><span style={{ fontSize: '0.75rem', opacity: 0.8 }}>(Focus: Delivery)</span>
          </button>
          <button 
            className="btn-secondary" 
            style={{ flex: 1, padding: '0.8rem', fontSize: '0.9rem' }}
            onClick={() => { setWeights({ delivery: 15, quality: 15, cost: 10, response: 30, defect: 10, resolution: 20 }); setError(''); }}
          >
            <strong>IT Service</strong><br/><span style={{ fontSize: '0.75rem', opacity: 0.8 }}>(Focus: Response)</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(weights).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ flex: 1, textTransform: 'capitalize', fontWeight: '500' }}>
                {key === 'defect' ? 'Defect Rate' : key === 'response' ? 'Response Time' : key} Weight
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '0 0 150px' }}>
                <input 
                  type="number" 
                  name={key}
                  value={value}
                  onChange={handleChange}
                  className="form-control"
                  style={{ textAlign: 'right' }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>%</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: 'rgba(0,0,0,0.2)', 
          borderRadius: '8px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          border: `1px solid ${total === 100 ? 'var(--accent-primary)' : '#ef4444'}`
        }}>
          <span style={{ fontWeight: 'bold' }}>Total Weight</span>
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: total === 100 ? 'var(--accent-primary)' : '#ef4444' }}>
            {total}%
          </span>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'right' }}>
          <button onClick={handleSave} className="btn" disabled={total !== 100} style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
            <Save size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.5rem' }}/>
            Save Configuration
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SystemConfig;
