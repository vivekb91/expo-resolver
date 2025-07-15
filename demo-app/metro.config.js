/**
 * Metro Configuration with Runtime Resolver Integration
 * 
 * This configuration automatically wraps native modules with runtime resolver
 * without requiring any code changes in your React Native app.
 */

const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Modules to auto-wrap for web
const AUTO_WRAP_MODULES = [
  'expo-camera',
  'expo-location', 
  'expo-haptics',
  '@react-native-async-storage/async-storage',
  'react-native-device-info',
  'react-native-share',
  '@react-native-clipboard/clipboard',
  'expo-brightness',
  'expo-screen-orientation',
  'expo-notifications',
  'expo-sensors',
  'react-native-image-picker',
];

// Create wrapper files at startup
const wrapperDir = path.join(__dirname, 'runtime-wrappers');
if (!fs.existsSync(wrapperDir)) {
  fs.mkdirSync(wrapperDir, { recursive: true });
}

// Pre-create all wrapper files so Metro can find them
AUTO_WRAP_MODULES.forEach(moduleName => {
  const safeName = moduleName.replace(/[^a-zA-Z0-9]/g, '_');
  const wrapperPath = path.join(wrapperDir, `${safeName}.js`);
  
  const wrapperContent = `
// Auto-generated runtime wrapper for ${moduleName}
const { createRuntimeResolver } = require('../runtime-resolver/src/index');

console.log('[Runtime Wrapper] Loading wrapper for ${moduleName}');

const resolver = createRuntimeResolver({
  logging: true,
  logLevel: 'warn',
  fallbackStrategy: 'graceful'
});

let wrappedModule = {};

try {
  // Try to require the original module
  const originalModule = require('${moduleName}');
  
  // Wrap it with runtime resolver
  wrappedModule = resolver.resolve('${moduleName}', originalModule);
  
  console.log('[Runtime Wrapper] Successfully wrapped ${moduleName}');
  
  // Handle default exports
  if (originalModule && originalModule.default) {
    wrappedModule.default = resolver.resolve('${moduleName}', originalModule.default);
  }
  
  // Handle named exports
  if (originalModule) {
    Object.keys(originalModule).forEach(key => {
      if (key !== 'default' && typeof originalModule[key] === 'object') {
        wrappedModule[key] = resolver.resolve('${moduleName}.' + key, originalModule[key]);
      } else if (key !== 'default') {
        wrappedModule[key] = originalModule[key];
      }
    });
  }
  
} catch (error) {
  console.warn('[Runtime Wrapper] Failed to load ${moduleName}:', error.message);
  
  // Create safe fallback
  wrappedModule = resolver.resolve('${moduleName}', {});
}

module.exports = wrappedModule;
`;
  
  // Write wrapper file
  fs.writeFileSync(wrapperPath, wrapperContent, 'utf8');
});

// Store original resolver
const originalResolver = config.resolver?.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  try {
    // First resolve normally
    const resolution = originalResolver 
      ? originalResolver(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform);
    
    // Check if this is a web platform and module needs wrapping
    const isWebPlatform = platform === 'web' || platform === 'dom';
    const needsWrapping = isWebPlatform && AUTO_WRAP_MODULES.includes(moduleName);
    
    if (needsWrapping) {
      console.log(`[Metro Config] Wrapping ${moduleName} for ${platform}`);
      
      // Use pre-created wrapper file
      const safeName = moduleName.replace(/[^a-zA-Z0-9]/g, '_');
      const wrapperPath = path.join(wrapperDir, `${safeName}.js`);
      
      return {
        ...resolution,
        filePath: wrapperPath
      };
    }
    
    return resolution;
  } catch (error) {
    console.error(`[Metro Config] Error resolving ${moduleName}:`, error.message);
    return originalResolver 
      ? originalResolver(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform);
  }
};

// Add wrapper directory to watched folders
config.watchFolders = [
  ...config.watchFolders,
  wrapperDir,
  path.resolve(__dirname, 'runtime-resolver')
];

module.exports = config;