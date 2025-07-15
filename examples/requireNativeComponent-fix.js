/**
 * requireNativeComponent Fix
 * 
 * This shows how to handle requireNativeComponent calls on web
 * using the runtime resolver to provide fallbacks.
 */

// Method 1: Direct requireNativeComponent wrapping
const { createRuntimeResolver } = require('../runtime-resolver/src/index');

const resolver = createRuntimeResolver({
  logging: true,
  logLevel: 'warn',
  fallbackStrategy: 'graceful',
  
  // Global fallback for requireNativeComponent
  fallbacks: {
    returnValue: null,
    throwError: false,
    logMessage: true
  }
});

// Wrap requireNativeComponent itself
const originalRequireNativeComponent = require('react-native').requireNativeComponent;

const safeRequireNativeComponent = resolver.resolve('requireNativeComponent', originalRequireNativeComponent);

// Export the safe version
module.exports = {
  requireNativeComponent: safeRequireNativeComponent
};

// Method 2: More comprehensive React Native wrapping
const ReactNative = require('react-native');

const safeReactNative = resolver.resolve('react-native', ReactNative);

// Override specific problematic functions
safeReactNative.requireNativeComponent = function(componentName, options) {
  // Check if we're on web
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    console.warn(`requireNativeComponent('${componentName}') not available on web`);
    
    // Return a placeholder component
    return function PlaceholderComponent(props) {
      return React.createElement('div', {
        ...props,
        style: {
          ...props.style,
          border: '1px dashed #ccc',
          padding: '10px',
          textAlign: 'center',
          color: '#666'
        }
      }, `Native component '${componentName}' not available on web`);
    };
  }
  
  // On native platforms, call original
  return originalRequireNativeComponent(componentName, options);
};

module.exports = safeReactNative;