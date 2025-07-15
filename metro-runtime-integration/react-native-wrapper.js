/**
 * React Native Wrapper
 * 
 * This creates a Metro resolver that specifically handles
 * requireNativeComponent and other React Native APIs on web.
 */

const path = require('path');
const fs = require('fs');

/**
 * Apply React Native wrapper to Metro config
 */
function applyReactNativeWrapper(baseConfig, options = {}) {
  const {
    platforms = ['web', 'dom'],
    enableLogging = true
  } = options;

  // Store original resolver
  const originalResolver = baseConfig.resolver?.resolveRequest;
  
  // Create enhanced resolver
  baseConfig.resolver = baseConfig.resolver || {};
  baseConfig.resolver.resolveRequest = (context, moduleName, platform) => {
    try {
      // First resolve normally
      const resolution = originalResolver 
        ? originalResolver(context, moduleName, platform)
        : context.resolveRequest(context, moduleName, platform);
      
      // Check if this is react-native on web platform
      if (platforms.includes(platform) && moduleName === 'react-native') {
        if (enableLogging) {
          console.log(`[React Native Wrapper] Wrapping react-native for ${platform}`);
        }
        
        const wrapperPath = createReactNativeWrapper(resolution.filePath);
        
        if (wrapperPath) {
          return {
            ...resolution,
            filePath: wrapperPath
          };
        }
      }
      
      return resolution;
    } catch (error) {
      console.error(`[React Native Wrapper] Error resolving ${moduleName}:`, error.message);
      return originalResolver 
        ? originalResolver(context, moduleName, platform)
        : context.resolveRequest(context, moduleName, platform);
    }
  };

  return baseConfig;
}

/**
 * Create React Native wrapper file
 */
function createReactNativeWrapper(originalPath) {
  try {
    const timestamp = Date.now();
    const wrapperPath = path.join(__dirname, `../runtime-resolver/temp/react-native-wrapper-${timestamp}.js`);
    
    // Ensure temp directory exists
    const tempDir = path.dirname(wrapperPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const wrapperContent = generateReactNativeWrapper(originalPath);
    
    fs.writeFileSync(wrapperPath, wrapperContent, 'utf8');
    
    console.log(`[React Native Wrapper] Created wrapper at ${wrapperPath}`);
    return wrapperPath;
    
  } catch (error) {
    console.error('[React Native Wrapper] Error creating wrapper:', error.message);
    return null;
  }
}

/**
 * Generate React Native wrapper content
 */
function generateReactNativeWrapper(originalPath) {
  const runtimeResolverPath = path.resolve(__dirname, '../runtime-resolver/src/index');
  
  return `
/**
 * React Native Web Wrapper
 * Provides safe fallbacks for native-only APIs
 */

const React = require('react');

// Import runtime resolver
const { createRuntimeResolver } = require('${runtimeResolverPath.replace(/\\/g, '/')}');

const resolver = createRuntimeResolver({
  logging: true,
  logLevel: 'warn',
  fallbackStrategy: 'graceful'
});

// Import original React Native
let ReactNative;
try {
  ReactNative = require('${originalPath.replace(/\\/g, '/').replace(/'/g, "\\'")}');
} catch (error) {
  console.warn('Failed to import React Native:', error.message);
  ReactNative = {};
}

// Create safe wrapper
const SafeReactNative = { ...ReactNative };

// Override requireNativeComponent
SafeReactNative.requireNativeComponent = function(componentName, options) {
  // Check if we're on web
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    console.warn(\`requireNativeComponent('\${componentName}') not available on web\`);
    
    // Return a placeholder component
    const PlaceholderComponent = React.forwardRef((props, ref) => {
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
        }, \`Native Component: \${componentName}\`),
        React.createElement('div', { 
          key: 'message',
          style: { fontSize: '14px' }
        }, 'Not available on web platform')
      ]);
    });
    
    PlaceholderComponent.displayName = \`PlaceholderFor\${componentName}\`;
    return PlaceholderComponent;
  }
  
  // On native platforms, call original
  if (ReactNative.requireNativeComponent) {
    return ReactNative.requireNativeComponent(componentName, options);
  }
  
  // Fallback
  console.warn(\`requireNativeComponent not available: \${componentName}\`);
  return null;
};

// Override NativeModules access
if (SafeReactNative.NativeModules) {
  SafeReactNative.NativeModules = new Proxy(SafeReactNative.NativeModules || {}, {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
      
      // Web fallback for missing native modules
      if (typeof window !== 'undefined') {
        console.warn(\`NativeModules.\${prop} not available on web\`);
        return new Proxy({}, {
          get(moduleTarget, method) {
            return function(...args) {
              console.warn(\`NativeModules.\${prop}.\${method}() not available on web\`);
              return Promise.resolve(null);
            };
          }
        });
      }
      
      return target[prop];
    }
  });
}

// Override other problematic APIs
const webUnsafeApis = [
  'findNodeHandle',
  'UIManager',
  'DeviceEventEmitter',
  'NativeAppEventEmitter'
];

webUnsafeApis.forEach(api => {
  if (SafeReactNative[api]) {
    SafeReactNative[api] = resolver.resolve(\`react-native.\${api}\`, SafeReactNative[api]);
  }
});

module.exports = SafeReactNative;
`;
}

module.exports = {
  applyReactNativeWrapper
};