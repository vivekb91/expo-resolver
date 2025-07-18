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
 * Create a React Context proxy with Provider and Consumer
 */
function createReactContextProxy(prop, moduleName, logger) {
  logger.info(`Creating React Context proxy for ${moduleName}.${prop}`);
  
  const defaultValue = {
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
    frame: { x: 0, y: 0, width: 0, height: 0 }
  };
  
  return new Proxy({}, {
    get(target, contextProp) {
      if (contextProp === 'Provider') {
        return createReactComponentProxy('Provider', `${moduleName}.${prop}`, logger);
      }
      
      if (contextProp === 'Consumer') {
        return function(props = {}) {
          logger.info(`[Fallback] ${moduleName}.${prop}.Consumer called`);
          const { children } = props;
          
          // Call the children function with default value
          if (typeof children === 'function') {
            return children(defaultValue);
          }
          
          return children || null;
        };
      }
      
      if (contextProp === '_currentValue' || contextProp === '_context') {
        return defaultValue;
      }
      
      // Return undefined for other properties
      logger.warn(`Property '${contextProp}' not found on ${moduleName}.${prop}`);
      return undefined;
    }
  });
}

/**
 * Create a React component proxy
 */
function createReactComponentProxy(prop, moduleName, logger) {
  return function(props = {}) {
    logger.info(`[Fallback] ${moduleName}.${prop} component called`);
    
    // For web, try to detect if React is available
    if (typeof window !== 'undefined' && window.React) {
      return window.React.createElement('div', 
        { 
          'data-fallback': `${moduleName}.${prop}`,
          style: { display: 'contents' }
        }, 
        props.children
      );
    }
    
    // For React Native, try to create a basic View
    try {
      const { View } = require('react-native');
      return require('react').createElement(View, props, props.children);
    } catch (error) {
      // If React isn't available, return a basic object
      return { 
        type: 'mock-component',
        props: props,
        children: props.children 
      };
    }
  };
}

/**
 * Create a React hook proxy
 */
function createReactHookProxy(prop, moduleName, logger) {
  return function(...args) {
    logger.info(`[Fallback] ${moduleName}.${prop} hook called`);
    
    // Common hook return patterns
    if (prop.includes('SafeArea') || prop.includes('Insets')) {
      return { top: 0, bottom: 0, left: 0, right: 0 };
    }
    
    if (prop.includes('Frame') || prop.includes('Dimensions')) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    if (prop.includes('State') || prop.includes('Value')) {
      return [null, () => {}];
    }
    
    // Generic fallback
    return null;
  };
}

/**
 * Creates a safe property proxy for unknown properties that can handle nested access
 * @param {string} moduleName - The module name
 * @param {string} prop - The property name
 * @param {Object} fallbackManager - The fallback manager
 * @param {Object} logger - The logger
 * @returns {Proxy} - Safe proxy for nested property access
 */
function createSafePropertyProxy(moduleName, prop, fallbackManager, logger) {
  const fullPath = `${moduleName}.${prop}`;
  
  // Create a safe object that can handle nested property access
  const safeObject = function(...args) {
    logger.warn(`Unknown function '${prop}' called on module '${moduleName}'`);
    return fallbackManager.getFallbackValue(moduleName, prop, {});
  };
  
  return new Proxy(safeObject, {
    get(target, nestedProp) {
      if (nestedProp === 'toString') {
        return () => `[SafeProxy: ${fullPath}]`;
      }
      
      if (nestedProp === 'valueOf') {
        return () => null;
      }
      
      if (nestedProp === Symbol.toPrimitive) {
        return () => null;
      }
      
      // Log access to unknown nested property
      logger.warn(`Accessing unknown property '${nestedProp}' on unknown property '${prop}' of module '${moduleName}'`);
      
      // Return another safe proxy for deeper nesting
      return createSafePropertyProxy(fullPath, nestedProp, fallbackManager, logger);
    },
    
    set(target, nestedProp, value) {
      logger.warn(`Setting property '${nestedProp}' on unknown property '${prop}' of module '${moduleName}'`);
      return true;
    },
    
    apply(target, thisArg, argumentsList) {
      logger.warn(`Calling unknown function '${prop}' on module '${moduleName}'`);
      return fallbackManager.getFallbackValue(moduleName, prop, {});
    }
  });
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
      
      // Property doesn't exist - provide smart fallback
      logger.warn(`Property '${prop}' not found on module '${moduleName}'`);
      
      // Check if this looks like an event emitter pattern
      if (prop === 'PushEvents' || prop.endsWith('Events')) {
        return createEventEmitterProxy(prop, moduleName, logger);
      }
      
      // Check if this looks like a React Context pattern
      if (prop.endsWith('Context') || prop === 'Context') {
        const contextProxy = createReactContextProxy(prop, moduleName, logger);
        return createProxyWrapper(contextProxy, {
          moduleName: `${moduleName}.${prop}`,
          config: config[prop] || {},
          fallbackManager,
          logger
        });
      }
      
      // Check if this looks like a React component pattern
      if (prop.endsWith('Provider') || prop.endsWith('Consumer') || prop.endsWith('View') || prop.endsWith('Component')) {
        return createReactComponentProxy(prop, moduleName, logger);
      }
      
      // Check if this looks like a React hook pattern
      if (prop.startsWith('use') && prop.length > 3 && prop[3] === prop[3].toUpperCase()) {
        return createReactHookProxy(prop, moduleName, logger);
      }
      
      // Check if this looks like a listener method
      if (prop === 'addListener' || prop === 'addEventListener') {
        return createListenerProxy(prop, moduleName, logger);
      }
      
      // Check if this looks like a remove method
      if (prop === 'removeListener' || prop === 'removeEventListener' || prop === 'removeAllListeners') {
        return createRemoveListenerProxy(prop, moduleName, logger);
      }
      
      // Use the safe property proxy for unknown properties
      return createSafePropertyProxy(moduleName, prop, fallbackManager, logger);
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
      
      // For any other property, use smart pattern detection
      logger.warn(`Accessing property '${prop}' on missing module '${moduleName}'`);
      
      // Check if this looks like an event emitter pattern
      if (prop === 'PushEvents' || prop.endsWith('Events')) {
        return createEventEmitterProxy(prop, moduleName, logger);
      }
      
      // Check if this looks like a React Context pattern
      if (prop.endsWith('Context') || prop === 'Context') {
        const contextProxy = createReactContextProxy(prop, moduleName, logger);
        return createProxyWrapper(contextProxy, {
          moduleName: `${moduleName}.${prop}`,
          config: {},
          fallbackManager,
          logger
        });
      }
      
      // Check if this looks like a React component pattern
      if (prop.endsWith('Provider') || prop.endsWith('Consumer') || prop.endsWith('View') || prop.endsWith('Component')) {
        return createReactComponentProxy(prop, moduleName, logger);
      }
      
      // Check if this looks like a React hook pattern
      if (prop.startsWith('use') && prop.length > 3 && prop[3] === prop[3].toUpperCase()) {
        return createReactHookProxy(prop, moduleName, logger);
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