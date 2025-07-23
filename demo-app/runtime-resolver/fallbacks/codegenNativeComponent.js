/**
 * Web fallback for react-native/Libraries/Utilities/codegenNativeComponent
 * This module is used by react-native-maps and other native modules
 */

export default function codegenNativeComponent(componentName, componentInterface) {
  if (__DEV__) {
    console.warn(`[Web Fallback] Native component '${componentName}' not available on web`);
  }
  
  // Return a basic React component fallback
  return function NativeComponentFallback(props = {}) {
    // For web builds, create a div placeholder
    if (typeof React !== 'undefined' && React.createElement) {
      return React.createElement('div', {
        'data-native-component': componentName,
        style: { display: 'none' }, // Hide native components on web
        ...props
      }, props.children);
    }
    
    // Fallback if React isn't available
    return null;
  };
}

// Also export as CommonJS for compatibility
module.exports = codegenNativeComponent;
module.exports.default = codegenNativeComponent;