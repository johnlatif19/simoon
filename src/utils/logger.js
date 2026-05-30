// ============================================
// Logger Utility
// رحلة في مصر - Journey in Egypt
// ============================================

const fs = require('fs');
const path = require('path');

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  VERBOSE: 4
};

const LOG_LEVEL_NAMES = {
  0: 'ERROR',
  1: 'WARN',
  2: 'INFO',
  3: 'DEBUG',
  4: 'VERBOSE'
};

// Current log level (from environment or default to INFO)
const CURRENT_LOG_LEVEL = process.env.LOG_LEVEL 
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] 
  : LOG_LEVELS.INFO;

// Check if running in production (Vercel/Render)
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Log directory - only in development
const LOG_DIR = !IS_PRODUCTION ? path.join(process.cwd(), 'logs') : null;
const ERROR_LOG_FILE = !IS_PRODUCTION ? path.join(LOG_DIR, 'error.log') : null;
const COMBINED_LOG_FILE = !IS_PRODUCTION ? path.join(LOG_DIR, 'combined.log') : null;

// Ensure log directory exists (only in development)
if (!IS_PRODUCTION && LOG_DIR && !fs.existsSync(LOG_DIR)) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch (error) {
    console.warn('⚠️ Could not create logs directory:', error.message);
  }
}

/**
 * Format log message with timestamp and level
 * @param {string} level - Log level name
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 * @returns {string} Formatted log line
 */
function formatLogMessage(level, message, meta = null) {
  const timestamp = new Date().toISOString();
  let logLine = `[${timestamp}] [${level}] ${message}`;
  
  if (meta) {
    if (typeof meta === 'object') {
      try {
        logLine += `\n${JSON.stringify(meta, null, 2)}`;
      } catch (e) {
        logLine += `\n[Circular or non-serializable meta]`;
      }
    } else {
      logLine += `\n${meta}`;
    }
  }
  
  return logLine;
}

/**
 * Write log to file (only in development)
 * @param {string} filePath - Path to log file
 * @param {string} content - Content to write
 */
