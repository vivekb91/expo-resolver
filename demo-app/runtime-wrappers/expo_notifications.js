
// Auto-generated runtime wrapper for expo-notifications
const { createRuntimeResolver } = require('../runtime-resolver/src/index');

console.log('[Runtime Wrapper] Loading wrapper for expo-notifications');

const resolver = createRuntimeResolver({
  logging: true,
  logLevel: 'warn',
  fallbackStrategy: 'graceful'
});

let wrappedModule = {};

try {
  // Try to require the original module
  const originalModule = require('expo-notifications');
  
  // Wrap it with runtime resolver
  wrappedModule = resolver.resolve('expo-notifications', originalModule);
  
  console.log('[Runtime Wrapper] Successfully wrapped expo-notifications');
  
  // Handle default exports
  if (originalModule && originalModule.default) {
    wrappedModule.default = resolver.resolve('expo-notifications', originalModule.default);
  }
  
  // Handle named exports
  if (originalModule) {
    Object.keys(originalModule).forEach(key => {
      if (key !== 'default' && typeof originalModule[key] === 'object') {
        wrappedModule[key] = resolver.resolve('expo-notifications.' + key, originalModule[key]);
      } else if (key !== 'default') {
        wrappedModule[key] = originalModule[key];
      }
    });
  }
  
} catch (error) {
  console.warn('[Runtime Wrapper] Failed to load expo-notifications:', error.message);
  
  // Create safe fallback
  wrappedModule = resolver.resolve('expo-notifications', {});
}

module.exports = wrappedModule;
