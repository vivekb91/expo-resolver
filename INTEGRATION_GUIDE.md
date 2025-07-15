# Runtime Resolver Integration Guide

## 🚀 **Step-by-Step Integration for Existing Apps**

### **Step 1: Copy Runtime Resolver**

```bash
# Copy the runtime resolver to your project root
cp -r /path/to/runtime-resolver ./runtime-resolver
```

### **Step 2: Update Metro Configuration**

Create or update your `metro.config.js`:

```javascript
/**
 * Metro Configuration with Runtime Resolver Integration
 */
const { getDefaultConfig } = require('expo/metro-config'); // or '@react-native/metro-config'
const fs = require('fs');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 👇 ADD YOUR PROBLEMATIC MODULES HERE
const AUTO_WRAP_MODULES = [
  'expo-camera',
  'expo-location',
  'expo-haptics',
  '@react-native-async-storage/async-storage',
  'react-native-device-info',
  'react-native-share',
  '@react-native-clipboard/clipboard',
  'expo-brightness',
  'expo-screen-orientation',
  'expo-notifications',
  'expo-sensors',
  'react-native-image-picker',
  'react-native-contacts',
  'react-native-permissions',
  'react-native-geolocation-service',
  'react-native-maps',
  'react-native-bluetooth-serial',
  'react-native-nfc-manager',
  // Add more modules that crash on web
];

// Create wrapper files at startup
const wrapperDir = path.join(__dirname, 'runtime-wrappers');
if (!fs.existsSync(wrapperDir)) {
  fs.mkdirSync(wrapperDir, { recursive: true });
}

// Pre-create wrapper files for each module
AUTO_WRAP_MODULES.forEach(moduleName => {
  const safeName = moduleName.replace(/[^a-zA-Z0-9]/g, '_');
  const wrapperPath = path.join(wrapperDir, `${safeName}.js`);
  
  const wrapperContent = `
// Auto-generated runtime wrapper for ${moduleName}
const { createRuntimeResolver } = require('../runtime-resolver/src/index');

console.log('[Runtime Wrapper] Loading wrapper for ${moduleName}');

const resolver = createRuntimeResolver({
  logging: true,
  logLevel: 'warn',
  fallbackStrategy: 'graceful'
});

let wrappedModule = {};

try {
  const originalModule = require('${moduleName}');
  wrappedModule = resolver.resolve('${moduleName}', originalModule);
  
  console.log('[Runtime Wrapper] Successfully wrapped ${moduleName}');
  
  if (originalModule && originalModule.default) {
    wrappedModule.default = resolver.resolve('${moduleName}', originalModule.default);
  }
  
  if (originalModule) {
    Object.keys(originalModule).forEach(key => {
      if (key !== 'default' && typeof originalModule[key] === 'object') {
        wrappedModule[key] = resolver.resolve('${moduleName}.' + key, originalModule[key]);
      } else if (key !== 'default') {
        wrappedModule[key] = originalModule[key];
      }
    });
  }
  
} catch (error) {
  console.warn('[Runtime Wrapper] Failed to load ${moduleName}:', error.message);
  wrappedModule = resolver.resolve('${moduleName}', {});
}

module.exports = wrappedModule;
`;
  
  fs.writeFileSync(wrapperPath, wrapperContent, 'utf8');
});

// Store original resolver
const originalResolver = config.resolver?.resolveRequest;

// Custom resolver that redirects to wrappers on web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  try {
    const resolution = originalResolver 
      ? originalResolver(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform);
    
    // Check if this is a web platform and module needs wrapping
    const isWebPlatform = platform === 'web' || platform === 'dom';
    const needsWrapping = isWebPlatform && AUTO_WRAP_MODULES.includes(moduleName);
    
    if (needsWrapping) {
      console.log(`[Metro Config] Wrapping ${moduleName} for ${platform}`);
      
      const safeName = moduleName.replace(/[^a-zA-Z0-9]/g, '_');
      const wrapperPath = path.join(wrapperDir, `${safeName}.js`);
      
      return {
        ...resolution,
        filePath: wrapperPath
      };
    }
    
    return resolution;
  } catch (error) {
    console.error(`[Metro Config] Error resolving ${moduleName}:`, error.message);
    return originalResolver 
      ? originalResolver(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform);
  }
};

// Add wrapper directory to watched folders
config.watchFolders = [
  ...config.watchFolders,
  wrapperDir,
  path.resolve(__dirname, 'runtime-resolver')
];

module.exports = config;
```

