# Metro Configuration for Native Module Resolution

## Problem Solved

This configuration fixes build-time errors like:
```
Error: Importing native-only module "react-native/Libraries/Utilities/codegenNativeCommands" on web
```

## Quick Setup

Add this to your `metro.config.js`:

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Native module aliases for web builds
const NATIVE_MODULE_ALIASES = {
  'react-native/Libraries/Utilities/codegenNativeCommands': path.join(__dirname, 'runtime-resolver/fallbacks/codegenNativeCommands.js'),
  'react-native/Libraries/Utilities/codegenNativeComponent': path.join(__dirname, 'runtime-resolver/fallbacks/codegenNativeComponent.js'),
  'react-native/Libraries/TurboModule/TurboModuleRegistry': path.join(__dirname, 'runtime-resolver/fallbacks/genericNativeFallback.js'),
  'react-native/Libraries/EventEmitter/NativeEventEmitter': path.join(__dirname, 'runtime-resolver/fallbacks/genericNativeFallback.js'),
  'react-native/Libraries/ReactNative/UIManager': path.join(__dirname, 'runtime-resolver/fallbacks/genericNativeFallback.js'),
  'react-native/Libraries/BatchedBridge/NativeModules': path.join(__dirname, 'runtime-resolver/fallbacks/genericNativeFallback.js'),
};

// Store original resolver
const originalResolver = config.resolver?.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  try {
    // Handle native-only modules for web platform
    const isWebPlatform = platform === 'web' || platform === 'dom';
    if (isWebPlatform && NATIVE_MODULE_ALIASES[moduleName]) {
      console.log(`[Metro Config] Aliasing native module ${moduleName} for web`);
      return {
        filePath: NATIVE_MODULE_ALIASES[moduleName],
        type: 'sourceFile'
      };
    }
    
    // Use default resolution for other cases
    return originalResolver 
      ? originalResolver(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform);
      
  } catch (error) {
    // If normal resolution fails and it's a React Native internal module on web, try generic fallback
    const isWebPlatform = platform === 'web' || platform === 'dom';
    const isRNInternal = moduleName.startsWith('react-native/Libraries/') || moduleName.includes('/react-native/Libraries/');
    
    if (isWebPlatform && isRNInternal) {
      console.warn(`[Metro Config] Using generic fallback for unknown RN internal module: ${moduleName}`);
      return {
        filePath: path.join(__dirname, 'runtime-resolver/fallbacks/genericNativeFallback.js'),
        type: 'sourceFile'
      };
    }
    
    throw error;
  }
};

module.exports = config;
```

## What This Does

1. **Build-time Resolution**: Intercepts imports during Metro bundling
2. **Web-only**: Only applies aliases when building for web platform
3. **Fallback Files**: Points native-only imports to safe fallback implementations
4. **Generic Catch-all**: Handles unknown React Native internal modules with a generic fallback

## Supported Native Modules

Currently handles these common native-only imports:
- `react-native/Libraries/Utilities/codegenNativeCommands` (used by react-native-maps)
- `react-native/Libraries/Utilities/codegenNativeComponent`
- `react-native/Libraries/TurboModule/TurboModuleRegistry`
- `react-native/Libraries/EventEmitter/NativeEventEmitter`
- `react-native/Libraries/ReactNative/UIManager`
- `react-native/Libraries/BatchedBridge/NativeModules`

## Adding New Native Modules

To handle additional native-only modules, add them to the `NATIVE_MODULE_ALIASES` object:

```javascript
const NATIVE_MODULE_ALIASES = {
  // ... existing aliases
  'react-native/Libraries/YourModule/YourNativeModule': path.join(__dirname, 'runtime-resolver/fallbacks/yourFallback.js'),
};
```

## Testing

After setup, your web builds should no longer fail with native module import errors. The fallback modules will provide no-op implementations that prevent crashes while maintaining compatibility.