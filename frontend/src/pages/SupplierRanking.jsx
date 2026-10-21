import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Filter, Medal } from 'lucide-react';
import { apiUrl } from '../config/api';

const SupplierRanking = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await fetch(apiUrl('/api/suppliers'));
        if (res.ok) {
          const data = await res.json();
          // Filter out suppliers with no score (or 0)
          const scoredSuppliers = data.filter(s => s.averageScore > 0);
          // Sort descending
          scoredSuppliers.sort((a, b) => b.averageScore - a.averageScore);
          setSuppliers(scoredSuppliers);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSuppliers();
  }, []);

  const categories = ['All', ...new Set(suppliers.map(s => s.category))].filter(Boolean);
  const risks = ['All', 'Excellent', 'Good', 'Average', 'Poor', 'Critical'];

  const filteredSuppliers = suppliers.filter(s => {
    if (filterCategory !== 'All' && s.category !== filterCategory) return false;
    if (filterRisk !== 'All' && s.riskLevel !== filterRisk) return false;
    return true;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Trophy color="var(--accent-primary)" /> Supplier Ranking Leaderboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Global stack-rank of all active suppliers based on lifetime KPI performance.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '2rem' }}>
        
        {/* Sidebar Filters */}
        <div className="card glass-panel" style={{ height: 'fit-content' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
            <Filter size={18} /> Filters
          </h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Category</label>
            <select 
              className="form-control" 
              value={filterCategory} 
              onChange={e => setFilterCategory(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.2)' }}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Risk Level</label>
            <select 
              className="form-control" 
              value={filterRisk} 
              onChange={e => setFilterRisk(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.2)' }}
            >
              {risks.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="card glass-panel" style={{ padding: 0 }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                  <th>Supplier</th>
                  <th>Category</th>
                  <th>Risk Level</th>
                  <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier, index) => {
                  const actualRank = index + 1; // Assuming array is pre-sorted
                  const score100 = (supplier.averageScore * 20).toFixed(1);
                  
                  let rankDisplay = actualRank;
                  if (actualRank === 1) rankDisplay = <Medal size={24} color="#fbbf24" />; // Gold
                  else if (actualRank === 2) rankDisplay = <Medal size={24} color="#94a3b8" />; // Silver
                  else if (actualRank === 3) rankDisplay = <Medal size={24} color="#b45309" />; // Bronze

                  return (
                    <tr key={supplier._id} style={{ background: actualRank <= 3 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: actualRank <= 3 ? '1.2rem' : '1rem' }}>
                        {rankDisplay}
                      </td>
                      <td style={{ fontWeight: actualRank <= 3 ? 'bold' : '500', fontSize: actualRank <= 3 ? '1.1rem' : '1rem' }}>
                        {supplier.name}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{supplier.category}</td>
                      <td>
                        <span className={`badge ${
                          supplier.riskLevel === 'Excellent' ? 'badge-active' :
                          supplier.riskLevel === 'Critical' || supplier.riskLevel === 'Poor' ? 'badge-inactive' : 'badge-review'
                        }`}>
                          {supplier.riskLevel}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)', fontSize: '1.1rem' }}>
                        {score100}
                      </td>
                    </tr>
                  );
                })}
                {filteredSuppliers.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                      No suppliers found matching the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default SupplierRanking;
