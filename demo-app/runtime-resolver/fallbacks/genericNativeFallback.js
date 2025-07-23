/**
 * Generic fallback for unknown React Native internal modules
 * This handles any other native-only modules that might be imported
 */

// Default export
export default {};

// Named exports that might be commonly expected
export const NativeModules = {};
export const UIManager = {
  measureInWindow: () => {},
  measure: () => {},
  dispatchViewManagerCommand: () => {}
};

export const Platform = {
  OS: 'web',
  Version: '1.0.0'
};

// Function that returns empty object for any other imports
export function createGenericFallback() {
  return new Proxy({}, {
    get: (target, prop) => {
      if (__DEV__) {
        console.warn(`[Web Fallback] Accessing '${prop}' on generic native fallback`);
      }
      return () => null;
    }
  });
}

// CommonJS compatibility
module.exports = {};
module.exports.default = {};
module.exports.NativeModules = {};
module.exports.UIManager = UIManager;
module.exports.Platform = Platform;
module.exports.createGenericFallback = createGenericFallback;