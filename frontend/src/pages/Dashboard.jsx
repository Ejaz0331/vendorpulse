import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, TrendingUp, AlertTriangle, XCircle, Activity, Users, CheckCircle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { apiUrl } from '../config/api';

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }
};

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, active: 0, avgScore: 0, highRisk: 0 });
  const [networkAverages, setNetworkAverages] = useState({ delivery: 0, quality: 0, cost: 0, response: 0 });
  const [topSuppliers, setTopSuppliers] = useState([]);
  const [atRiskSuppliers, setAtRiskSuppliers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(apiUrl('/api/suppliers'));
        if (res.ok) {
          const vendors = await res.json();
          const scored = vendors.filter(v => v.averageScore > 0);
          
          // Network Averages for Progress Bars
          let tDel = 0, tQual = 0, tCost = 0, tResp = 0;
          scored.forEach(v => {
            tDel += v.avgDelivery || 0;
            tQual += v.avgQuality || 0;
            tCost += v.avgCost || 0;
            tResp += v.avgCommunication || 0;
          });
          const len = scored.length || 1;

          setNetworkAverages({
            delivery: Math.round(tDel / len),
            quality: Math.round(tQual / len),
            cost: Math.round(tCost / len),
            response: Math.round(tResp / len)
          });

          // Using < 80/100 as the threshold for appearing in the Risk Panel
          const atRisk = scored.filter(v => (v.averageScore * 20) < 80);
          
          setStats({
            total: vendors.length,
            active: vendors.filter(v => v.status === 'Active').length,
            avgScore: scored.length ? ((scored.reduce((sum, v) => sum + v.averageScore, 0) / scored.length) * 20).toFixed(1) : 0,
            highRisk: atRisk.length
          });
          
          const topList = [...scored]
            .sort((a,b) => b.averageScore - a.averageScore)
            .slice(0, 3)
            .map(v => ({ ...v, score100: parseFloat((v.averageScore * 20).toFixed(1)) }));
            
          setTopSuppliers(topList);
          setAtRiskSuppliers(atRisk);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const getRiskDetails = (vendor) => {
    const score = Math.round(vendor.averageScore * 20);
    let riskLevel = 'Low Risk';
    let riskColor = 'var(--accent-primary)';
    
    if (score < 60) { riskLevel = 'Critical'; riskColor = '#ef4444'; }
    else if (score < 70) { riskLevel = 'High Risk'; riskColor = '#f97316'; }
    else if (score < 80) { riskLevel = 'Medium Risk'; riskColor = '#eab308'; }

    const metrics = [
      { name: 'Delivery', val: vendor.avgDelivery || 100 },
      { name: 'Quality', val: vendor.avgQuality || 100 },
      { name: 'Cost', val: vendor.avgCost || 100 },
      { name: 'Response', val: vendor.avgCommunication || 100 },
      { name: 'Resolution', val: vendor.avgResolution || 100 }
    ];

    const problems = [];
    let lowestMetric = { name: '', val: 100 };

    metrics.forEach(m => {
      if (m.val < lowestMetric.val) lowestMetric = m;
      if (m.val < 70) problems.push({ icon: <XCircle size={14} color="#ef4444" />, text: `${m.name} performance: ${Math.round(m.val)}%`, color: '#ef4444' });
      else if (m.val < 80) problems.push({ icon: <AlertTriangle size={14} color="#eab308" />, text: `${m.name} performance: ${Math.round(m.val)}%`, color: '#eab308' });
    });

    let action = 'Review supplier contract and schedule performance meeting.';
    if (lowestMetric.name === 'Quality') action = 'Initiate immediate Quality Audit and freeze POs until resolved.';
    if (lowestMetric.name === 'Delivery') action = 'Review SLA terms, warn supplier, and prepare alternative vendor.';
    if (lowestMetric.name === 'Cost') action = 'Renegotiate pricing structure to meet market expectations.';
    if (lowestMetric.name === 'Response' || lowestMetric.name === 'Resolution') action = 'Escalate to management for immediate communication review.';

    return { score, riskLevel, riskColor, problems, action };
  };

  const ProgressBar = ({ label, value }) => (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
        <span style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontWeight: 'bold' }}>{value}%</span>
      </div>
      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${value}%` }} 
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ height: '100%', background: value >= 90 ? 'var(--accent-primary)' : value >= 75 ? '#3b82f6' : value >= 60 ? '#f59e0b' : '#ef4444', borderRadius: '4px' }} 
        />
      </div>
    </div>
  );

  return (
    <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: 0.1 }} style={{ paddingBottom: '2rem' }}>
      <motion.h1 variants={itemVariants} style={{ marginBottom: '2rem', textTransform: 'uppercase', fontSize: '1.5rem', letterSpacing: '1px', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '1rem' }}>
        Supplier Performance Dashboard
      </motion.h1>
      
      {/* 4 Top Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '2rem' }}>
        <motion.div variants={itemVariants} className="card glass-panel" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}><Users size={16} /> Total Suppliers</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>{stats.total}</p>
        </motion.div>
        <motion.div variants={itemVariants} className="card glass-panel" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} /> Active Suppliers</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>{stats.active}</p>
        </motion.div>
        <motion.div variants={itemVariants} className="card glass-panel" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}><Activity size={16} /> Average Score</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: 'var(--accent-primary)' }}>{stats.avgScore}</p>
        </motion.div>
        <motion.div variants={itemVariants} className="card glass-panel" style={{ textAlign: 'center', borderBottom: '4px solid #ef4444' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}><ShieldAlert size={16} color="#ef4444" /> High Risk Suppliers</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: '#ef4444' }}>{stats.highRisk}</p>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '2rem' }}>
        
        {/* Network Performance Overview */}
        <motion.div variants={itemVariants} className="card glass-panel">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Performance Overview (Network)</h3>
          <ProgressBar label="Delivery" value={networkAverages.delivery} />
          <ProgressBar label="Quality" value={networkAverages.quality} />
          <ProgressBar label="Cost" value={networkAverages.cost} />
          <ProgressBar label="Response" value={networkAverages.response} />
        </motion.div>

        {/* Top Suppliers List */}
        <motion.div variants={itemVariants} className="card glass-panel">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="var(--accent-primary)" /> Top Suppliers
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {topSuppliers.map((v, index) => (
              <div key={v._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>{index + 1}.</span>
                  <span style={{ fontWeight: '600' }}>{v.name}</span>
                </div>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{v.score100}</span>
              </div>
            ))}
            {topSuppliers.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>No scored suppliers available.</div>}
          </div>
        </motion.div>
      </div>

      {/* Attention Required / Automated Risk Detection */}
      <motion.div variants={itemVariants}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '1px' }}>
          <AlertTriangle size={20} /> ATTENTION REQUIRED
        </h3>
        
        {atRiskSuppliers.length === 0 ? (
          <div className="card glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No high risk vendors detected in the network.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            {atRiskSuppliers.map(vendor => {
              const details = getRiskDetails(vendor);
              return (
                <div key={vendor._id} className="card glass-panel" style={{ borderTop: `4px solid ${details.riskColor}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{vendor.name}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Score: <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{details.score}</span></div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: details.riskColor, fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
                    <AlertTriangle size={16} /> {details.riskLevel}
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Failing Metrics:</div>
                    {details.problems.length === 0 ? (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No specific isolated problems. Overall score dragged down evenly.</div>
                    ) : (
                      details.problems.map((prob, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '0.25rem', color: prob.color }}>
                          {prob.icon} {prob.text}
                        </div>
                      ))
                    )}
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Recommended Action:</div>
                    <div style={{ fontWeight: '500', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{details.action}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

    </motion.div>
  );
};

export default Dashboard;
