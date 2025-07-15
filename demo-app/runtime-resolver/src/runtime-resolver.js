/**
 * Runtime Resolver - Main entry point for runtime module resolution
 * 
 * This creates a configurable resolver that can intercept module imports
 * and wrap them with proxy handlers for graceful fallbacks.
 */

const { createProxyWrapper } = require('./proxy-wrapper');
const { PlatformDetector } = require('./platform-detector');
const { FallbackManager } = require('./fallback-manager');
const { Logger } = require('./logger');

class RuntimeResolver {
  constructor(config = {}) {
    this.config = {
      // Default configuration
      platform: 'auto', // 'auto', 'web', 'native'
      fallbackStrategy: 'graceful', // 'graceful', 'throw', 'silent'
      logging: true,
      logLevel: 'warn', // 'debug', 'info', 'warn', 'error'
      
      // Module-specific configurations
      modules: {},
      
      // Global fallback behaviors
      fallbacks: {
        returnValue: null,
        throwError: false,
        logMessage: true
      },
      
      ...config
    };
    
    this.platformDetector = new PlatformDetector();
    this.fallbackManager = new FallbackManager(this.config.fallbacks);
    this.logger = new Logger(this.config.logging, this.config.logLevel);
    
    // Cache for resolved modules
    this.moduleCache = new Map();
  }

  /**
   * Resolve a module with runtime safety
   * @param {string} moduleName - Name of the module to resolve
   * @param {Object} originalModule - The original module object
   * @returns {Object} - Proxied module with fallback handling
   */
  resolve(moduleName, originalModule) {
    // Check cache first
    if (this.moduleCache.has(moduleName)) {
      return this.moduleCache.get(moduleName);
    }

    const isWeb = this.platformDetector.isWeb();
    const moduleConfig = this.config.modules[moduleName] || {};

    this.logger.debug(`Resolving module: ${moduleName}, isWeb: ${isWeb}`);

    // If not web platform, return original module
    if (!isWeb) {
      this.moduleCache.set(moduleName, originalModule);
      return originalModule;
    }

    // Create proxy wrapper for web platform
    const proxyWrapper = createProxyWrapper(
      originalModule,
      {
        moduleName,
        config: moduleConfig,
        fallbackManager: this.fallbackManager,
        logger: this.logger
      }
    );

    // Cache the result
    this.moduleCache.set(moduleName, proxyWrapper);
    
    return proxyWrapper;
  }

  /**
   * Convenience method to wrap a module import
   * @param {string} moduleName - Name of the module
   * @param {Function} importFunction - Function that imports the module
   * @returns {Object} - Resolved module with fallback handling
   */
  async wrapImport(moduleName, importFunction) {
    try {
      const originalModule = await importFunction();
      return this.resolve(moduleName, originalModule);
    } catch (error) {
      this.logger.error(`Failed to import module ${moduleName}:`, error.message);
      
      // Return a fallback module
      return this.fallbackManager.createFallbackModule(moduleName, error);
    }
  }

  /**
   * Create a resolver function for use in module imports
   * @returns {Function} - Resolver function
   */
  createResolver() {
    return (moduleName, originalModule) => {
      return this.resolve(moduleName, originalModule);
    };
  }

  /**
   * Update configuration at runtime
   * @param {Object} newConfig - New configuration to merge
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.fallbackManager.updateConfig(newConfig.fallbacks || {});
    this.logger.updateConfig(newConfig.logging, newConfig.logLevel);
    
    // Clear cache when config changes
    this.moduleCache.clear();
  }
}

/**
 * Create a new runtime resolver instance
 * @param {Object} config - Configuration options
 * @returns {RuntimeResolver} - Runtime resolver instance
 */
function createRuntimeResolver(config = {}) {
  return new RuntimeResolver(config);
}

module.exports = {
  RuntimeResolver,
  createRuntimeResolver
};