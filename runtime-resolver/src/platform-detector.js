/**
 * Platform Detector - Detect the current runtime platform
 * 
 * This module provides reliable platform detection for React Native,
 * React Native Web, and other web environments.
 */

class PlatformDetector {
  constructor() {
    this.cachedPlatform = null;
  }

  /**
   * Detect if running on web platform
   * @returns {boolean} - True if running on web
   */
  isWeb() {
    if (this.cachedPlatform !== null) {
      return this.cachedPlatform === 'web';
    }

    // Multiple detection methods for reliability
    const platform = this.detectPlatform();
    this.cachedPlatform = platform;
    
    return platform === 'web';
  }

  /**
   * Detect if running on native platform
   * @returns {boolean} - True if running on native
   */
  isNative() {
    return !this.isWeb();
  }

  /**
   * Get the current platform
   * @returns {string} - 'web', 'ios', 'android', or 'unknown'
   */
  getPlatform() {
    if (this.cachedPlatform !== null) {
      return this.cachedPlatform;
    }

    const platform = this.detectPlatform();
    this.cachedPlatform = platform;
    
    return platform;
  }

  /**
   * Detect the current platform using various methods
   * @returns {string} - Detected platform
   */
  detectPlatform() {
    // Method 1: Check for React Native Platform module
    try {
      const Platform = require('react-native').Platform;
      if (Platform && Platform.OS) {
        return Platform.OS;
      }
    } catch (error) {
      // Platform module not available or failed to load
    }

    // Method 2: Check for web-specific globals
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      return 'web';
    }

    // Method 3: Check for Node.js environment
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      return 'node';
    }

    // Method 4: Check for React Native specific globals
    if (typeof global !== 'undefined' && global.navigator && global.navigator.product === 'ReactNative') {
      return 'native';
    }

    // Method 5: Check for browser user agent patterns
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
      const userAgent = navigator.userAgent;
      
      if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        return 'ios';
      }
      
      if (userAgent.includes('Android')) {
        return 'android';
      }
      
      // If we have navigator but no mobile patterns, assume web
      return 'web';
    }

    // Method 6: Check for web-specific APIs
    if (typeof fetch !== 'undefined' && typeof Headers !== 'undefined' && typeof Request !== 'undefined') {
      return 'web';
    }

    // Default fallback
    return 'unknown';
  }

  /**
   * Check if running in development mode
   * @returns {boolean} - True if in development
   */
  isDevelopment() {
    // Check common development indicators
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
      return true;
    }

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      return true;
    }

    return false;
  }

  /**
   * Check if running in production mode
   * @returns {boolean} - True if in production
   */
  isProduction() {
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
      return true;
    }

    return !this.isDevelopment();
  }

  /**
   * Get detailed environment information
   * @returns {Object} - Environment details
   */
  getEnvironmentInfo() {
    return {
      platform: this.getPlatform(),
      isWeb: this.isWeb(),
      isNative: this.isNative(),
      isDevelopment: this.isDevelopment(),
      isProduction: this.isProduction(),
      hasWindow: typeof window !== 'undefined',
      hasDocument: typeof document !== 'undefined',
      hasNavigator: typeof navigator !== 'undefined',
      hasProcess: typeof process !== 'undefined',
      hasGlobal: typeof global !== 'undefined',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null
    };
  }

  /**
   * Reset the cached platform detection
   */
  resetCache() {
    this.cachedPlatform = null;
  }
}

module.exports = {
  PlatformDetector
};