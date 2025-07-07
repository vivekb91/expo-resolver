const MOBILE_PATTERNS = [
  /^react-native-(?!web)/,      // react-native-* (except react-native-web)
  /^expo-(?!web)/,              // expo-* (except expo-web)
  /^@react-native-/,            // @react-native-*
  /^@expo\/(?!web)/,            // @expo/* (except @expo/web)
  /native-base/,                // native-base components
  /react-navigation/,           // react-navigation
  /^@react-navigation\//,       // @react-navigation/*
  /^react-native$/,             // react-native core (when used directly)
  /^@react-native-community\//, // @react-native-community/*
  /^react-native-reanimated/,   // react-native-reanimated
  /^react-native-gesture-handler/, // react-native-gesture-handler
  /^react-native-svg/,          // react-native-svg
  /^react-native-vector-icons/, // react-native-vector-icons
  /^react-native-maps/,         // react-native-maps
  /^react-native-camera/,       // react-native-camera
  /^react-native-image-picker/, // react-native-image-picker
  /^react-native-permissions/,  // react-native-permissions
  /^react-native-share/,        // react-native-share
  /^react-native-device-info/,  // react-native-device-info
  /^react-native-keychain/,     // react-native-keychain
  /^react-native-biometrics/,   // react-native-biometrics
  /^react-native-sensors/,      // react-native-sensors
  /^react-native-bluetooth/,    // react-native-bluetooth
  /^react-native-nfc/,          // react-native-nfc
  /^react-native-haptic/,       // react-native-haptic-feedback
  /^react-native-sound/,        // react-native-sound
  /^react-native-video/,        // react-native-video
  /^react-native-webview/,      // react-native-webview
  /^react-native-sqlite/,       // react-native-sqlite
  /^react-native-fs/,           // react-native-fs
  /^react-native-contacts/,     // react-native-contacts
  /^react-native-calendar/,     // react-native-calendar
  /^react-native-push-notification/, // react-native-push-notification
  /^react-native-linear-gradient/,   // react-native-linear-gradient
  /^react-native-background/,   // react-native-background-*
  /^react-native-geolocation/,  // react-native-geolocation
  /^react-native-orientation/,  // react-native-orientation
  /^react-native-splash-screen/, // react-native-splash-screen
  /^react-native-status-bar/,   // react-native-status-bar
  /^react-native-picker/,       // react-native-picker
  /^react-native-modal/,        // react-native-modal
  /^react-native-actionsheet/,  // react-native-actionsheet
  /^react-native-swiper/,       // react-native-swiper
  /^react-native-tab-view/,     // react-native-tab-view
  /^react-native-paper/,        // react-native-paper (has web support but may need mapping)
  /^react-native-elements/,     // react-native-elements
  /^react-native-ui-lib/,       // react-native-ui-lib
  /^react-native-super-grid/,   // react-native-super-grid
  /^react-native-fast-image/,   // react-native-fast-image
  /^react-native-image-crop-picker/, // react-native-image-crop-picker
  /^react-native-document-picker/,   // react-native-document-picker
  /^react-native-file-picker/,  // react-native-file-picker
  /^react-native-qrcode/,       // react-native-qrcode
  /^react-native-barcode/,      // react-native-barcode
  /^react-native-vision-camera/, // react-native-vision-camera
  /^react-native-ml-kit/,       // react-native-ml-kit
  /^react-native-face-detection/, // react-native-face-detection
  /^react-native-text-recognition/, // react-native-text-recognition
];

const WEB_COMPATIBLE_PATTERNS = [
  /^react-native-web/,          // react-native-web
  /^expo-web/,                  // expo-web
  /^@expo\/web/,                // @expo/web
  /^react-native-web-/,         // react-native-web-*
];

function isMobileSpecificModule(moduleName) {
  // First check if it's explicitly web-compatible
  if (WEB_COMPATIBLE_PATTERNS.some(pattern => pattern.test(moduleName))) {
    return false;
  }

  // Then check if it matches mobile-specific patterns
  return MOBILE_PATTERNS.some(pattern => pattern.test(moduleName));
}

function getMobilePackageCategory(moduleName) {
  if (/^expo-/.test(moduleName)) return 'expo';
  if (/^@expo\//.test(moduleName)) return 'expo';
  if (/^react-native-/.test(moduleName)) return 'react-native';
  if (/^@react-native-/.test(moduleName)) return 'react-native';
  if (/^@react-native-community\//.test(moduleName)) return 'react-native-community';
  if (/^@react-navigation\//.test(moduleName)) return 'react-navigation';
  return 'third-party';
}

function isNativeModuleImport(moduleName) {
  const nativeModulePatterns = [
    /NativeModules/,
    /NativeEventEmitter/,
    /requireNativeComponent/,
    /TurboModule/,
    /JSI/,
    /Fabric/,
    /CodePush/,
    /react-native\/Libraries/,
  ];
  
  return nativeModulePatterns.some(pattern => pattern.test(moduleName));
}

module.exports = {
  isMobileSpecificModule,
  getMobilePackageCategory,
  isNativeModuleImport,
  MOBILE_PATTERNS,
  WEB_COMPATIBLE_PATTERNS
};