const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

class Logger {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.level = options.level || 'info';
    this.prefix = options.prefix || '[Metro Web Compat]';
    this.colors = options.colors !== false && process.stdout.isTTY;
  }

  _log(level, color, message, ...args) {
    if (!this.enabled) return;
    
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const currentLevel = levels[this.level] || 2;
    const messageLevel = levels[level] || 2;
    
    if (messageLevel > currentLevel) return;
    
    const colorCode = this.colors ? colors[color] || colors.white : '';
    const resetCode = this.colors ? colors.reset : '';
    const timestamp = new Date().toISOString().slice(11, 23);
    
    console.log(`${colorCode}${this.prefix} ${timestamp} [${level.toUpperCase()}]${resetCode} ${message}`, ...args);
  }

  error(message, ...args) {
    this._log('error', 'red', message, ...args);
  }

  warn(message, ...args) {
    this._log('warn', 'yellow', message, ...args);
  }

  info(message, ...args) {
    this._log('info', 'cyan', message, ...args);
  }

  debug(message, ...args) {
    this._log('debug', 'gray', message, ...args);
  }

  success(message, ...args) {
    this._log('info', 'green', message, ...args);
  }

  compatibility(message, ...args) {
    this._log('info', 'magenta', `[Compatibility] ${message}`, ...args);
  }

  resolver(message, ...args) {
    this._log('debug', 'blue', `[Resolver] ${message}`, ...args);
  }

  mock(message, ...args) {
    this._log('info', 'yellow', `[Mock] ${message}`, ...args);
  }
}

const logger = new Logger({
  enabled: process.env.NODE_ENV !== 'test',
  level: process.env.METRO_WEB_COMPAT_LOG_LEVEL || 'info'
});

module.exports = {
  Logger,
  logger
};