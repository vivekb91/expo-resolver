/**
 * Metro Configuration with Runtime Resolver Integration
 * 
 * This configuration automatically wraps native modules with runtime resolver
 * without requiring any code changes in your React Native app.
 */

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

/**
 * Create a resolver that automatically wraps native modules
 */
function createAutoWrappingResolver(baseResolver) {
  const { createRuntimeResolver } = require('./runtime-resolver/src/index');
  
  // Create resolver instance
  const runtimeResolver = createRuntimeResolver({
    logging: true,
    logLevel: 'warn',
    fallbackStrategy: 'graceful'
  });

  // List of modules to auto-wrap (add your problematic modules here)
  const AUTO_WRAP_MODULES = [
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
    'react-native-geolocation-service',
    'react-native-contacts',
    'react-native-permissions',
    'expo-sensors',
    'expo-barcode-scanner',
    'react-native-image-picker',
    'react-native-document-picker',
    'expo-media-library',
    'expo-av',
    'react-native-maps',
    'react-native-bluetooth-serial',
    'react-native-nfc-manager',
    // Add more modules as needed
  ];

  return (context, moduleName, platform) => {
    // First, resolve the module normally
    const resolvedModule = baseResolver(context, moduleName, platform);
    
    // Check if this is a web platform and module needs wrapping
    const isWebPlatform = platform === 'web' || platform === 'dom';
    const needsWrapping = isWebPlatform && AUTO_WRAP_MODULES.includes(moduleName);
    
    if (needsWrapping) {
      // Create a wrapper module that applies runtime resolver
      const wrapperPath = createRuntimeWrapper(moduleName, resolvedModule.filePath);
      
      return {
        ...resolvedModule,
        filePath: wrapperPath
      };
    }
    
    return resolvedModule;
  };
}

/**
 * Create a runtime wrapper file for a module
 */
function createRuntimeWrapper(moduleName, originalPath) {
  const fs = require('fs');
  const crypto = require('crypto');
  
  // Create unique wrapper file path
  const hash = crypto.createHash('md5').update(moduleName).digest('hex');
  const wrapperPath = path.join(__dirname, '.metro-cache', `runtime-wrapper-${hash}.js`);
  
  // Ensure cache directory exists
  const cacheDir = path.dirname(wrapperPath);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  
  // Generate wrapper content
  const wrapperContent = `
/**
 * Auto-generated runtime wrapper for ${moduleName}
 * This file automatically applies runtime resolver without code changes
 */

const { createRuntimeResolver } = require('${path.resolve(__dirname, 'runtime-resolver/src/index')}');

// Create resolver instance
const resolver = createRuntimeResolver({
  logging: true,
  logLevel: 'warn',
  fallbackStrategy: 'graceful'
});

// Import the original module
const originalModule = require('${originalPath}');

// Wrap with runtime resolver
const wrappedModule = resolver.resolve('${moduleName}', originalModule);

// Export the wrapped module
module.exports = wrappedModule;

// Handle default exports
if (originalModule.default) {
  const wrappedDefault = resolver.resolve('${moduleName}', originalModule.default);
  module.exports.default = wrappedDefault;
}

// Handle named exports
Object.keys(originalModule).forEach(key => {
  if (key !== 'default' && typeof originalModule[key] === 'object') {
    const wrappedExport = resolver.resolve('${moduleName}.${key}', originalModule[key]);
    module.exports[key] = wrappedExport;
  }
});
`;

  // Write wrapper file
  fs.writeFileSync(wrapperPath, wrapperContent);
  
  return wrapperPath;
}

/**
 * Enhanced Metro resolver with runtime wrapping
 */
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Apply auto-wrapping resolver
config.resolver.resolveRequest = createAutoWrappingResolver(config.resolver.resolveRequest);

/**
 * Add transformer to handle runtime resolver modules
 */
const originalTransformer = config.transformer.babelTransformerPath;

config.transformer.babelTransformerPath = require.resolve('./metro-runtime-transformer');

/**
 * Add runtime resolver to watched folders
 */
config.watchFolders = [
  ...config.watchFolders,
  path.resolve(__dirname, 'runtime-resolver')
];

/**
 * Configure for web builds
 */
if (process.env.EXPO_PLATFORM === 'web') {
  // Web-specific configurations
  config.resolver.alias = {
    ...config.resolver.alias,
    'react-native': 'react-native-web'
  };
}

module.exports = config;