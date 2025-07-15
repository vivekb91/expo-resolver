/**
 * Safe React Native Wrapper
 * 
 * This provides safe versions of React Native APIs that don't crash on web.
 */

const React = require('react');

// Platform detection
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

// Safe requireNativeComponent
const requireNativeComponent = (componentName, options) => {
  if (isWeb) {
    console.warn(`requireNativeComponent('${componentName}') not available on web`);
    
    // Return a placeholder component
    return React.forwardRef((props, ref) => {
      return React.createElement('div', {
        ...props,
        ref,
        style: {
          ...props.style,
          border: '2px dashed #ccc',
          padding: '20px',
          textAlign: 'center',
          color: '#666',
          backgroundColor: '#f9f9f9',
          borderRadius: '4px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }
      }, [
        React.createElement('div', { 
          key: 'title',
          style: { fontWeight: 'bold', marginBottom: '8px' }
        }, `Native Component: ${componentName}`),
        React.createElement('div', { 
          key: 'message',
          style: { fontSize: '14px' }
        }, 'Not available on web platform')
      ]);
    });
  }
  
  // On native platforms, import and use original
  const ReactNative = require('react-native');
  return ReactNative.requireNativeComponent(componentName, options);
};

// Safe NativeModules access
const NativeModules = new Proxy({}, {
  get(target, prop) {
    if (isWeb) {
      console.warn(`NativeModules.${prop} not available on web`);
      return new Proxy({}, {
        get(moduleTarget, method) {
          return function(...args) {
            console.warn(`NativeModules.${prop}.${method}() not available on web`);
            return Promise.resolve(null);
          };
        }
      });
    }
    
    const ReactNative = require('react-native');
    return ReactNative.NativeModules[prop];
  }
});

// Safe findNodeHandle
const findNodeHandle = (component) => {
  if (isWeb) {
    console.warn('findNodeHandle not available on web');
    return null;
  }
  
  const ReactNative = require('react-native');
  return ReactNative.findNodeHandle(component);
};

// Safe UIManager
const UIManager = new Proxy({}, {
  get(target, prop) {
    if (isWeb) {
      console.warn(`UIManager.${prop} not available on web`);
      return () => {
        console.warn(`UIManager.${prop}() not available on web`);
        return null;
      };
    }
    
    const ReactNative = require('react-native');
    return ReactNative.UIManager[prop];
  }
});

// Export safe versions
module.exports = {
  requireNativeComponent,
  NativeModules,
  findNodeHandle,
  UIManager
};

// Also export everything else from react-native for convenience
if (!isWeb) {
  const ReactNative = require('react-native');
  Object.keys(ReactNative).forEach(key => {
    if (!module.exports[key]) {
      module.exports[key] = ReactNative[key];
    }
  });
}