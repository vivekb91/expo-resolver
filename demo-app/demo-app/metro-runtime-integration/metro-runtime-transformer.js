/**
 * Metro Transformer with Runtime Resolver Integration
 * 
 * This transformer automatically injects runtime resolver wrapping
 * for native modules without requiring code changes.
 */

const { transform } = require('metro-react-native-babel-transformer');

/**
 * Transform with runtime resolver injection
 */
function transformWithRuntimeResolver(src, filename, options) {
  // First, apply the standard transformation
  const result = transform(src, filename, options);
  
  // Check if this is a web platform build
  const isWebPlatform = options.platform === 'web' || options.platform === 'dom';
  
  if (isWebPlatform) {
    // Inject runtime resolver for imports
    result.code = injectRuntimeResolver(result.code, filename);
  }
  
  return result;
}

/**
 * Inject runtime resolver for native module imports
 */
function injectRuntimeResolver(code, filename) {
  // List of patterns to match native modules
  const nativeModulePatterns = [
    /require\(['"]react-native-[^'"]*['"]\)/g,
    /require\(['"]expo-[^'"]*['"]\)/g,
    /require\(['"]@react-native-[^'"]*['"]\)/g,
    /import\s+.*\s+from\s+['"]react-native-[^'"]*['"]/g,
    /import\s+.*\s+from\s+['"]expo-[^'"]*['"]/g,
    /import\s+.*\s+from\s+['"]@react-native-[^'"]*['"]/g,
  ];
  
  // Check if this file contains native module imports
  const hasNativeImports = nativeModulePatterns.some(pattern => pattern.test(code));
  
  if (hasNativeImports) {
    // Prepend runtime resolver setup
    const runtimeResolverSetup = `
// Auto-injected runtime resolver setup
const { createRuntimeResolver } = require('react-native-web-runtime-resolver');
const __runtimeResolver = createRuntimeResolver({
  logging: true,
  logLevel: 'warn',
  fallbackStrategy: 'graceful'
});

// Wrap require function for native modules
const originalRequire = require;
require = function(moduleName) {
  const result = originalRequire.apply(this, arguments);
  
  // Check if this is a native module that needs wrapping
  const nativeModuleRegex = /^(react-native-|expo-|@react-native-)/;
  if (nativeModuleRegex.test(moduleName)) {
    return __runtimeResolver.resolve(moduleName, result);
  }
  
  return result;
};
`;
    
    code = runtimeResolverSetup + code;
  }
  
  return code;
}

module.exports = {
  transform: transformWithRuntimeResolver
};