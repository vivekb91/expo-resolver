/**
 * Web fallback for react-native/Libraries/Utilities/codegenNativeCommands
 * This module is used by react-native-maps and other native modules
 */

export default function codegenNativeCommands(config) {
  return function(nativeRef) {
    // Return empty object with no-op functions for any commands
    return new Proxy({}, {
      get: (target, commandName) => {
        return function(...args) {
          if (__DEV__) {
            console.warn(`[Web Fallback] Native command '${commandName}' called - no-op on web`);
          }
          return null;
        };
      }
    });
  };
}

// Also export as CommonJS for compatibility
module.exports = codegenNativeCommands;
module.exports.default = codegenNativeCommands;