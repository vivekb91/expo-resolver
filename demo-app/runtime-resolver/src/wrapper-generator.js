/**
 * Wrapper Generator - Creates runtime wrappers based on interface analysis
 * 
 * This module takes the interface analysis results and generates appropriate
 * runtime wrappers that provide proper fallbacks for each export type.
 */

class WrapperGenerator {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Generate runtime wrapper based on interface analysis
   * @param {Object} moduleInterface - Interface analysis result
   * @returns {Object} - Runtime wrapper object
   */
  generateWrapper(moduleInterface) {
    const { moduleName, exports } = moduleInterface;
    
    this.logger.info(`[WrapperGenerator] Generating wrapper for ${moduleName}`);
    
    const wrapper = {};
    
    // Generate wrapper for each export
    for (const [key, exportInfo] of Object.entries(exports)) {
      wrapper[key] = this.generateExportWrapper(key, exportInfo, moduleName);
    }
    
    return wrapper;
  }

  /**
   * Generate wrapper for a single export
   * @param {string} key - Export key name
   * @param {Object} exportInfo - Export information from interface analysis
   * @param {string} moduleName - Module name for context
   * @returns {*} - Wrapper for the export
   */
  generateExportWrapper(key, exportInfo, moduleName) {
    const { type } = exportInfo;
    
    switch (type) {
      case 'react-component':
        return this.generateReactComponentWrapper(key, exportInfo, moduleName);
      
      case 'react-hook':
        return this.generateReactHookWrapper(key, exportInfo, moduleName);
      
      case 'react-context':
        return this.generateReactContextWrapper(key, exportInfo, moduleName);
      
      case 'function':
        return this.generateFunctionWrapper(key, exportInfo, moduleName);
      
      case 'object':
        return this.generateObjectWrapper(key, exportInfo, moduleName);
      
      case 'null':
        return null;
      
      default:
        return this.generateDefaultWrapper(key, exportInfo, moduleName);
    }
  }

