require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const supplierRoutes = require('./routes/supplierRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const authRoutes = require('./routes/authRoutes');
const configRoutes = require('./routes/configRoutes');
const poRoutes = require('./routes/poRoutes');
const qualityRoutes = require('./routes/qualityRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const SystemConfig = require('./models/SystemConfig');
const Supplier = require('./models/Supplier');
const seedData = require('./seedDemo');

// Initialize Cron Jobs
try {
  require('./cronJobs');
} catch (cronErr) {
  console.warn('Cron jobs initialization note:', cronErr.message);
}

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(s => s.trim()) : '*';
app.use(cors({
  origin: allowedOrigins === '*' ? true : allowedOrigins,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint (Essential for Render, Railway, AWS, Docker)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API Routes
app.use('/api/suppliers', supplierRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/pos', poRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve static frontend build in single-service production deployments (Express 5 compatible)
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  console.log(`Serving frontend static build from ${frontendDist}`);
  app.use(express.static(frontendDist));
  
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(frontendDist, 'index.html'));
    }
    next();
  });
}

// 404 Handler for undefined API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// MongoDB Connection & Server Launch
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/supplier_platform';

let server;

if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log('Connected to MongoDB successfully');
      
      // Auto-seed comprehensive demo dataset if database is brand new / empty
      try {
        const supplierCount = await Supplier.countDocuments();
        if (supplierCount === 0) {
          console.log('Empty database detected. Auto-seeding comprehensive demo data...');
          await seedData(false);
        } else {
          if (typeof authRoutes.seedUsers === 'function') {
            await authRoutes.seedUsers();
          }
          const existingConfig = await SystemConfig.findOne();
          if (!existingConfig) {
            await SystemConfig.create({});
            console.log('Default system configuration initialized');
          }
        }
      } catch (seedErr) {
        console.warn('Initial seeding note:', seedErr.message);
      }

      server = app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to connect to MongoDB:', err.message);
      server = app.listen(PORT, () => {
        console.warn(`Server running in degraded mode on port ${PORT} (Database not connected)`);
      });
    });
}

// Graceful shutdown handling
const gracefulShutdown = () => {
  console.log('Gracefully shutting down server...');
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
      mongoose.connection.close(false).then(() => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;