function writeToFile(filePath, content) {
  if (IS_PRODUCTION || !filePath) return; // Skip file writing in production
  
  try {
    fs.appendFileSync(filePath, content + '\n');
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

/**
 * Log to console with color (only in development or for errors)
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Metadata
 */
function logToConsole(level, message, meta = null) {
  // In production, only log errors and warnings
  if (IS_PRODUCTION && level !== 'ERROR' && level !== 'WARN') {
    return;
  }
  
  const timestamp = new Date().toISOString();
  const colors = {
    ERROR: '\x1b[31m', // Red
    WARN: '\x1b[33m',  // Yellow
    INFO: '\x1b[36m',  // Cyan
    DEBUG: '\x1b[32m', // Green
    VERBOSE: '\x1b[90m' // Gray
  };
  
  const reset = '\x1b[0m';
  const color = colors[level] || colors.INFO;
  
  if (meta && typeof meta === 'object') {
    console.log(`${color}[${timestamp}] [${level}] ${message}${reset}`);
    console.log(color, meta, reset);
  } else if (meta) {
    console.log(`${color}[${timestamp}] [${level}] ${message} ${meta}${reset}`);
  } else {
    console.log(`${color}[${timestamp}] [${level}] ${message}${reset}`);
  }
}

/**
 * Base logger function
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
function log(level, message, meta = null) {
  const levelValue = LOG_LEVELS[level];
  
  // Skip if below current log level
  if (levelValue > CURRENT_LOG_LEVEL) return;
  
  // Only write to files in development
  if (!IS_PRODUCTION) {
    const logLine = formatLogMessage(level, message, meta);
    
    // Write to combined log
    writeToFile(COMBINED_LOG_FILE, logLine);
    
    // Write to error log for errors
    if (level === 'ERROR') {
      writeToFile(ERROR_LOG_FILE, logLine);
    }
  }
  
  // Log to console
  logToConsole(level, message, meta);
}

// ============================================
// Public Logger Methods
// ============================================

/**
 * Log error message
 * @param {string} message - Error message
 * @param {Object|Error} meta - Error object or metadata
 */
function error(message, meta = null) {
  if (meta instanceof Error) {
    log('ERROR', message, {
      name: meta.name,
      message: meta.message,
      stack: meta.stack,
      ...(meta.cause && { cause: meta.cause })
    });
  } else {
    log('ERROR', message, meta);
  }
}

/**
 * Log warning message
 * @param {string} message - Warning message
 * @param {Object} meta - Metadata
 */
function warn(message, meta = null) {
  log('WARN', message, meta);
}

/**
 * Log info message
 * @param {string} message - Info message
 * @param {Object} meta - Metadata
 */
function info(message, meta = null) {
  log('INFO', message, meta);
}

/**
 * Log debug message
 * @param {string} message - Debug message
 * @param {Object} meta - Metadata
 */
function debug(message, meta = null) {
  log('DEBUG', message, meta);
}

/**
 * Log verbose message (detailed)
 * @param {string} message - Verbose message
 * @param {Object} meta - Metadata
 */
function verbose(message, meta = null) {
  log('VERBOSE', message, meta);
}

// ============================================
// HTTP Request Logger
// ============================================

/**
 * Log HTTP request
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {number} responseTime - Response time in ms
 */
function logRequest(req, res, responseTime) {
  const { method, originalUrl, ip } = req;
  const statusCode = res.statusCode;
  
  const logLevel = statusCode >= 400 ? 'WARN' : 'INFO';
  const message = `${method} ${originalUrl} - ${statusCode} (${responseTime}ms)`;
  
  log(logLevel, message, {
    method,
    url: originalUrl,
    statusCode,
    responseTime,
    ip,
    userAgent: req.headers['user-agent']
  });
}

// ============================================
// Security Logger
// ============================================

/**
 * Log security event
 * @param {string} event - Security event type
 * @param {string} ip - IP address
 * @param {Object} details - Event details
 */
function logSecurity(event, ip, details = {}) {
  const message = `SECURITY: ${event} from ${ip}`;
  warn(message, { event, ip, ...details });
}

// ============================================
// Database Logger
// ============================================

/**
 * Log database operation
 * @param {string} operation - Operation type
 * @param {string} collection - Collection name
 * @param {string} id - Document ID (optional)
 * @param {number} duration - Operation duration in ms
 * @param {Object} error - Error if any
 */
function logDbOperation(operation, collection, id = null, duration = null, error = null) {
  const message = `DB: ${operation} ${collection}${id ? `/${id}` : ''}${duration ? ` (${duration}ms)` : ''}`;
  
  if (error) {
    error(message, { operation, collection, id, duration, error: error.message });
  } else if (duration && duration > 100) {
    warn(message, { operation, collection, id, duration });
  } else {
    debug(message, { operation, collection, id, duration });
  }
}

// ============================================
// Email Logger
// ============================================

/**
 * Log email sending
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {boolean} success - Whether sending succeeded
 * @param {Object} error - Error if any
 */
function logEmail(to, subject, success, error = null) {
  const message = `EMAIL: ${success ? 'Sent' : 'Failed'} to ${to} - "${subject}"`;
  
  if (success) {
    info(message);
  } else {
    error(message, { to, subject, error: error?.message });
  }
}

// ============================================
// Payment Logger
// ============================================

/**
 * Log payment operation
 * @param {string} operation - Payment operation
 * @param {string} bookingId - Booking ID
 * @param {number} amount - Payment amount
 * @param {string} currency - Currency
 * @param {boolean} success - Whether succeeded
 * @param {Object} error - Error if any
 */
function logPayment(operation, bookingId, amount, currency, success, error = null) {
  const message = `PAYMENT: ${operation} - Booking ${bookingId} - ${amount} ${currency} - ${success ? 'Success' : 'Failed'}`;
  
  if (success) {
    info(message);
  } else {
    error(message, { operation, bookingId, amount, currency, error: error?.message });
  }
}

// ============================================
// Performance Logger
// ============================================

/**
 * Log performance metric
 * @param {string} name - Metric name
 * @param {number} duration - Duration in ms
 * @param {Object} tags - Additional tags
 */
function logPerformance(name, duration, tags = {}) {
  const message = `PERF: ${name} took ${duration}ms`;
  debug(message, { name, duration, tags });
  
  if (duration > 1000) {
    warn(`SLOW: ${name} took ${duration}ms`, tags);
  }
}

// ============================================
// Startup Logger
// ============================================

/**
 * Log server startup
 * @param {Object} config - Server configuration
 */
function logStartup(config) {
  const { port, environment, firebaseConnected, smtpConfigured } = config;
  
  info('========================================');
  info('🚀 Server Started');
  info(`📡 Port: ${port}`);
  info(`🌍 Environment: ${environment}`);
  info(`🔥 Firebase: ${firebaseConnected ? 'Connected' : 'Not Connected'}`);
  info(`📧 SMTP: ${smtpConfigured ? 'Configured' : 'Not Configured'}`);
  info('========================================');
}

// ============================================
// Log Utilities (for development only)
// ============================================

/**
 * Get recent log entries (only in development)
 * @param {string} type - Log type ('combined' or 'error')
 * @param {number} lines - Number of lines to return
 * @returns {string} Log content
 */
function getRecentLogs(type = 'combined', lines = 100) {
  if (IS_PRODUCTION) {
    return 'Log file access is only available in development mode';
  }
  
  const filePath = type === 'error' ? ERROR_LOG_FILE : COMBINED_LOG_FILE;
  
  if (!filePath || !fs.existsSync(filePath)) {
    return 'No logs available';
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const logLines = content.trim().split('\n');
    const recentLines = logLines.slice(-lines);
    return recentLines.join('\n');
  } catch (error) {
    return `Error reading logs: ${error.message}`;
  }
}

/**
 * Clear log files (only in development)
 */
function clearLogs() {
  if (IS_PRODUCTION) {
    return false;
  }
  
  try {
    if (COMBINED_LOG_FILE && fs.existsSync(COMBINED_LOG_FILE)) {
      fs.writeFileSync(COMBINED_LOG_FILE, '');
    }
    if (ERROR_LOG_FILE && fs.existsSync(ERROR_LOG_FILE)) {
      fs.writeFileSync(ERROR_LOG_FILE, '');
    }
    info('Log files cleared');
    return true;
  } catch (error) {
    error('Failed to clear logs', error);
    return false;
  }
}

// Export all logger methods
module.exports = {
  // Basic logging
  error,
  warn,
  info,
  debug,
  verbose,
  log,
  
  // Request logging
  logRequest,
  
  // Database logging
  logDbOperation,
  
  // Email logging
  logEmail,
  
  // Payment logging
  logPayment,
  
  // Performance logging
  logPerformance,
  
  // Security logging
  logSecurity,
  
  // Startup logging
  logStartup,
  
  // Utilities (development only)
  getRecentLogs,
  clearLogs,
  
  // Constants
  LOG_LEVELS,
  LOG_LEVEL_NAMES,
  IS_PRODUCTION
};