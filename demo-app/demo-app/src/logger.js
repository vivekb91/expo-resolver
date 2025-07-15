/**
 * Logger - Configurable logging for the runtime resolver
 * 
 * This module provides structured logging with different levels
 * and formatting for better debugging and monitoring.
 */

class Logger {
  constructor(enabled = true, level = 'warn') {
    this.enabled = enabled;
    this.level = level;
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      silent: 4
    };
    
    this.currentLevel = this.levels[level] || this.levels.warn;
    this.prefix = '[RuntimeResolver]';
  }

  /**
   * Log a debug message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  debug(message, ...args) {
    if (this.shouldLog('debug')) {
      console.debug(`${this.prefix} ${this.formatMessage(message, 'DEBUG')}`, ...args);
    }
  }

  /**
   * Log an info message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  info(message, ...args) {
    if (this.shouldLog('info')) {
      console.info(`${this.prefix} ${this.formatMessage(message, 'INFO')}`, ...args);
    }
  }

  /**
   * Log a warning message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  warn(message, ...args) {
    if (this.shouldLog('warn')) {
      console.warn(`${this.prefix} ${this.formatMessage(message, 'WARN')}`, ...args);
    }
  }

  /**
   * Log an error message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  error(message, ...args) {
    if (this.shouldLog('error')) {
      console.error(`${this.prefix} ${this.formatMessage(message, 'ERROR')}`, ...args);
    }
  }

  /**
   * Log a module resolution event
   * @param {string} moduleName - Name of the module
   * @param {string} action - Action taken (resolved, fallback, error)
   * @param {Object} details - Additional details
   */
  logModuleEvent(moduleName, action, details = {}) {
    const message = `Module "${moduleName}" ${action}`;
    
    switch (action) {
      case 'resolved':
        this.debug(message, details);
        break;
      case 'fallback':
        this.warn(message, details);
        break;
      case 'error':
        this.error(message, details);
        break;
      default:
        this.info(message, details);
    }
  }

  /**
   * Log a method call event
   * @param {string} methodName - Full method name
   * @param {string} result - Result of the call (success, fallback, error)
   * @param {Object} details - Additional details
   */
  logMethodCall(methodName, result, details = {}) {
    const message = `Method "${methodName}" ${result}`;
    
    switch (result) {
      case 'success':
        this.debug(message, details);
        break;
      case 'fallback':
        this.warn(message, details);
        break;
      case 'error':
        this.error(message, details);
        break;
      default:
        this.info(message, details);
    }
  }

  /**
   * Log configuration changes
   * @param {Object} oldConfig - Previous configuration
   * @param {Object} newConfig - New configuration
   */
  logConfigChange(oldConfig, newConfig) {
    if (this.shouldLog('info')) {
      this.info('Configuration updated', {
        old: oldConfig,
        new: newConfig
      });
    }
  }

  /**
   * Log platform detection results
   * @param {Object} platformInfo - Platform information
   */
  logPlatformDetection(platformInfo) {
    this.info('Platform detected', platformInfo);
  }

  /**
   * Log performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} metadata - Additional metadata
   */
  logPerformance(operation, duration, metadata = {}) {
    if (this.shouldLog('debug')) {
      this.debug(`Performance: ${operation} took ${duration}ms`, metadata);
    }
  }

  /**
   * Create a child logger with additional context
   * @param {string} context - Additional context for the logger
   * @returns {Logger} - New logger instance
   */
  createChild(context) {
    const childLogger = new Logger(this.enabled, this.level);
    childLogger.prefix = `${this.prefix}[${context}]`;
    return childLogger;
  }

  /**
   * Update logger configuration
   * @param {boolean} enabled - Whether logging is enabled
   * @param {string} level - Log level
   */
  updateConfig(enabled, level) {
    if (enabled !== undefined) {
      this.enabled = enabled;
    }
    
    if (level !== undefined) {
      this.level = level;
      this.currentLevel = this.levels[level] || this.levels.warn;
    }
  }

  /**
   * Get current configuration
   * @returns {Object} - Current configuration
   */
  getConfig() {
    return {
      enabled: this.enabled,
      level: this.level,
      currentLevel: this.currentLevel
    };
  }

  // Private methods

  /**
   * Check if a message should be logged based on level
   * @param {string} level - Log level to check
   * @returns {boolean} - True if should log
   */
  shouldLog(level) {
    if (!this.enabled) {
      return false;
    }
    
    const messageLevel = this.levels[level];
    return messageLevel >= this.currentLevel;
  }

  /**
   * Format a log message with timestamp and level
   * @param {string} message - Original message
   * @param {string} level - Log level
   * @returns {string} - Formatted message
   */
  formatMessage(message, level) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  /**
   * Format additional arguments for logging
   * @param {...any} args - Arguments to format
   * @returns {string} - Formatted arguments
   */
  formatArgs(...args) {
    return args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (error) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
  }
}

/**
 * Create a singleton logger instance
 */
let defaultLogger = null;

/**
 * Get the default logger instance
 * @param {boolean} enabled - Whether logging is enabled
 * @param {string} level - Log level
 * @returns {Logger} - Logger instance
 */
function getDefaultLogger(enabled = true, level = 'warn') {
  if (!defaultLogger) {
    defaultLogger = new Logger(enabled, level);
  }
  return defaultLogger;
}

/**
 * Create a new logger instance
 * @param {boolean} enabled - Whether logging is enabled
 * @param {string} level - Log level
 * @returns {Logger} - New logger instance
 */
function createLogger(enabled = true, level = 'warn') {
  return new Logger(enabled, level);
}

module.exports = {
  Logger,
  getDefaultLogger,
  createLogger
};