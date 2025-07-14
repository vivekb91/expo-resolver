const fs = require('fs');
const path = require('path');

// Libraries that explicitly support web
const WEB_COMPATIBLE_LIBRARIES = new Set([
  'react-navigation',
  '@react-navigation/native',
  '@react-navigation/stack',
  '@react-navigation/bottom-tabs',
  '@react-navigation/drawer',
  'react-native-paper',
  'react-native-elements',
  'react-native-vector-icons',
  'react-native-svg',
  'react-native-reanimated',
  'react-native-gesture-handler',
  'react-native-linear-gradient',
  'react-native-webview',
  'react-native-modal',
  'react-native-super-grid',
  'react-native-tab-view',
  'react-native-pager-view',
  'react-native-safe-area-context',
  'react-native-screens',
  'react-hook-form',
  '@hookform/resolvers',
  'react-native-web',
  'expo-web',
  '@expo/web',
]);

// Truly native-only patterns (hardware/platform specific)
const NATIVE_ONLY_PATTERNS = [
  // Hardware access
  /camera/i,
  /biometric/i,
  /fingerprint/i,
  /face-id/i,
  /touch-id/i,
  /bluetooth/i,
  /nfc/i,
  /sensor/i,
  /haptic/i,
  /vibrat/i,
  
  // Platform-specific APIs
  /background-job/i,
  /push-notification/i,
  /contacts/i,
  /calendar/i,
  /keychain/i,
  /secure-store/i,
  /file-system/i,
  /document-picker/i,
  /image-picker/i,
  /image-crop/i,
  /media-library/i,
  /photo/i,
  /video/i,
  /sound/i,
  /audio/i,
  /speech/i,
  /voice/i,
  /ml-kit/i,
  /vision/i,
  /face-detection/i,
  /text-recognition/i,
  /barcode/i,
  /qrcode/i,
  
  // Device info
  /device-info/i,
  /device-id/i,
  /unique-id/i,
  /battery/i,
  /network-info/i,
  /cellular/i,
  /wifi/i,
  
  // Platform services
  /share/i,
  /intent/i,
  /app-state/i,
  /permissions/i,
  /location/i,
  /geolocation/i,
  /maps/i,
  /navigation/i,
  /orientation/i,
  /status-bar/i,
  /splash-screen/i,
  
  // Storage (may need web alternatives)
  /async-storage/i,
  /sqlite/i,
  /realm/i,
  /mmkv/i,
];

// Check if a module name suggests native-only functionality
function hasNativeOnlyPatterns(moduleName) {
  return NATIVE_ONLY_PATTERNS.some(pattern => pattern.test(moduleName));
}

// Check package.json for platform support
function checkPackageJsonPlatformSupport(moduleName, context) {
  try {
    const packagePath = require.resolve(`${moduleName}/package.json`, {
      paths: [context.projectRoot, process.cwd()]
    });
    
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check for explicit web support indicators
    if (packageJson.keywords && packageJson.keywords.includes('web')) {
      return 'web-supported';
    }
    
    if (packageJson.keywords && packageJson.keywords.includes('react-native-web')) {
      return 'web-supported';
    }
    
    // Check for web-specific builds
    if (packageJson.browser || packageJson['react-native-web']) {
      return 'web-supported';
    }
    
    // Check for platform-specific files
    if (packageJson.files) {
      const hasWebFiles = packageJson.files.some(file => 
        file.includes('.web.') || file.includes('/web/') || file.includes('browser')
      );
      if (hasWebFiles) {
        return 'web-supported';
      }
    }
    
    // Check for native-only indicators
    if (packageJson.keywords && packageJson.keywords.includes('native-only')) {
      return 'native-only';
    }
    
    if (packageJson.peerDependencies && packageJson.peerDependencies['react-native'] && 
        !packageJson.peerDependencies['react-native-web']) {
      return 'likely-native-only';
    }
    
    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

// Check if module has web-specific file extensions
function hasWebSpecificFiles(moduleName, context) {
  try {
    const modulePath = require.resolve(moduleName, {
      paths: [context.projectRoot, process.cwd()]
    });
    
    const moduleDir = path.dirname(modulePath);
    const files = fs.readdirSync(moduleDir);
    
    return files.some(file => 
      file.includes('.web.') || 
      file.includes('.browser.') ||
      file.includes('.dom.')
    );
  } catch (error) {
    return false;
  }
}

// Improved native module detection
function isTrulyNativeModule(moduleName, context = {}) {
  // First check if it's explicitly web-compatible
  if (WEB_COMPATIBLE_LIBRARIES.has(moduleName)) {
    return false;
  }
  
  // Check for obvious web-compatible patterns
  if (/^react-native-web/i.test(moduleName)) {
    return false;
  }
  
  if (/^expo-web/i.test(moduleName)) {
    return false;
  }
  
  // Check for generic react/web libraries (not react-native specific)
  if (!moduleName.includes('react-native') && !moduleName.includes('expo')) {
    return false;
  }
  
  // Check package.json for platform support
  const platformSupport = checkPackageJsonPlatformSupport(moduleName, context);
  if (platformSupport === 'web-supported') {
    return false;
  }
  
  if (platformSupport === 'native-only') {
    return true;
  }
  
  // Check for web-specific files
  if (hasWebSpecificFiles(moduleName, context)) {
    return false;
  }
  
  // Check for native-only patterns in name
  if (hasNativeOnlyPatterns(moduleName)) {
    return true;
  }
  
  // Default fallback: if it's react-native-* or expo-*, be conservative
  if (/^react-native-/.test(moduleName) || /^expo-/.test(moduleName)) {
    return true;
  }
  
  return false;
}

// Get confidence level for native detection
function getNativeDetectionConfidence(moduleName, context = {}) {
  if (WEB_COMPATIBLE_LIBRARIES.has(moduleName)) {
    return { isNative: false, confidence: 'high', reason: 'explicitly web-compatible' };
  }
  
  const platformSupport = checkPackageJsonPlatformSupport(moduleName, context);
  if (platformSupport === 'web-supported') {
    return { isNative: false, confidence: 'high', reason: 'package.json indicates web support' };
  }
  
  if (platformSupport === 'native-only') {
    return { isNative: true, confidence: 'high', reason: 'package.json indicates native-only' };
  }
  
  if (hasNativeOnlyPatterns(moduleName)) {
    return { isNative: true, confidence: 'medium', reason: 'module name suggests native-only functionality' };
  }
  
  if (hasWebSpecificFiles(moduleName, context)) {
    return { isNative: false, confidence: 'medium', reason: 'web-specific files found' };
  }
  
  if (/^react-native-/.test(moduleName) || /^expo-/.test(moduleName)) {
    return { isNative: true, confidence: 'low', reason: 'react-native/expo prefix (conservative)' };
  }
  
  return { isNative: false, confidence: 'low', reason: 'no native indicators found' };
}

module.exports = {
  isTrulyNativeModule,
  getNativeDetectionConfidence,
  WEB_COMPATIBLE_LIBRARIES,
  NATIVE_ONLY_PATTERNS
};