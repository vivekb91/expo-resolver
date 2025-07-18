/**
 * Fallback Manager - Handles fallback behaviors for missing/failing methods
 * 
 * This module manages different fallback strategies and provides
 * graceful alternatives when native features are not available.
 */

class FallbackManager {
  constructor(config = {}) {
    this.config = {
      returnValue: null,
      throwError: false,
      logMessage: true,
      customFallbacks: {},
      ...config
    };
    
    // Built-in fallbacks for common patterns
    this.builtInFallbacks = this.initializeBuiltInFallbacks();
  }

  /**
   * Initialize built-in fallbacks for common React Native modules
   * @returns {Object} - Built-in fallback configurations
   */
  initializeBuiltInFallbacks() {
    return {
      // Camera related fallbacks
      'react-native-camera': {
        takePicture: () => {
          console.warn('Camera not available on web platform');
          return Promise.reject(new Error('Camera not supported on web'));
        }
      },
      
      // Location fallbacks
      'expo-location': {
        getCurrentPositionAsync: () => {
          if (navigator.geolocation) {
            return new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                position => resolve({
                  coords: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude,
                    heading: position.coords.heading,
                    speed: position.coords.speed
                  }
                }),
                error => reject(error)
              );
            });
          }
          console.warn('Location not available on this platform');
          return Promise.reject(new Error('Location not supported'));
        }
      },
      
      // Haptics fallbacks
      'expo-haptics': {
        impactAsync: (style) => {
          if (navigator.vibrate) {
            const duration = style === 'heavy' ? 100 : style === 'medium' ? 50 : 25;
            navigator.vibrate(duration);
            return Promise.resolve();
          }
          console.warn('Haptics not available on this platform');
          return Promise.resolve();
        }
      },
      
      // Device info fallbacks
      'react-native-device-info': {
        getDeviceId: () => {
          console.warn('Device ID not available on web');
          return Promise.resolve('web-device');
        },
        getSystemVersion: () => {
          console.warn('System version not available on web');
          return Promise.resolve('web');
        }
      },
      
      // Share fallbacks
      'react-native-share': {
        open: (options) => {
          if (navigator.share) {
            return navigator.share({
              title: options.title,
              text: options.message,
              url: options.url
            });
          }
          console.warn('Share not available on this platform');
          return Promise.resolve();
        }
      },
      
      // Clipboard fallbacks
      '@react-native-clipboard/clipboard': {
        getString: () => {
          if (navigator.clipboard) {
            return navigator.clipboard.readText();
          }
          console.warn('Clipboard read not available on this platform');
          return Promise.resolve('');
        },
        setString: (text) => {
          if (navigator.clipboard) {
            return navigator.clipboard.writeText(text);
          }
          console.warn('Clipboard write not available on this platform');
          return Promise.resolve();
        }
      },

      // NetInfo fallbacks
      '@react-native-community/netinfo': {
        fetch: () => {
          if (navigator.onLine !== undefined) {
            return Promise.resolve({
              type: navigator.onLine ? 'wifi' : 'none',
              isConnected: navigator.onLine,
              isInternetReachable: navigator.onLine,
              details: {
                isConnectionExpensive: false,
                ssid: null,
                bssid: null,
                strength: null,
                ipAddress: null,
                subnet: null,
                frequency: null
              }
            });
          }
          return Promise.resolve({
            type: 'unknown',
            isConnected: null,
            isInternetReachable: null,
            details: null
          });
        },
        addEventListener: (listener) => {
          if (typeof window !== 'undefined' && window.addEventListener) {
            const handleOnline = () => listener({
              type: 'wifi',
              isConnected: true,
              isInternetReachable: true,
              details: { isConnectionExpensive: false }
            });
            const handleOffline = () => listener({
              type: 'none',
              isConnected: false,
              isInternetReachable: false,
              details: null
            });
            
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);
            
            return () => {
              window.removeEventListener('online', handleOnline);
              window.removeEventListener('offline', handleOffline);
            };
          }
          return () => {};
        },
        useNetInfo: () => ({
          type: navigator.onLine ? 'wifi' : 'none',
          isConnected: navigator.onLine,
          isInternetReachable: navigator.onLine,
          details: null
        })
      },

      // NetInfo.NetInfoStateType fallbacks
      '@react-native-community/netinfo.NetInfoStateType': {
        none: 'none',
        unknown: 'unknown',
        cellular: 'cellular',
        wifi: 'wifi',
        bluetooth: 'bluetooth',
        ethernet: 'ethernet',
        wimax: 'wimax',
        vpn: 'vpn',
        other: 'other'
      },

      // NetInfo.NetInfoCellularGeneration fallbacks
      '@react-native-community/netinfo.NetInfoCellularGeneration': {
        '2g': '2g',
        '3g': '3g',
        '4g': '4g',
        '5g': '5g'
      }
    };
  }

  /**
   * Handle method errors with appropriate fallback
   * @param {string} methodName - Full method name (module.method)
   * @param {Error} error - The error that occurred
   * @param {Array} args - Arguments passed to the method
   * @param {Object} config - Method-specific configuration
   * @returns {*} - Fallback value
   */
  handleMethodError(methodName, error, args, config = {}) {
    // Check for custom fallback first
    const customFallback = this.getCustomFallback(methodName, config);
    if (customFallback) {
      return this.executeCustomFallback(customFallback, error, args, methodName);
    }

    // Check for built-in fallback
    const builtInFallback = this.getBuiltInFallback(methodName);
    if (builtInFallback) {
      return this.executeBuiltInFallback(builtInFallback, error, args, methodName);
    }

    // Use default fallback strategy
    return this.executeDefaultFallback(error, args, methodName, config);
  }

  /**
   * Get fallback value for a property
   * @param {string} moduleName - Name of the module
   * @param {string} prop - Property name
   * @param {Object} config - Configuration
   * @returns {*} - Fallback value
   */
  getFallbackValue(moduleName, prop, config = {}) {
    const fullPath = `${moduleName}.${prop}`;
    
    // Check for custom fallback
    const customFallback = this.getCustomFallback(fullPath, config);
    if (customFallback) {
      return typeof customFallback === 'function' ? customFallback : customFallback;
    }

    // Check for built-in fallback
    const builtInFallback = this.getBuiltInFallback(fullPath);
    if (builtInFallback) {
      return builtInFallback;
    }

    // Return a no-op function for methods, null for properties
    if (this.isMethodName(prop)) {
      return (...args) => {
        console.warn(`Method ${fullPath} not available on web platform`);
        return config.returnValue || this.config.returnValue;
      };
    }

    return config.returnValue || this.config.returnValue;
  }


  /**
   * Create a fallback module for completely missing modules
   * @param {string} moduleName - Name of the module
   * @param {Error} error - Import error
   * @returns {Object} - Fallback module object
   */
  createFallbackModule(moduleName, error) {
    console.warn(`Module ${moduleName} not available, using fallback`);
    
    // Check if we have built-in fallbacks for this module
    if (this.builtInFallbacks[moduleName]) {
      return { ...this.builtInFallbacks[moduleName] };
    }

    // Return a generic fallback object
    return new Proxy({}, {
      get: (target, prop) => {
        return this.getFallbackValue(moduleName, prop);
      }
    });
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  // Private methods

  /**
   * Get custom fallback for a method/property
   * @param {string} fullPath - Full path (module.method)
   * @param {Object} config - Configuration
   * @returns {*} - Custom fallback or null
   */
  getCustomFallback(fullPath, config = {}) {
    return config.fallback || this.config.customFallbacks[fullPath] || null;
  }

  /**
   * Get built-in fallback for a method/property
   * @param {string} fullPath - Full path (module.method)
   * @returns {*} - Built-in fallback or null
   */
  getBuiltInFallback(fullPath) {
    const parts = fullPath.split('.');
    const moduleName = parts[0];
    const methodName = parts.slice(1).join('.');

    if (this.builtInFallbacks[moduleName] && this.builtInFallbacks[moduleName][methodName]) {
      return this.builtInFallbacks[moduleName][methodName];
    }

    return null;
  }

  /**
   * Execute custom fallback
   * @param {*} fallback - Custom fallback
   * @param {Error} error - Original error
   * @param {Array} args - Method arguments
   * @param {string} methodName - Method name
   * @returns {*} - Fallback result
   */
  executeCustomFallback(fallback, error, args, methodName) {
    if (typeof fallback === 'function') {
      return fallback(error, args, methodName);
    }
    return fallback;
  }

  /**
   * Execute built-in fallback
   * @param {*} fallback - Built-in fallback
   * @param {Error} error - Original error
   * @param {Array} args - Method arguments
   * @param {string} methodName - Method name
   * @returns {*} - Fallback result
   */
  executeBuiltInFallback(fallback, error, args, methodName) {
    if (typeof fallback === 'function') {
      return fallback(...args);
    }
    return fallback;
  }

  /**
   * Execute default fallback strategy
   * @param {Error} error - Original error
   * @param {Array} args - Method arguments
   * @param {string} methodName - Method name
   * @param {Object} config - Configuration
   * @returns {*} - Fallback result
   */
  executeDefaultFallback(error, args, methodName, config) {
    const shouldThrow = config.throwError !== undefined ? config.throwError : this.config.throwError;
    const returnValue = config.returnValue !== undefined ? config.returnValue : this.config.returnValue;

    if (shouldThrow) {
      throw error;
    }

    if (this.config.logMessage) {
      console.warn(`Method ${methodName} failed, using fallback:`, error.message);
    }

    return returnValue;
  }

  /**
   * Check if a property name looks like a method
   * @param {string} prop - Property name
   * @returns {boolean} - True if looks like a method
   */
  isMethodName(prop) {
    // Common method name patterns
    const methodPatterns = [
      /^get/,
      /^set/,
      /^is/,
      /^has/,
      /^can/,
      /Async$/,
      /^on/,
      /^add/,
      /^remove/,
      /^start/,
      /^stop/,
      /^open/,
      /^close/,
      /^create/,
      /^delete/,
      /^update/
    ];

    return methodPatterns.some(pattern => pattern.test(prop));
  }

  /**
   * Check if a fallback exists for a property
   * @param {string} moduleName - Module name
   * @param {string} prop - Property name
   * @returns {boolean} - True if fallback exists
   */
  hasFallback(moduleName, prop) {
    const fullPath = `${moduleName}.${prop}`;
    return !!this.getCustomFallback(fullPath) || !!this.getBuiltInFallback(fullPath);
  }

  /**
   * Get available fallback keys for a module
   * @param {string} moduleName - Module name
   * @returns {Array} - Array of fallback keys
   */
  getFallbackKeys(moduleName) {
    const keys = [];
    
    // Get custom fallback keys
    Object.keys(this.config.customFallbacks).forEach(key => {
      if (key.startsWith(moduleName + '.')) {
        keys.push(key.substring(moduleName.length + 1));
      }
    });
    
    // Get built-in fallback keys
    if (this.builtInFallbacks[moduleName]) {
      keys.push(...Object.keys(this.builtInFallbacks[moduleName]));
    }
    
    return keys;
  }

}

module.exports = {
  FallbackManager
};