### **Step 3: No Code Changes Required!**

Your existing React Native code works as-is:

```javascript
// Your existing code - NO CHANGES NEEDED!
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MyComponent = () => {
  const handleCameraPress = async () => {
    // This will work on mobile and gracefully fallback on web
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === 'granted') {
      // Take photo
    }
  };

  const handleLocationPress = async () => {
    // This will work on mobile and use browser geolocation on web
    const location = await Location.getCurrentPositionAsync();
    console.log(location);
  };

  return (
    // Your existing JSX
  );
};
```

### **Step 4: Test Your App**

```bash
# Test on mobile (should work normally)
npm run ios
npm run android

# Test on web (should work with fallbacks)
npm run web
```

## 🎯 **What You'll See**

### **Mobile (iOS/Android)**
- ✅ Everything works exactly as before
- ✅ All native features function normally
- ✅ No performance impact

### **Web**
- ✅ App loads without crashing
- ✅ Console shows fallback messages:
  ```
  [Metro Config] Wrapping expo-camera for web
  [Runtime Wrapper] Loading wrapper for expo-camera
  [Runtime Wrapper] Successfully wrapped expo-camera
  ```
- ✅ Native modules provide graceful fallbacks

## 🔧 **Customization Options**

### **Add More Modules**
Just add them to the `AUTO_WRAP_MODULES` array:

```javascript
const AUTO_WRAP_MODULES = [
  'expo-camera',
  'your-custom-native-module',  // 👈 Add here
  'another-problematic-module', // 👈 Add here
];
```

### **Configure Fallback Behavior**
Modify the resolver configuration:

```javascript
const resolver = createRuntimeResolver({
  logging: true,
  logLevel: 'warn',        // 'debug', 'info', 'warn', 'error'
  fallbackStrategy: 'graceful'  // 'graceful', 'silent', 'throw'
});
```

### **Custom Fallbacks**
Add specific fallbacks in `runtime-resolver/src/fallback-manager.js`:

```javascript
// Custom fallback for your specific module
'your-custom-module': {
  someMethod: () => {
    console.log('Custom fallback for someMethod');
    return { success: false, reason: 'not-supported-on-web' };
  }
}
```

## 📋 **Requirements**

- React Native 0.60+
- Expo SDK 40+ (if using Expo)
- Metro bundler
- Node.js 14+

## 🚨 **Important Notes**

1. **No Code Changes**: Your existing React Native code remains unchanged
2. **Mobile Unaffected**: Mobile apps work exactly as before
3. **Web Safe**: Web apps won't crash on native module calls
4. **Development Only**: Add modules to the list as you encounter web crashes
5. **Testing**: Test both mobile and web platforms after integration

## 🔍 **Troubleshooting**

### **Module Not Wrapping**
- Check that the module name is exactly in `AUTO_WRAP_MODULES`
- Verify the module is actually being imported in your code
- Check Metro logs for wrapping messages

### **Still Crashing on Web**
- Add the problematic module to `AUTO_WRAP_MODULES`
- Check if the module has dependencies that also need wrapping
- Verify the runtime resolver is properly copied to your project

### **Performance Issues**
- Only modules in `AUTO_WRAP_MODULES` are wrapped
- Mobile performance is unaffected
- Web performance impact is minimal

## 🎉 **Success!**

After integration, your app will:
- ✅ Work on mobile exactly as before
- ✅ Run on web without native module crashes
- ✅ Provide graceful fallbacks for unsupported features
- ✅ Maintain a single codebase for all platforms