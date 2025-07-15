/**
 * Metro Config for requireNativeComponent Fix
 * 
 * This Metro configuration specifically handles the requireNativeComponent
 * error by wrapping the react-native module itself.
 */

const { getDefaultConfig } = require('expo/metro-config');
const { applyReactNativeWrapper } = require('./react-native-wrapper');

const config = getDefaultConfig(__dirname);

// Method 1: Wrap react-native module directly
const reactNativeWrappedConfig = applyReactNativeWrapper(config, {
  platforms: ['web', 'dom'],
  enableLogging: true
});

// Method 2: More comprehensive approach - wrap react-native + other modules
const { applyMinimalWrapper } = require('./minimal-wrapper');

const comprehensiveConfig = applyMinimalWrapper(config, {
  modules: [
    'react-native',  // This will catch requireNativeComponent
    'react-native-camera',
    'expo-camera',
    'expo-location',
    'expo-haptics',
    'react-native-device-info',
    'react-native-share',
    '@react-native-clipboard/clipboard',
    '@react-native-async-storage/async-storage',
  ],
  platforms: ['web', 'dom']
});

// Method 3: Simple fallback for specific module
const simpleConfig = (() => {
  const originalResolver = config.resolver?.resolveRequest;
  
  config.resolver = config.resolver || {};
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    try {
      const resolution = originalResolver 
        ? originalResolver(context, moduleName, platform)
        : context.resolveRequest(context, moduleName, platform);
      
      // Handle react-native specifically on web
      if ((platform === 'web' || platform === 'dom') && moduleName === 'react-native') {
        console.log('[Simple Fix] Providing react-native web fallback');
        
        // Create simple fallback wrapper
        const fallbackContent = \`
// Simple react-native fallback
const ReactNative = require('react-native-web');

// Add safe requireNativeComponent
ReactNative.requireNativeComponent = function(componentName, options) {
  console.warn(\`requireNativeComponent('\${componentName}') not available on web\`);
  
  // Return simple div component
  return function WebFallback(props) {
    return require('react').createElement('div', {
      ...props,
      style: {
        ...props.style,
        border: '1px dashed #ccc',
        padding: '10px',
        textAlign: 'center'
      }
    }, \`Native: \${componentName}\`);
  };
};

// Add other missing APIs
ReactNative.NativeModules = ReactNative.NativeModules || {};
ReactNative.findNodeHandle = ReactNative.findNodeHandle || (() => null);
ReactNative.UIManager = ReactNative.UIManager || {};

module.exports = ReactNative;
\`;
        
        // Write simple fallback
        const path = require('path');
        const fs = require('fs');
        
        const fallbackPath = path.join(__dirname, '../runtime-resolver/temp/rn-simple-fallback.js');
        const tempDir = path.dirname(fallbackPath);
        
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        fs.writeFileSync(fallbackPath, fallbackContent, 'utf8');
        
        return {
          ...resolution,
          filePath: fallbackPath
        };
      }
      
      return resolution;
    } catch (error) {
      console.error(\`Error resolving \${moduleName}:\`, error.message);
      throw error;
    }
  };
  
  return config;
})();

// Export the configuration that works for you:

// Try this first - specific react-native wrapping
module.exports = reactNativeWrappedConfig;

// If that doesn't work, try comprehensive
// module.exports = comprehensiveConfig;

// If all else fails, use simple fallback
// module.exports = simpleConfig;