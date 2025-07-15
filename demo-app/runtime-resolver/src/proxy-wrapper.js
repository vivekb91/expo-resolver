/**
 * Proxy Wrapper - Creates JavaScript Proxy objects for graceful method interception
 * 
 * This module wraps any object/module with a Proxy that can intercept method calls
 * and provide fallback behavior when methods don't exist or fail on web platforms.
 */

/**
 * Create an event emitter proxy for missing event objects
 */
function createEventEmitterProxy(prop, moduleName, logger) {
  logger.info(`Creating event emitter proxy for ${moduleName}.${prop}`);
  
  return new Proxy({}, {
    get(target, eventProp) {
      if (eventProp === 'addListener' || eventProp === 'addEventListener') {
        return createListenerProxy(eventProp, `${moduleName}.${prop}`, logger);
      }
      
      if (eventProp === 'removeListener' || eventProp === 'removeEventListener' || eventProp === 'removeAllListeners') {
        return createRemoveListenerProxy(eventProp, `${moduleName}.${prop}`, logger);
      }
      
      // Return undefined for other properties
      logger.warn(`Property '${eventProp}' not found on ${moduleName}.${prop}`);
      return undefined;
    }
  });
}

/**
 * Create a listener proxy for event subscription
 */
function createListenerProxy(prop, moduleName, logger) {
  return function(event, callback) {
    logger.info(`[Fallback] ${moduleName}.${prop} called for event: ${event}`);
    
    // Return a subscription object with remove method
    return {
      remove: () => {
        logger.info(`[Fallback] ${moduleName}.${prop} subscription removed for event: ${event}`);
      }
    };
  };
}

/**
 * Create a remove listener proxy
 */
function createRemoveListenerProxy(prop, moduleName, logger) {
  return function(event, callback) {
    logger.info(`[Fallback] ${moduleName}.${prop} called for event: ${event}`);
    // No-op for remove operations
  };
}

/**
 * Create a proxy wrapper around a module/object
 * @param {Object} target - The original module/object to wrap
 * @param {Object} options - Configuration options
 * @returns {Proxy} - Proxied object with fallback handling
 */
function createProxyWrapper(target, options = {}) {
  const {
    moduleName = 'unknown',
    config = {},
    fallbackManager,
    logger
  } = options;

  // Handle null/undefined targets
  if (!target) {
    logger.warn(`Target is null/undefined for module: ${moduleName}`);
    return createFallbackProxy(moduleName, fallbackManager, logger);
  }

  return new Proxy(target, {
    get(obj, prop) {
      // If property exists and is accessible, return it
      if (prop in obj) {
        const value = obj[prop];
        
        // If it's a function, wrap it with error handling
        if (typeof value === 'function') {
          return createMethodProxy(value, prop, moduleName, config, fallbackManager, logger);
        }
        
        // If it's an object, recursively wrap it
        if (typeof value === 'object' && value !== null) {
          return createProxyWrapper(value, {
            moduleName: `${moduleName}.${prop}`,
            config: config[prop] || {},
            fallbackManager,
            logger
          });
        }
        
        // Return primitive values as-is
        return value;
      }
      
      // Property doesn't exist - provide smart fallback
      logger.warn(`Property '${prop}' not found on module '${moduleName}'`);
      
      // Check if this looks like an event emitter pattern
      if (prop === 'PushEvents' || prop.endsWith('Events')) {
        return createEventEmitterProxy(prop, moduleName, logger);
      }
      
      // Check if this looks like a listener method
      if (prop === 'addListener' || prop === 'addEventListener') {
        return createListenerProxy(prop, moduleName, logger);
      }
      
      // Check if this looks like a remove method
      if (prop === 'removeListener' || prop === 'removeEventListener' || prop === 'removeAllListeners') {
        return createRemoveListenerProxy(prop, moduleName, logger);
      }
      
      // Use the fallback manager for other cases
      return fallbackManager.getFallbackValue(moduleName, prop, config);
    },

    set(obj, prop, value) {
      // Allow setting properties if possible
      try {
        obj[prop] = value;
        return true;
      } catch (error) {
        logger.warn(`Cannot set property '${prop}' on module '${moduleName}':`, error.message);
        return false;
      }
    },

    has(obj, prop) {
      // Check if property exists or has a fallback
      return prop in obj || fallbackManager.hasFallback(moduleName, prop);
    },

    ownKeys(obj) {
      // Return actual keys plus any fallback keys
      const actualKeys = Object.getOwnPropertyNames(obj);
      const fallbackKeys = fallbackManager.getFallbackKeys(moduleName);
      return [...new Set([...actualKeys, ...fallbackKeys])];
    },

    getOwnPropertyDescriptor(obj, prop) {
      // Return actual descriptor or create one for fallbacks
      const actualDescriptor = Object.getOwnPropertyDescriptor(obj, prop);
      if (actualDescriptor) {
        return actualDescriptor;
      }
      
      if (fallbackManager.hasFallback(moduleName, prop)) {
        return {
          enumerable: true,
          configurable: true,
          get() {
            return fallbackManager.getFallbackValue(moduleName, prop, config);
          }
        };
      }
      
      return undefined;
    }
  });
}

/**
 * Create a proxy for a method with error handling
 * @param {Function} originalMethod - The original method
 * @param {string} methodName - Name of the method
 * @param {string} moduleName - Name of the module
 * @param {Object} config - Method-specific configuration
 * @param {Object} fallbackManager - Fallback manager instance
 * @param {Object} logger - Logger instance
 * @returns {Function} - Wrapped method with error handling
 */
function createMethodProxy(originalMethod, methodName, moduleName, config, fallbackManager, logger) {
  return function(...args) {
    const fullMethodName = `${moduleName}.${methodName}`;
    
    try {
      logger.debug(`Calling method: ${fullMethodName}`, args);
      
      // Call the original method
      const result = originalMethod.apply(this, args);
      
      // Handle promises
      if (result && typeof result.then === 'function') {
        return result.catch(error => {
          logger.warn(`Promise rejected in ${fullMethodName}:`, error.message);
          return fallbackManager.handleMethodError(fullMethodName, error, args, config);
        });
      }
      
      return result;
    } catch (error) {
      logger.warn(`Method ${fullMethodName} failed:`, error.message);
      return fallbackManager.handleMethodError(fullMethodName, error, args, config);
    }
  };
}

/**
 * Create a fallback proxy for completely missing modules
 * @param {string} moduleName - Name of the module
 * @param {Object} fallbackManager - Fallback manager instance
 * @param {Object} logger - Logger instance
 * @returns {Proxy} - Fallback proxy object
 */
function createFallbackProxy(moduleName, fallbackManager, logger) {
  const fallbackTarget = {};
  
  return new Proxy(fallbackTarget, {
    get(obj, prop) {
      if (prop === 'toString') {
        return () => `[FallbackProxy for ${moduleName}]`;
      }
      
      if (prop === 'valueOf') {
        return () => fallbackTarget;
      }
      
      // For any other property, return a fallback
      logger.warn(`Accessing property '${prop}' on missing module '${moduleName}'`);
      return fallbackManager.getFallbackValue(moduleName, prop, {});
    },

    set(obj, prop, value) {
      logger.warn(`Attempting to set property '${prop}' on missing module '${moduleName}'`);
      return false;
    },

    has(obj, prop) {
      return ['toString', 'valueOf'].includes(prop) || fallbackManager.hasFallback(moduleName, prop);
    }
  });
}

module.exports = {
  createProxyWrapper,
  createMethodProxy,
  createFallbackProxy
};