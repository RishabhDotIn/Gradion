const winston = require('winston');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'gradion-backend' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
  ],
});

// If we're not in production, log to the console with a simple format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Create logs directory if it doesn't exist
const fs = require('fs');
const path = require('path');
const logsDir = path.join(__dirname, '../logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Helper functions for structured logging
const logAuth = (action, userId, email, ip, success = true, error = null) => {
  logger.info('Authentication Event', {
    type: 'auth',
    action,
    userId,
    email,
    ip,
    success,
    error: error?.message,
    timestamp: new Date().toISOString()
  });
};

const logAPI = (method, endpoint, userId, ip, statusCode, responseTime, error = null) => {
  logger.info('API Request', {
    type: 'api',
    method,
    endpoint,
    userId,
    ip,
    statusCode,
    responseTime,
    error: error?.message,
    timestamp: new Date().toISOString()
  });
};

const logSecurity = (event, severity, details, ip = null) => {
  logger.warn('Security Event', {
    type: 'security',
    event,
    severity,
    details,
    ip,
    timestamp: new Date().toISOString()
  });
};

const logDatabase = (operation, collection, query, result, error = null) => {
  logger.info('Database Operation', {
    type: 'database',
    operation,
    collection,
    query: JSON.stringify(query),
    result,
    error: error?.message,
    timestamp: new Date().toISOString()
  });
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const ip = req.ip || req.connection.remoteAddress;
  
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    const userId = req.user?.userId || 'anonymous';
    
    logAPI(
      req.method,
      req.originalUrl,
      userId,
      ip,
      res.statusCode,
      responseTime
    );
  });
  
  next();
};

module.exports = {
  logger,
  logAuth,
  logAPI,
  logSecurity,
  logDatabase,
  requestLogger
};
