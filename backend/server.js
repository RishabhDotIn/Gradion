const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { auth, roleAuth } = require('./middleware/authMiddleware');
const {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  securityHeaders,
  xssProtection,
  sanitizeInput
} = require('./middleware/securityMiddleware');
const { requestLogger, logger } = require('./utils/logger');
const authRoutes = require('./routes/authRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const {
  studentDashboard,
  teacherDashboard,
  performance,
  dashboardStats,
} = require('./controllers/authController');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Request logging middleware
app.use(requestLogger);

// Security middleware
app.use(securityHeaders);
app.use(sanitizeInput);
app.use(xssProtection);

// Rate limiting
app.use(generalLimiter);

// CORS configuration
app.use(cors({ 
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes with specific rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/assignments', assignmentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Gradion Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Protected routes examples
app.get('/api/dashboard/student', auth, roleAuth('student'), studentDashboard);
app.get('/api/dashboard/teacher', auth, roleAuth('teacher'), teacherDashboard);
app.get('/api/performance', auth, performance);
app.get('/api/dashboard/stats', auth, roleAuth('teacher'), dashboardStats);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.userId || 'anonymous'
  });
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Gradion Backend Server running on port ${PORT}`);
  console.log(`📱 API Health Check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  const mongoose = require('mongoose');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  const mongoose = require('mongoose');
  await mongoose.connection.close();
  process.exit(0);
});