  /**
   * Generate wrapper for React components
   * @param {string} key - Component key name
   * @param {Object} exportInfo - Export information
   * @param {string} moduleName - Module name
   * @returns {Function} - React component wrapper
   */
  generateReactComponentWrapper(key, exportInfo, moduleName) {
    const { subtype } = exportInfo;
    
    return (props = {}) => {
      this.logger.info(`[WrapperGenerator] ${moduleName}.${key} (${subtype}) called`);
      
      // For web, try to detect if React is available
      if (typeof window !== 'undefined' && window.React) {
        return window.React.createElement('div', 
          { 
            'data-fallback-component': `${moduleName}.${key}`,
            'data-component-type': subtype,
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
        // Return a basic object structure
        return { 
          $$typeof: Symbol.for('react.element'),
          type: 'div',
          props: props,
          key: null,
          ref: null
        };
      }
    };
  }

  /**
   * Generate wrapper for React hooks
   * @param {string} key - Hook key name
   * @param {Object} exportInfo - Export information
   * @param {string} moduleName - Module name
   * @returns {Function} - React hook wrapper
   */
  generateReactHookWrapper(key, exportInfo, moduleName) {
    const { returnType } = exportInfo;
    
    return (...args) => {
      this.logger.info(`[WrapperGenerator] ${moduleName}.${key} hook called`);
      
      switch (returnType) {
        case 'insets':
          return { top: 0, bottom: 0, left: 0, right: 0 };
        
        case 'dimensions':
          return { x: 0, y: 0, width: 0, height: 0 };
        
        case 'state-tuple':
          return [null, () => {}];
        
        case 'navigation-object':
          return {
            navigate: () => {},
            goBack: () => {},
            canGoBack: () => false,
            setOptions: () => {}
          };
        
        default:
          return null;
      }
    };
  }

  /**
   * Generate wrapper for React Context
   * @param {string} key - Context key name
   * @param {Object} exportInfo - Export information
   * @param {string} moduleName - Module name
   * @returns {Object} - React context wrapper
   */
  generateReactContextWrapper(key, exportInfo, moduleName) {
    const { hasProvider, hasConsumer, defaultValue } = exportInfo;
    
    // For React Context, always provide Consumer and Provider
    const contextDefaultValue = defaultValue || {
      insets: { top: 0, bottom: 0, left: 0, right: 0 },
      frame: { x: 0, y: 0, width: 0, height: 0 }
    };
    
    const contextWrapper = {
      _currentValue: contextDefaultValue,
      _context: contextDefaultValue
    };
    
    // Always provide Provider for React Context
    contextWrapper.Provider = this.generateReactComponentWrapper(
      `${key}.Provider`, 
      { type: 'react-component', subtype: 'provider' }, 
      moduleName
    );
    
    // Always provide Consumer for React Context
    contextWrapper.Consumer = (props = {}) => {
      this.logger.info(`[WrapperGenerator] ${moduleName}.${key}.Consumer called`);
      
      const { children } = props;
      
      // Call the children function with default value
      if (typeof children === 'function') {
        return children(contextDefaultValue);
      }
      
      return children || null;
    };
    
    return contextWrapper;
  }

  /**
   * Generate wrapper for regular functions
   * @param {string} key - Function key name
   * @param {Object} exportInfo - Export information
   * @param {string} moduleName - Module name
   * @returns {Function} - Function wrapper
   */
  generateFunctionWrapper(key, exportInfo, moduleName) {
    const { async, length } = exportInfo;
    
    return (...args) => {
      this.logger.info(`[WrapperGenerator] ${moduleName}.${key} function called with ${args.length} args`);
      
      // Return appropriate fallback based on function characteristics
      if (async) {
        return Promise.resolve(this.getDefaultReturnValue(key, moduleName));
      }
      
      return this.getDefaultReturnValue(key, moduleName);
    };
  }

  /**
   * Generate wrapper for objects
   * @param {string} key - Object key name
   * @param {Object} exportInfo - Export information
   * @param {string} moduleName - Module name
   * @returns {Object} - Object wrapper
   */
  generateObjectWrapper(key, exportInfo, moduleName) {
    const { properties } = exportInfo;
    
    const objectWrapper = {};
    
    // Generate wrappers for each property
    for (const [propKey, propInfo] of Object.entries(properties)) {
      objectWrapper[propKey] = this.generateExportWrapper(propKey, propInfo, `${moduleName}.${key}`);
    }
    
    return objectWrapper;
  }

  /**
   * Generate default wrapper for unknown types
   * @param {string} key - Export key name
   * @param {Object} exportInfo - Export information
   * @param {string} moduleName - Module name
   * @returns {*} - Default wrapper
   */
  generateDefaultWrapper(key, exportInfo, moduleName) {
    this.logger.warn(`[WrapperGenerator] Unknown export type for ${moduleName}.${key}: ${exportInfo.type}`);
    
    // Return a function that logs and returns a safe value
    return (...args) => {
      this.logger.info(`[WrapperGenerator] ${moduleName}.${key} (unknown type) called`);
      return this.getDefaultReturnValue(key, moduleName);
    };
  }

  /**
   * Get default return value based on key name patterns
   * @param {string} key - Export key name
   * @param {string} moduleName - Module name
   * @returns {*} - Default return value
   */
  getDefaultReturnValue(key, moduleName) {
    const lowerKey = key.toLowerCase();
    
    // Permission-related functions
    if (lowerKey.includes('permission') || lowerKey.includes('request')) {
      return { status: 'granted' };
    }
    
    // Get-related functions
    if (lowerKey.startsWith('get')) {
      if (lowerKey.includes('token')) return null;
      if (lowerKey.includes('info')) return {};
      if (lowerKey.includes('state')) return {};
      return null;
    }
    
    // Is/Has/Can boolean functions
    if (lowerKey.startsWith('is') || lowerKey.startsWith('has') || lowerKey.startsWith('can')) {
      return false;
    }
    
    // Event listener functions
    if (lowerKey.includes('listener') || lowerKey.includes('subscribe')) {
      return { remove: () => {} };
    }
    
    // Default safe return
    return null;
  }
}

module.exports = {
  WrapperGenerator
};