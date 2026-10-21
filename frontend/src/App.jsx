import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileBarChart, ClipboardCheck, ShoppingCart, Bell, LogOut, Settings, BarChart2, Trophy, Sun, Moon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VendorManagement from './pages/VendorManagement';
import SupplierAssessment from './pages/SupplierAssessment';
import ProcurementTracking from './pages/ProcurementTracking';
import QualityManagement from './pages/QualityManagement';
import SupplierRanking from './pages/SupplierRanking';
import Reports from './pages/Reports';
import SystemConfig from './pages/SystemConfig';
import RiskAlerts from './pages/RiskAlerts';
import Chatbot from './components/Chatbot';
import { apiUrl } from './config/api';
import './index.css';

const SidebarLink = ({ to, icon: Icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
        background: isActive ? 'rgba(var(--accent-rgb), 0.1)' : 'transparent',
        transition: 'all 0.2s ease',
        fontWeight: isActive ? '600' : '500',
        textDecoration: 'none',
        position: 'relative'
      }}
      onMouseOver={(e) => {
        if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseOut={(e) => {
        if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      <Icon size={20} />
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
      {isActive && (
        <motion.div 
          layoutId="sidebar-active-indicator"
          style={{
            position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
            background: 'rgba(var(--accent-rgb), 0.15)', borderRadius: '8px', zIndex: 0
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </Link>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
        <Route path="/vendors" element={<PageWrapper><VendorManagement /></PageWrapper>} />
        <Route path="/assessments" element={<PageWrapper><SupplierAssessment /></PageWrapper>} />
        <Route path="/procurement" element={<PageWrapper><ProcurementTracking /></PageWrapper>} />
        <Route path="/quality" element={<PageWrapper><QualityManagement /></PageWrapper>} />
        <Route path="/ranking" element={<PageWrapper><SupplierRanking /></PageWrapper>} />
        <Route path="/alerts" element={<PageWrapper><RiskAlerts /></PageWrapper>} />
        <Route path="/reports" element={<PageWrapper><Reports /></PageWrapper>} />
        <Route path="/config" element={<PageWrapper><SystemConfig /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

const PageWrapper = ({ children }) => (
  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }} style={{ height: '100%' }}>
    {children}
  </motion.div>
);

const MainApp = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.body.classList.toggle('light-theme', theme === 'light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const res = await fetch(apiUrl('/api/notifications'));
          if (res.ok) {
            const data = await res.json();
            setNotifications(data);
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchNotifications();
      
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await fetch(apiUrl(`/api/notifications/${id}/read`), { method: 'PUT' });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-container">
      <aside className="sidebar glass-panel">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 2rem 0.5rem' }}>
            <span className="logo-glow">VENDOR</span>PULSE
          </h2>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <SidebarLink to="/" icon={LayoutDashboard}>Dashboard</SidebarLink>
          <SidebarLink to="/vendors" icon={Users}>Suppliers</SidebarLink>
          
          {user.role === 'Admin' && <SidebarLink to="/config" icon={Settings}>KPI Management</SidebarLink>}
          {user.role !== 'Staff' && <SidebarLink to="/assessments" icon={ClipboardCheck}>Supplier Evaluation</SidebarLink>}
          
          <SidebarLink to="/procurement" icon={ShoppingCart}>Purchase Orders</SidebarLink>
          <SidebarLink to="/quality" icon={ClipboardCheck}>Quality Management</SidebarLink>
          <SidebarLink to="/ranking" icon={Trophy}>Supplier Ranking</SidebarLink>
          <SidebarLink to="/alerts" icon={Bell}>Risk & Alerts</SidebarLink>
          
          {user.role !== 'Staff' && <SidebarLink to="/reports" icon={BarChart2}>Reports</SidebarLink>}
        </nav>
      </aside>

      <main className="main-content" style={{ display: 'flex', flexDirection: 'column' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', position: 'relative' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
             {/* Role Badge Indicator */}
             <div style={{ padding: '0.4rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '999px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
               Logged in as: <strong style={{ color: 'var(--accent-primary)' }}>{user.role}</strong> ({user.username})
             </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Theme Toggle */}
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="btn-secondary"
              style={{ padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="btn-secondary" 
                style={{ padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', border: '1px solid var(--border-color)', position: 'relative', background: showNotifications ? 'rgba(255,255,255,0.1)' : 'transparent' }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel (Module 15) */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    style={{ position: 'absolute', top: '120%', right: 0, width: '400px', maxHeight: '500px', overflowY: 'auto', background: '#1c1c1c', border: '1px solid #333', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 100, padding: '1rem' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #333' }}>
                      <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Notifications</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{unreadCount} unread</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {notifications.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>No alerts at this time.</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n._id} onClick={() => markAsRead(n._id)} style={{ background: n.isRead ? 'rgba(255,255,255,0.03)' : 'rgba(239, 68, 68, 0.05)', border: n.isRead ? '1px solid #333' : '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '1rem', cursor: 'pointer', position: 'relative' }}>
                            {!n.isRead && <div style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }} />}
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: n.type === 'Critical' ? '#ef4444' : '#f59e0b', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '1rem' }}>
                              <span style={{ fontSize: '1rem' }}>⚠️</span> {n.title}
                            </div>
                            
                            <div style={{ marginBottom: '1rem' }}>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Supplier:</div>
                              <div style={{ fontWeight: '500' }}>{n.supplier?.name || 'Unknown'}</div>
                            </div>

                            {n.details && (
                              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                                <div>
                                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Previous:</div>
                                  <div style={{ fontWeight: 'bold' }}>{n.details.previous}</div>
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Current:</div>
                                  <div style={{ fontWeight: 'bold', color: n.details.current < n.details.previous ? '#ef4444' : 'var(--text-primary)' }}>{n.details.current}</div>
                                </div>
                              </div>
                            )}

                            {n.details?.reason && (
                              <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Reason:</div>
                                <div style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>{n.details.reason}</div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button onClick={logout} className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>
        <div style={{ flex: 1 }}>
          <AnimatedRoutes />
        </div>
      </main>
      <Chatbot />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <MainApp />
      </Router>
    </AuthProvider>
  );
}

export default App;
