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
  'react-native-safe-area-context',
  'react-native-screens',
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
// Auto-generated interface-based runtime wrapper for ${moduleName}
const { createRuntimeResolver } = require('../runtime-resolver/src/index');
const { InterfaceAnalyzer } = require('../runtime-resolver/src/interface-analyzer');
const { WrapperGenerator } = require('../runtime-resolver/src/wrapper-generator');

console.log('[Interface Wrapper] Loading interface-based wrapper for ${moduleName}');

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
  
  console.log('[Interface Wrapper] Successfully wrapped ${moduleName}');
  
} catch (error) {
  console.warn('[Interface Wrapper] Failed to load ${moduleName}:', error.message);
  
  // Use interface analysis to create intelligent fallbacks
  const analyzer = new InterfaceAnalyzer();
  const generator = new WrapperGenerator({
    info: (msg) => console.log('[Interface Wrapper]', msg),
    warn: (msg) => console.warn('[Interface Wrapper]', msg)
  });
  
  try {
    // Try interface analysis only in Node.js environment
    if (typeof process !== 'undefined' && process.platform) {
      // Analyze the module interface
      const moduleInterface = analyzer.analyzeModuleInterface('${moduleName}', process.cwd());
      
      // Generate wrapper based on interface analysis
      const interfaceWrapper = generator.generateWrapper(moduleInterface);
      
      console.log('[Interface Wrapper] Generated interface-based wrapper for ${moduleName}');
      console.log('[Interface Wrapper] Detected exports:', Object.keys(moduleInterface.exports));
      
      // Wrap the interface-based fallback with runtime resolver
      wrappedModule = resolver.resolve('${moduleName}', interfaceWrapper);
    } else {
      // Web environment - use basic fallback
      console.log('[Interface Wrapper] Web environment - using basic fallback for ${moduleName}');
      wrappedModule = resolver.resolve('${moduleName}', {});
    }
    
  } catch (analysisError) {
    console.warn('[Interface Wrapper] Interface analysis failed:', analysisError.message);
    
    // Ultimate fallback - empty object
    wrappedModule = resolver.resolve('${moduleName}', {});
  }
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