
// Auto-generated runtime wrapper for @react-native-clipboard/clipboard
const { createRuntimeResolver } = require('../runtime-resolver/src/index');

console.log('[Runtime Wrapper] Loading wrapper for @react-native-clipboard/clipboard');

const resolver = createRuntimeResolver({
  logging: true,
  logLevel: 'warn',
  fallbackStrategy: 'graceful'
});

let wrappedModule = {};

try {
  // Try to require the original module
  const originalModule = require('@react-native-clipboard/clipboard');
  
  // Wrap it with runtime resolver
  wrappedModule = resolver.resolve('@react-native-clipboard/clipboard', originalModule);
  
  console.log('[Runtime Wrapper] Successfully wrapped @react-native-clipboard/clipboard');
  
  // Handle default exports
  if (originalModule && originalModule.default) {
    wrappedModule.default = resolver.resolve('@react-native-clipboard/clipboard', originalModule.default);
  }
  
  // Handle named exports
  if (originalModule) {
    Object.keys(originalModule).forEach(key => {
      if (key !== 'default' && typeof originalModule[key] === 'object') {
        wrappedModule[key] = resolver.resolve('@react-native-clipboard/clipboard.' + key, originalModule[key]);
      } else if (key !== 'default') {
        wrappedModule[key] = originalModule[key];
      }
    });
  }
  
} catch (error) {
  console.warn('[Runtime Wrapper] Failed to load @react-native-clipboard/clipboard:', error.message);
  
  // Create safe fallback
  wrappedModule = resolver.resolve('@react-native-clipboard/clipboard', {});
}

module.exports = wrappedModule;
