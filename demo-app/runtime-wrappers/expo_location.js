
// Auto-generated runtime wrapper for expo-location
const { createRuntimeResolver } = require('../runtime-resolver/src/index');

console.log('[Runtime Wrapper] Loading wrapper for expo-location');

const resolver = createRuntimeResolver({
  logging: true,
  logLevel: 'warn',
  fallbackStrategy: 'graceful'
});

let wrappedModule = {};

try {
  // Try to require the original module
  const originalModule = require('expo-location');
  
  // Wrap it with runtime resolver
  wrappedModule = resolver.resolve('expo-location', originalModule);
  
  console.log('[Runtime Wrapper] Successfully wrapped expo-location');
  
  // Handle default exports
  if (originalModule && originalModule.default) {
    wrappedModule.default = resolver.resolve('expo-location', originalModule.default);
  }
  
  // Handle named exports
  if (originalModule) {
    Object.keys(originalModule).forEach(key => {
      if (key !== 'default' && typeof originalModule[key] === 'object') {
        wrappedModule[key] = resolver.resolve('expo-location.' + key, originalModule[key]);
      } else if (key !== 'default') {
        wrappedModule[key] = originalModule[key];
      }
    });
  }
  
} catch (error) {
  console.warn('[Runtime Wrapper] Failed to load expo-location:', error.message);
  
  // Create safe fallback
  wrappedModule = resolver.resolve('expo-location', {});
}

module.exports = wrappedModule;
