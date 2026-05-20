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
const aiRoutes = require('./routes/aiRoutes');
const classRoutes = require('./routes/classRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const mailboxRoutes = require('./routes/mailboxRoutes');
const { performance, dashboardStats } = require('./controllers/authController');

// Load environment variables from backend/.env (works even if process cwd is repo root)
dotenv.config({ path: require('path').join(__dirname, '.env') });

// Initialize Express app
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// When behind nginx / Render / Railway, set TRUST_PROXY=1 so req.ip is the client (rate limits work per user).
if (process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// Request logging middleware
app.use(requestLogger);

// Security middleware
app.use(securityHeaders);
app.use(sanitizeInput);
app.use(xssProtection);

// Rate limiting
app.use(generalLimiter);

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

const profileRoutes = require('./routes/profileRoutes');

// Routes with specific rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/mailbox', mailboxRoutes);

// Serve uploaded static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Gradion Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

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

// Trigger restart