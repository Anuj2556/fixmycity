require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const connectDB = require('./src/config/db');

// Import Routers
const authRoutes = require('./src/routes/authRoutes');
const departmentRoutes = require('./src/routes/departmentRoutes');
const issueRoutes = require('./src/routes/issueRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

// Connect to MongoDB Atlas
connectDB().catch((err) => {
  console.warn('[MongoDB] Initial connection pending or deferred:', err.message);
});

// Middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static media serving
app.use('/media', express.static(path.join(__dirname, 'media')));

// API Root Health Check
app.get('/', (req, res) => {
  res.json({
    service: 'FixMyCity Ahmedabad Civic Platform API',
    status: 'online',
    runtime: 'Node.js + Express + MongoDB',
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'FixMyCity REST API Gateway',
    endpoints: [
      '/api/register/',
      '/api/login/',
      '/api/token/refresh/',
      '/api/profile/',
      '/api/departments/',
      '/api/departments/overview/',
      '/api/issues/',
      '/api/issues/ai-analyze/',
    ],
  });
});

// Outbound IP Diagnostic (to easily find Render IP for MongoDB Atlas whitelist)
app.get('/api/my-ip', async (req, res) => {
  try {
    const ipRes = await axios.get('https://api.ipify.org?format=json', { timeout: 4000 });
    res.json({
      outbound_ip: ipRes.data.ip,
      instruction: 'Add this IP to MongoDB Atlas Network Access to allow Render backend only.',
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not detect outbound IP', detail: err.message });
  }
});

// API Routes
app.use('/api', authRoutes);
app.use('/api', departmentRoutes);
app.use('/api', issueRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ detail: `Route ${req.method} ${req.originalUrl} not found.` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);

  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid identifier format: ${err.value}` });
  }

  return res.status(500).json({
    error: err.message || 'Internal server error occurred.',
  });
});

const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 FixMyCity Node.js API running at http://127.0.0.1:${PORT}`);
  console.log(`📡 AI Service proxy target: ${process.env.AI_SERVICE_URL || 'http://127.0.0.1:5000'}`);
  console.log(`======================================================\n`);
});

module.exports = app;
