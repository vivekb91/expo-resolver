/**
 * Proxy Wrapper - Creates JavaScript Proxy objects for graceful method interception
 * 
 * This module wraps any object/module with a Proxy that can intercept method calls
 * and provide fallback behavior when methods don't exist or fail on web platforms.
 */

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
        
        // CRITICAL: Handle null/undefined values that should be objects
        // This handles cases like NetInfo.NetInfoStateType being null
        if (value === null || value === undefined) {
          // Check if this property is expected to be an object based on usage patterns
          if (shouldCreateFallbackObject(prop, moduleName)) {
            logger.warn(`Property '${prop}' is null/undefined on module '${moduleName}', creating fallback object`);
            return createFallbackObjectProxy(`${moduleName}.${prop}`, fallbackManager, logger);
          }
        }
        
        // Return primitive values as-is
        return value;
      }
      
      // Property doesn't exist - provide fallback
      logger.warn(`Property '${prop}' not found on module '${moduleName}'`);
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

/**
 * Create a fallback object proxy for null/undefined properties that should be objects
 * @param {string} propertyPath - Full path to the property (e.g., 'NetInfo.NetInfoStateType')
 * @param {Object} fallbackManager - Fallback manager instance
 * @param {Object} logger - Logger instance
 * @returns {Proxy} - Fallback object proxy
 */
function createFallbackObjectProxy(propertyPath, fallbackManager, logger) {
  const fallbackTarget = {};
  
  return new Proxy(fallbackTarget, {
    get(obj, prop) {
      if (prop === 'toString') {
        return () => `[FallbackObject for ${propertyPath}]`;
      }
      
      if (prop === 'valueOf') {
        return () => fallbackTarget;
      }
      
      // Return fallback value for any property access
      logger.warn(`Accessing property '${prop}' on null/undefined object '${propertyPath}'`);
      return fallbackManager.getFallbackValue(propertyPath, prop, {});
    },

    set(obj, prop, value) {
      logger.warn(`Attempting to set property '${prop}' on fallback object '${propertyPath}'`);
      return false;
    },

    has(obj, prop) {
      return ['toString', 'valueOf'].includes(prop) || fallbackManager.hasFallback(propertyPath, prop);
    },

    ownKeys(obj) {
      return fallbackManager.getFallbackKeys(propertyPath);
    }
  });
}

/**
 * Determine if a null/undefined property should be treated as an object
 * @param {string} prop - Property name
 * @param {string} moduleName - Module name
 * @returns {boolean} - True if should create fallback object
 */
function shouldCreateFallbackObject(prop, moduleName) {
  // Common patterns that indicate a property should be an object
  const objectPatterns = [
    /State$/,          // NetInfoStateType
    /Type$/,           // NetInfoStateType, ConnectionType, etc.
    /Constants?$/,     // Constants, Constant
    /Config$/,         // Config objects
    /Options?$/,       // Options, Option
    /Settings?$/,      // Settings, Setting
    /Styles?$/,        // Styles, Style
    /Theme$/,          // Theme objects
    /Event$/,          // Event objects
    /Manager$/,        // Manager objects
    /Handler$/,        // Handler objects
  ];

  // Check if the property name matches object patterns
  const matchesPattern = objectPatterns.some(pattern => pattern.test(prop));
  
  // Check for specific known cases
  const knownObjectProperties = [
    'NetInfoStateType',
    'ConnectionType',
    'NetInfoConfiguration',
    'DeviceType',
    'BatteryState',
    'PowerState',
    'MediaType',
    'ImagePickerOptions',
    'CameraOptions',
    'LocationOptions',
    'NotificationOptions',
    'HapticFeedbackType',
    'OrientationType',
    'SensorType',
    'ShareOptions',
    'ClipboardOptions'
  ];

  return matchesPattern || knownObjectProperties.includes(prop);
}

module.exports = {
  createProxyWrapper,
  createMethodProxy,
  createFallbackProxy,
  createFallbackObjectProxy,
  shouldCreateFallbackObject
};