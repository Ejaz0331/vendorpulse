import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hello! I am VendorPulse AI. How can I help you manage your supply chain today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const generateResponse = (query) => {
    const q = query.toLowerCase();
    
    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      return 'Hello there! Feel free to ask me how the KPI Engine works, or how we predict supplier risk.';
    }
    if (q.includes('how it works') || q.includes('architecture') || q.includes('kpi engine') || q.includes('math')) {
      return 'VendorPulse uses dynamic KPI weighting. When you log Purchase Orders or Quality Checks, our math engine automatically scores suppliers based on Actual Delivery, Quality, Cost, and Response metrics. It then routes these scores to generate risk alerts and dashboard analytics instantly.';
    }
    if (q.includes('supplier') || q.includes('vendor')) {
      return 'You can view, compare, and manage your suppliers on the Suppliers page. We recently added a powerful Comparison Matrix and predictive AI to help you pick the best vendor!';
    }
    if (q.includes('risk') || q.includes('critical') || q.includes('alert')) {
      return 'When a supplier\'s overall score drops below 70, they enter the HIGH-RISK category. Our Risk Engine automatically generates a system alert (Notification) detailing exactly which metric failed so you can take immediate action.';
    }
    if (q.includes('predict') || q.includes('ai') || q.includes('future')) {
      return 'Our new prediction engine uses Linear Regression on historical KPI assessments to project next month\'s score. You can see this live by clicking the "View Profile" button on any supplier on the Suppliers page.';
    }
    if (q.includes('compare') || q.includes('matrix') || q.includes('best')) {
      return 'You can select up to 3 suppliers using the checkboxes on the Suppliers page. Clicking the "Compare" button will generate a side-by-side matrix and automatically recommend the highest performing supplier.';
    }
    if (q.includes('thank')) {
      return 'You are very welcome! Let me know if you need anything else.';
    }
    
    return 'I am a specialized demo AI for VendorPulse. Try asking me about how the KPI Engine calculates scores, our new prediction model, or how risk alerts are automatically generated!';
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate network delay for natural feel
    setTimeout(() => {
      const responseText = generateResponse(userMsg.text);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: responseText }]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={() => setIsOpen(true)}
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              boxShadow: '0 4px 20px rgba(var(--accent-rgb), 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <MessageSquare size={28} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              width: '350px',
              height: '500px',
              background: '#1c1c1c',
              border: '1px solid #333',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 1001,
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', background: 'var(--accent-primary)', borderRadius: '50%' }}></div>
                <strong style={{ color: 'var(--accent-primary)' }}>VendorPulse AI</strong>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', gap: '0.5rem', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  {msg.sender === 'bot' && (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(var(--accent-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Bot size={16} color="var(--accent-primary)" />
                    </div>
                  )}
                  
                  <div style={{ 
                    padding: '0.75rem 1rem', 
                    borderRadius: '12px', 
                    background: msg.sender === 'user' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                    color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)',
                    fontSize: '0.9rem',
                    lineHeight: '1.4'
                  }}>
                    {msg.text}
                  </div>

                  {msg.sender === 'user' && (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={16} color="#fff" />
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-start', maxWidth: '85%' }}>
                   <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(var(--accent-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Bot size={16} color="var(--accent-primary)" />
                    </div>
                    <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} style={{ width: '6px', height: '6px', background: 'var(--text-secondary)', borderRadius: '50%' }} />
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} style={{ width: '6px', height: '6px', background: 'var(--text-secondary)', borderRadius: '50%' }} />
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} style={{ width: '6px', height: '6px', background: 'var(--text-secondary)', borderRadius: '50%' }} />
                    </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '1rem', borderTop: '1px solid #333' }}>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid #333', borderRadius: '8px', padding: '0.5rem 1rem', color: '#fff', outline: 'none' }}
                />
                <button type="submit" disabled={!input.trim()} style={{ background: input.trim() ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'default', color: '#fff' }}>
                  <Send size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
