
// Auto-generated runtime wrapper for expo-camera
const { createRuntimeResolver } = require('../runtime-resolver/src/index');

console.log('[Runtime Wrapper] Loading wrapper for expo-camera');

const resolver = createRuntimeResolver({
  logging: true,
  logLevel: 'warn',
  fallbackStrategy: 'graceful'
});

let wrappedModule = {};

try {
  // Try to require the original module
  const originalModule = require('expo-camera');
  
  // Wrap it with runtime resolver
  wrappedModule = resolver.resolve('expo-camera', originalModule);
  
  console.log('[Runtime Wrapper] Successfully wrapped expo-camera');
  
  // Handle default exports
  if (originalModule && originalModule.default) {
    wrappedModule.default = resolver.resolve('expo-camera', originalModule.default);
  }
  
  // Handle named exports
  if (originalModule) {
    Object.keys(originalModule).forEach(key => {
      if (key !== 'default' && typeof originalModule[key] === 'object') {
        wrappedModule[key] = resolver.resolve('expo-camera.' + key, originalModule[key]);
      } else if (key !== 'default') {
        wrappedModule[key] = originalModule[key];
      }
    });
  }
  
} catch (error) {
  console.warn('[Runtime Wrapper] Failed to load expo-camera:', error.message);
  
  // Create safe fallback
  wrappedModule = resolver.resolve('expo-camera', {});
}

module.exports = wrappedModule;
