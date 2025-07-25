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

// Modules to auto-wrap for web (supports pattern matching)
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
  'react-native-logger', // Pattern: matches react-native-logger/dist/types too
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
// Auto-generated interface-based runtime wrapper for ${moduleName} (pattern-based)
const { createRuntimeResolver } = require('../runtime-resolver/src/index');
const { InterfaceAnalyzer } = require('../runtime-resolver/src/interface-analyzer');
const { WrapperGenerator } = require('../runtime-resolver/src/wrapper-generator');

// This wrapper handles any module matching the pattern: ${moduleName}
// The actual module name is determined at runtime from the Metro context

const resolver = createRuntimeResolver({
  logging: true,
  logLevel: 'warn',
  fallbackStrategy: 'graceful'
});

// This function wraps any module that matches the pattern
function wrapMatchingModule(actualModuleName) {
  console.log('[Interface Wrapper] Loading interface-based wrapper for', actualModuleName);
  
  let wrappedModule = {};

  try {
    // Try to require the original module using the actual module name
    const originalModule = require(actualModuleName);
    
    // Wrap it with runtime resolver
    wrappedModule = resolver.resolve(actualModuleName, originalModule);
    
    console.log('[Interface Wrapper] Successfully wrapped', actualModuleName);
    
  } catch (error) {
    console.warn('[Interface Wrapper] Failed to load', actualModuleName, ':', error.message);
  
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

// Native module aliases for web builds
const NATIVE_MODULE_ALIASES = {
  'react-native/Libraries/Utilities/codegenNativeCommands': path.join(__dirname, 'runtime-resolver/fallbacks/codegenNativeCommands.js'),
  'react-native/Libraries/Utilities/codegenNativeComponent': path.join(__dirname, 'runtime-resolver/fallbacks/codegenNativeComponent.js'),
  'react-native/Libraries/TurboModule/TurboModuleRegistry': path.join(__dirname, 'runtime-resolver/fallbacks/genericNativeFallback.js'),
  'react-native/Libraries/EventEmitter/NativeEventEmitter': path.join(__dirname, 'runtime-resolver/fallbacks/genericNativeFallback.js'),
  'react-native/Libraries/ReactNative/UIManager': path.join(__dirname, 'runtime-resolver/fallbacks/genericNativeFallback.js'),
  'react-native/Libraries/BatchedBridge/NativeModules': path.join(__dirname, 'runtime-resolver/fallbacks/genericNativeFallback.js'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  try {
    // Handle native-only modules for web platform
    const isWebPlatform = platform === 'web' || platform === 'dom';
    if (isWebPlatform && NATIVE_MODULE_ALIASES[moduleName]) {
      console.log(`[Metro Config] Aliasing native module ${moduleName} for web`);
      return {
        filePath: NATIVE_MODULE_ALIASES[moduleName],
        type: 'sourceFile'
      };
    }
    
    // First resolve normally
    const resolution = originalResolver 
      ? originalResolver(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform);
    
    // Check if this is a web platform and module needs wrapping (using pattern matching)
    const needsWrapping = isWebPlatform && AUTO_WRAP_MODULES.some(pattern => 
      moduleName.startsWith(pattern) || moduleName.includes(pattern)
    );
    
    if (needsWrapping) {
      console.log(`[Metro Config] Wrapping ${moduleName} for ${platform}`);
      
      // Find the matching pattern to determine the base module name
      const matchingPattern = AUTO_WRAP_MODULES.find(pattern => 
        moduleName.startsWith(pattern) || moduleName.includes(pattern)
      );
      
      // Create a dynamic wrapper file for this specific module
      const safeName = moduleName.replace(/[^a-zA-Z0-9]/g, '_');
      const wrapperPath = path.join(wrapperDir, `${safeName}.js`);
      
      // Create wrapper content for this specific module
      const wrapperContent = `
// Auto-generated runtime wrapper for ${moduleName}
const { createRuntimeResolver } = require('../runtime-resolver/src/index');
const { InterfaceAnalyzer } = require('../runtime-resolver/src/interface-analyzer');
const { WrapperGenerator } = require('../runtime-resolver/src/wrapper-generator');

console.log('[Interface Wrapper] Loading wrapper for ${moduleName}');

const resolver = createRuntimeResolver({
  logging: true,
  logLevel: 'warn',
  fallbackStrategy: 'graceful'
});

let wrappedModule = {};

try {
  const originalModule = require('${moduleName}');
  wrappedModule = resolver.resolve('${moduleName}', originalModule);
  console.log('[Interface Wrapper] Successfully wrapped ${moduleName}');
} catch (error) {
  console.warn('[Interface Wrapper] Failed to load ${moduleName}:', error.message);
  
  const analyzer = new InterfaceAnalyzer();
  const generator = new WrapperGenerator({
    info: (msg) => console.log('[Interface Wrapper]', msg),
    warn: (msg) => console.warn('[Interface Wrapper]', msg)
  });
  
  try {
    if (typeof process !== 'undefined' && process.platform) {
      const moduleInterface = analyzer.analyzeModuleInterface('${moduleName}', process.cwd());
      const interfaceWrapper = generator.generateWrapper(moduleInterface);
      console.log('[Interface Wrapper] Generated interface-based wrapper for ${moduleName}');
      wrappedModule = resolver.resolve('${moduleName}', interfaceWrapper);
    } else {
      console.log('[Interface Wrapper] Web environment - using basic fallback for ${moduleName}');
      wrappedModule = resolver.resolve('${moduleName}', {});
    }
  } catch (analysisError) {
    console.warn('[Interface Wrapper] Interface analysis failed:', analysisError.message);
    wrappedModule = resolver.resolve('${moduleName}', {});
  }
}

module.exports = wrappedModule;
`;
      
      // Write the wrapper file if it doesn't exist
      if (!fs.existsSync(wrapperPath)) {
        fs.writeFileSync(wrapperPath, wrapperContent, 'utf8');
      }
      
      return {
        ...resolution,
        filePath: wrapperPath
      };
    }
    
    return resolution;
  } catch (error) {
    console.error(`[Metro Config] Error resolving ${moduleName}:`, error.message);
    
    // If normal resolution fails and it's a React Native internal module on web, try generic fallback
    const isWebPlatform = platform === 'web' || platform === 'dom';
    const isRNInternal = moduleName.startsWith('react-native/Libraries/') || moduleName.includes('/react-native/Libraries/');
    
    if (isWebPlatform && isRNInternal) {
      console.warn(`[Metro Config] Using generic fallback for unknown RN internal module: ${moduleName}`);
      return {
        filePath: path.join(__dirname, 'runtime-resolver/fallbacks/genericNativeFallback.js'),
        type: 'sourceFile'
      };
    }
    
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