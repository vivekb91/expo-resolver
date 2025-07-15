
// Auto-generated runtime wrapper for react-native-image-picker
const { createRuntimeResolver } = require('../runtime-resolver/src/index');

console.log('[Runtime Wrapper] Loading wrapper for react-native-image-picker');

const resolver = createRuntimeResolver({
  logging: true,
  logLevel: 'warn',
  fallbackStrategy: 'graceful'
});

let wrappedModule = {};

try {
  // Try to require the original module
  const originalModule = require('react-native-image-picker');
  
  // Wrap it with runtime resolver
  wrappedModule = resolver.resolve('react-native-image-picker', originalModule);
  
  console.log('[Runtime Wrapper] Successfully wrapped react-native-image-picker');
  
  // Handle default exports
  if (originalModule && originalModule.default) {
    wrappedModule.default = resolver.resolve('react-native-image-picker', originalModule.default);
  }
  
  // Handle named exports
  if (originalModule) {
    Object.keys(originalModule).forEach(key => {
      if (key !== 'default' && typeof originalModule[key] === 'object') {
        wrappedModule[key] = resolver.resolve('react-native-image-picker.' + key, originalModule[key]);
      } else if (key !== 'default') {
        wrappedModule[key] = originalModule[key];
      }
    });
  }
  
} catch (error) {
  console.warn('[Runtime Wrapper] Failed to load react-native-image-picker:', error.message);
  
  // Create safe fallback
  wrappedModule = resolver.resolve('react-native-image-picker', {});
}

module.exports = wrappedModule;
