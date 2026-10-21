import React, { useState, useEffect } from 'react';
import { Download, CheckSquare, XSquare, AlertCircle, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { apiUrl } from '../config/api';

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }
};

const Reports = () => {
  const [vendors, setVendors] = useState([]);
  
  // PDF Report State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSupplier, setReportSupplier] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [reportData, setReportData] = useState(null);
  
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await fetch(apiUrl('/api/suppliers'));
        if (res.ok) {
          const data = await res.json();
          setVendors(data.filter(v => v.averageScore > 0));
        } else {
          setMockData();
        }
      } catch {
        setMockData();
      }
    };
    fetchVendors();
  }, []);

  const setMockData = () => {
    setVendors([
      { _id: '1', name: 'NovaTech Microelectronics', avgDelivery: 99, avgQuality: 98, avgCost: 94, avgCommunication: 97, avgResolution: 98, averageScore: 4.85 },
      { _id: '2', name: 'Apex Global Logistics', avgDelivery: 98, avgQuality: 96, avgCost: 91, avgCommunication: 95, avgResolution: 96, averageScore: 4.68 },
      { _id: '3', name: 'Vanguard Raw Materials', avgDelivery: 88, avgQuality: 92, avgCost: 84, avgCommunication: 85, avgResolution: 87, averageScore: 4.25 },
      { _id: '4', name: 'EcoPack Packaging', avgDelivery: 89, avgQuality: 88, avgCost: 87, avgCommunication: 82, avgResolution: 84, averageScore: 4.15 },
      { _id: '5', name: 'Titanium Manufacturing', avgDelivery: 84, avgQuality: 86, avgCost: 71, avgCommunication: 80, avgResolution: 82, averageScore: 3.90 },
      { _id: '6', name: 'Quantum IT Solutions', avgDelivery: 68, avgQuality: 74, avgCost: 79, avgCommunication: 52, avgResolution: 64, averageScore: 3.15 },
      { _id: '7', name: 'BioChem Synthetics', avgDelivery: 62, avgQuality: 58, avgCost: 67, avgCommunication: 55, avgResolution: 52, averageScore: 2.95 },
      { _id: '8', name: 'Starlight Electronics', avgDelivery: 48, avgQuality: 56, avgCost: 62, avgCommunication: 38, avgResolution: 42, averageScore: 2.40 },
      { _id: '9', name: 'IronClad Fasteners', avgDelivery: 35, avgQuality: 42, avgCost: 48, avgCommunication: 25, avgResolution: 30, averageScore: 1.85 }
    ]);
  };

  const getDecision = (score) => {
    if (score >= 4.5) return { text: "Excellent", icon: <CheckSquare size={16}/>, color: 'var(--accent-primary)' }; // 90+
    if (score >= 4.0) return { text: "Good", icon: <CheckSquare size={16}/>, color: '#3b82f6' }; // 80+
    if (score >= 3.5) return { text: "Average", icon: <AlertCircle size={16}/>, color: '#eab308' }; // 70+
    if (score >= 3.0) return { text: "Poor", icon: <AlertCircle size={16}/>, color: '#f97316' }; // 60+
    return { text: "Critical", icon: <XSquare size={16}/>, color: '#ef4444' }; // <60
  };

  // Prepare data for the BarChart
  const barChartData = vendors
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 5)
    .map(v => ({
      name: v.name,
      Delivery: v.avgDelivery || 0,
      Quality: v.avgQuality || 0,
      Cost: v.avgCost || 0,
      Response: v.avgCommunication || 0,
      Resolution: v.avgResolution || 0
    }));

  // Prepare data for the PieChart (Network Health Breakdown)
  const decisionCounts = vendors.reduce((acc, v) => {
    const decision = getDecision(v.averageScore).text;
    acc[decision] = (acc[decision] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(decisionCounts).map(key => ({
    name: key,
    value: decisionCounts[key]
  }));

  const PIE_COLORS = {
    "Excellent": 'var(--accent-primary)', 
    "Good": "#3b82f6", 
    "Average": "#eab308",
    "Poor": "#f97316",
    "Critical": "#ef4444"
  };

  const handleGenerateReport = async () => {
    if (!reportSupplier) return;
    try {
      const res = await fetch(apiUrl(`/api/assessments?supplierId=${reportSupplier}`));
      if (res.ok) {
        const assessments = await res.json();
        
        let filtered = assessments;
        if (reportDate) {
          const startD = new Date(reportDate);
          startD.setHours(0, 0, 0, 0);
          const endD = new Date(reportDate);
          endD.setHours(23, 59, 59, 999);
          
          filtered = filtered.filter(a => {
            const date = new Date(a.createdAt);
            return date >= startD && date <= endD;
          });
        }

        const vendor = vendors.find(v => v._id === reportSupplier);
        let avgOverall;

        if (filtered.length === 0) {
          // If no specific data for this period, fallback to lifetime average so report can still be downloaded
          avgOverall = vendor && vendor.averageScore ? (vendor.averageScore * 20).toFixed(1) : '0.0';
        } else {
          // Calculate averages for the period
          const sum = filtered.reduce((acc, a) => {
            acc.Overall += parseFloat(a.overallScore);
            return acc;
          }, { Overall: 0 });
          avgOverall = (sum.Overall / filtered.length).toFixed(1); // 0-100 scale
        }

        const score100 = parseFloat(avgOverall);
        let riskLevel = 'LOW';
        let riskColor = 'var(--accent-primary)';
        if (score100 < 60) { riskLevel = 'CRITICAL'; riskColor = '#ef4444'; }
        else if (score100 < 80) { riskLevel = 'HIGH'; riskColor = '#f97316'; }
        
        setReportData({
          supplierName: vendor ? vendor.name : 'Unknown',
          period: reportDate ? reportDate : 'All Time',
          overall: avgOverall,
          delivery: vendor.avgDelivery || 100,
          quality: vendor.avgQuality || 100,
          cost: vendor.avgCost || 100,
          response: vendor.avgCommunication || 100,
          risk: riskLevel,
          riskColor
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: 0.1 }}>
      <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }} className="print-hide">
        <div>
          <h1 style={{ margin: 0 }}>Supplier Analytics & Evaluation</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Comprehensive KPI breakdown resolving scattered data.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowReportModal(true)}>
          <Download size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.5rem' }}/>
          Export PDF Report
        </button>
      </motion.div>

      {/* Graphical Data Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Bar Chart */}
        <motion.div variants={itemVariants} className="card glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.5rem 0' }}>KPI Comparative Analysis</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis domain={[0, 100]} stroke="var(--text-secondary)" tickFormatter={(tick) => `${tick}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--shadow-lg)' }}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Delivery" fill='var(--accent-primary)' radius={[4, 4, 0, 0]} />
                <Bar dataKey="Quality" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Cost" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Response" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Resolution" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* New Pie Chart */}
        <motion.div variants={itemVariants} className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1rem 0', textAlign: 'center' }}>Overall Network Health</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', margin: '0 0 1rem 0' }}>Proportion of supplier statuses</p>
          <div style={{ flex: 1, minHeight: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || '#3b82f6'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Exact Match of User's Requested Table */}
      <motion.div variants={itemVariants} className="card glass-panel" style={{ padding: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: 'var(--glass-border)' }}>
          <h3 style={{ margin: 0 }}>Automated Performance Breakdown</h3>
        </div>
        <div className="table-container print-hide" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Delivery</th>
                <th>Quality</th>
                <th>Cost</th>
                <th>Response</th>
                <th>Defect Rate</th>
                <th>Resolution</th>
                <th>Overall Score</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No evaluation data available.</td></tr>
              ) : vendors.map(v => {
                const decision = getDecision(v.averageScore);
                return (
                  <tr key={v._id}>
                    <td style={{ fontWeight: '500' }}>
                      {v.name}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: decision.color, fontSize: '0.8rem', marginTop: '0.2rem' }}>
                        {decision.icon}
                        {decision.text}
                      </div>
                    </td>
                    <td>{v.avgDelivery || 0}%</td>
                    <td>{v.avgQuality || 0}%</td>
                    <td>{v.avgCost || 0}%</td>
                    <td>{v.avgCommunication || 0}%</td>
                    <td>{v.avgDefect || 0}%</td>
                    <td>{v.avgResolution || 0}%</td>
                    <td>
                      <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                        {(v.averageScore * 20).toFixed(1)} / 100
                      </span> 
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* PDF Generation Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '2rem', overflowY: 'auto' }}
            className="print-hide"
          >
            <motion.div 
              className="card glass-panel" 
              style={{ width: '100%', maxWidth: '600px', background: '#1c1c1c', border: '1px solid #333' }}
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--accent-primary)' }}>Generate Supplier Performance Report</h3>
                <X size={20} color="var(--text-secondary)" style={{ cursor: 'pointer' }} onClick={() => setShowReportModal(false)} />
              </div>
              
              {!reportData ? (
                <div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Select Supplier</label>
                    <select className="form-control" style={{ background: 'rgba(0,0,0,0.2)' }} value={reportSupplier} onChange={e => setReportSupplier(e.target.value)}>
                      <option value="">-- Choose a Supplier --</option>
                      {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                    </select>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label>Report Date (Specific Day)</label>
                    <input type="date" className="form-control" style={{ background: 'rgba(0,0,0,0.2)' }} value={reportDate} onChange={e => setReportDate(e.target.value)} />
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <button className="btn btn-primary" onClick={handleGenerateReport} disabled={!reportSupplier}>Generate Data</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '1.5rem', background: '#222', padding: '1.5rem', borderRadius: '8px', border: '1px solid #444' }}>
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Supplier:</p>
                    <h4 style={{ margin: '0 0 1rem 0' }}>{reportData.supplierName}</h4>
                    
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Period:</p>
                    <h4 style={{ margin: '0 0 1rem 0' }}>{reportData.period}</h4>
                    
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Overall Score:</p>
                    <h4 style={{ margin: '0 0 1rem 0', color: 'var(--accent-primary)', fontSize: '1.5rem' }}>{reportData.overall}</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <p style={{ margin: '0 0 0.2rem 0', color: 'var(--text-secondary)' }}>Delivery:</p>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>{reportData.delivery}%</p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 0.2rem 0', color: 'var(--text-secondary)' }}>Quality:</p>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>{reportData.quality}%</p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 0.2rem 0', color: 'var(--text-secondary)' }}>Cost:</p>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>{reportData.cost}%</p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 0.2rem 0', color: 'var(--text-secondary)' }}>Response:</p>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>{reportData.response}%</p>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #444' }}>
                      <p style={{ margin: '0 0 0.2rem 0', color: 'var(--text-secondary)' }}>Risk:</p>
                      <p style={{ margin: 0, fontWeight: 'bold', color: reportData.riskColor }}>{reportData.risk}</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button className="btn btn-secondary" onClick={() => setReportData(null)}>Back</button>
                    <button className="btn btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={18} /> Print to PDF
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Printable Area */}
      {reportData && (
        <div id="printable-report" className="print-only">
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: 'black', marginBottom: '5px' }}>Supplier Performance Report</h1>
            <p style={{ color: '#555', fontSize: '14px', margin: 0 }}>Generated on: {new Date().toLocaleDateString()}</p>
          </div>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
            <div style={{ flex: 1, border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0, color: 'black' }}>Supplier Details</h3>
              <p style={{ color: 'black' }}><strong>Name:</strong> {reportData.supplierName}</p>
              <p style={{ color: 'black' }}><strong>Period:</strong> {reportData.period}</p>
              <p style={{ color: 'black' }}><strong>Risk Level:</strong> <span style={{ color: reportData.riskColor, fontWeight: 'bold' }}>{reportData.risk}</span></p>
            </div>
            
            <div style={{ flex: 1, border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0, color: 'black' }}>Key Metrics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', color: 'black' }}>
                <div><strong>Overall Score:</strong> {reportData.overall} / 100</div>
                <div><strong>Delivery:</strong> {reportData.delivery}%</div>
                <div><strong>Quality:</strong> {reportData.quality}%</div>
                <div><strong>Cost:</strong> {reportData.cost}%</div>
                <div><strong>Response:</strong> {reportData.response}%</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <div style={{ flex: '1', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0, color: 'black', textAlign: 'center', fontSize: '16px' }}>Network Health (All Suppliers)</h3>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <PieChart width={250} height={200}>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || '#3b82f6'} />)}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: 'black', fontSize: '12px' }} />
                </PieChart>
              </div>
            </div>
            
            <div style={{ flex: '2', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0, color: 'black', textAlign: 'center', fontSize: '16px' }}>KPI Comparison (Top 5)</h3>
              <BarChart width={450} height={200} data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="black" tick={{ fill: 'black', fontSize: 11 }} />
                <YAxis stroke="black" tick={{ fill: 'black', fontSize: 11 }} />
                <Legend wrapperStyle={{ paddingTop: '5px', color: 'black', fontSize: '12px' }} />
                <Bar dataKey="Delivery" fill='var(--accent-primary)' />
                <Bar dataKey="Quality" fill="#3b82f6" />
                <Bar dataKey="Cost" fill="#8b5cf6" />
              </BarChart>
            </div>
          </div>

          <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', pageBreakInside: 'avoid' }}>
            <h3 style={{ margin: 0, padding: '12px 15px', background: '#f8f9fa', borderBottom: '1px solid #ddd', color: 'black', fontSize: '16px' }}>Detailed Supplier Comparison</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', color: 'black' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '8px 10px', borderBottom: '2px solid #ddd' }}>Supplier</th>
                  <th style={{ padding: '8px 10px', borderBottom: '2px solid #ddd' }}>Delivery</th>
                  <th style={{ padding: '8px 10px', borderBottom: '2px solid #ddd' }}>Quality</th>
                  <th style={{ padding: '8px 10px', borderBottom: '2px solid #ddd' }}>Cost</th>
                  <th style={{ padding: '8px 10px', borderBottom: '2px solid #ddd' }}>Overall</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map(v => (
                  <tr key={v._id} style={{ borderBottom: '1px solid #eee', background: v._id === reportSupplier ? '#eff6ff' : 'transparent' }}>
                    <td style={{ padding: '8px 10px', fontWeight: v._id === reportSupplier ? 'bold' : 'normal' }}>
                      {v.name} {v._id === reportSupplier && '(Selected)'}
                    </td>
                    <td style={{ padding: '8px 10px' }}>{v.avgDelivery || 0}%</td>
                    <td style={{ padding: '8px 10px' }}>{v.avgQuality || 0}%</td>
                    <td style={{ padding: '8px 10px' }}>{v.avgCost || 0}%</td>
                    <td style={{ padding: '8px 10px', fontWeight: 'bold' }}>{(v.averageScore * 20).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default Reports;
