/**
 * Emergency Metro Config - Bypasses cache issues completely
 * 
 * This configuration avoids the .metro-cache directory entirely
 * and uses a simpler approach to prevent SHA-1 errors.
 */

const { getDefaultConfig } = require('expo/metro-config');
const { applyMinimalWrapper } = require('./minimal-wrapper');

const config = getDefaultConfig(__dirname);

// Method 1: Use the minimal wrapper (recommended)
const minimalConfig = applyMinimalWrapper(config, {
  modules: [
    'react-native-camera',
    'expo-camera',
    'expo-location',
    'expo-haptics',
    'react-native-device-info',
    'react-native-share',
    '@react-native-clipboard/clipboard',
    '@react-native-async-storage/async-storage',
    'expo-file-system',
    'expo-notifications',
    // Add your problematic modules here
  ],
  
  platforms: ['web', 'dom']
});

// Method 2: Even simpler - bypass wrapper generation entirely
const bypassConfig = (() => {
  const originalResolver = config.resolver?.resolveRequest;
  
  config.resolver = config.resolver || {};
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    try {
      const resolution = originalResolver 
        ? originalResolver(context, moduleName, platform)
        : context.resolveRequest(context, moduleName, platform);
      
      // Just log what would be wrapped, but don't actually wrap
      const isWeb = platform === 'web' || platform === 'dom';
      const nativeModules = [
        'react-native-camera',
        'expo-camera',
        'expo-location',
        'expo-haptics',
        'react-native-device-info',
        'react-native-share',
        '@react-native-clipboard/clipboard',
        '@react-native-async-storage/async-storage'
      ];
      
      if (isWeb && nativeModules.includes(moduleName)) {
        console.log(`[Emergency Config] Would wrap ${moduleName} for web (currently bypassed)`);
      }
      
      return resolution;
    } catch (error) {
      console.error(`[Emergency Config] Resolver error for ${moduleName}:`, error.message);
      throw error;
    }
  };
  
  return config;
})();

// Method 3: Basic error handling only
const basicConfig = (() => {
  const originalResolver = config.resolver?.resolveRequest;
  
  config.resolver = config.resolver || {};
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    try {
      return originalResolver 
        ? originalResolver(context, moduleName, platform)
        : context.resolveRequest(context, moduleName, platform);
    } catch (error) {
      console.error(`Resolver error for ${moduleName}:`, error.message);
      
      // Try to return a basic resolution
      return {
        type: 'sourceFile',
        filePath: require.resolve(moduleName)
      };
    }
  };
  
  return config;
})();

// Export the configuration that works for you:

// Option 1: Try minimal wrapper first
module.exports = minimalConfig;

// Option 2: If still getting errors, use bypass
// module.exports = bypassConfig;

// Option 3: If all else fails, use basic
// module.exports = basicConfig;