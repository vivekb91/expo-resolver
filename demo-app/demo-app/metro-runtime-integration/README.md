# Metro Runtime Integration

This directory contains Metro configurations and plugins that automatically apply runtime resolver wrapping **without requiring any code changes** in your React Native app.

## 🎯 Zero Code Changes Required

All the runtime resolver functionality is applied automatically through Metro configuration. Your existing code remains unchanged.

## 🔧 Setup Options

### Option 1: Simple Metro Config (Recommended)

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { applyAutoWrapperPlugin } = require('./metro-runtime-integration/auto-wrapper-plugin');

const config = getDefaultConfig(__dirname);

// Apply auto-wrapper plugin
module.exports = applyAutoWrapperPlugin(config, {
  modules: [
    'react-native-camera',
    'expo-camera',
    'expo-location',
    'expo-haptics',
    'react-native-device-info',
    'react-native-share',
    '@react-native-clipboard/clipboard',
    '@react-native-async-storage/async-storage',
    // Add your problematic modules here
  ],
  
  platforms: ['web', 'dom'],
  
  resolverConfig: {
    logging: true,
    logLevel: 'warn',
    fallbackStrategy: 'graceful'
  }
});
```

### Option 2: Advanced Metro Config

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { createMetroAutoWrapperPlugin } = require('./metro-runtime-integration/auto-wrapper-plugin');

const config = getDefaultConfig(__dirname);

// Create plugin instance
const autoWrapperPlugin = createMetroAutoWrapperPlugin({
  modules: [
    'react-native-camera',
    'expo-camera',
    'expo-location',
    'expo-haptics',
    'react-native-device-info',
    'react-native-share',
    '@react-native-clipboard/clipboard',
    '@react-native-async-storage/async-storage',
    'expo-file-system',
    'expo-notifications',
    'react-native-geolocation-service',
    'react-native-contacts',
    'react-native-permissions',
    'expo-sensors',
    'expo-barcode-scanner',
    'react-native-image-picker',
    'react-native-document-picker',
    'expo-media-library',
    'expo-av',
    'react-native-maps',
    'react-native-bluetooth-serial',
    'react-native-nfc-manager',
  ],
  
  platforms: ['web', 'dom'],
  
  resolverConfig: {
    logging: true,
    logLevel: 'warn',
    fallbackStrategy: 'graceful',
    
    // Custom module-specific configuration
    modules: {
      'react-native-camera': {
        fallback: {
          'takePicture': (error, args) => {
            console.warn('Camera not available on web');
            return Promise.reject(new Error('Camera not supported on web'));
          }
        }
      },
      
      'expo-location': {
        fallback: {
          'getCurrentPositionAsync': async (error, args) => {
            if (navigator.geolocation) {
              return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                  position => resolve({
                    coords: {
                      latitude: position.coords.latitude,
                      longitude: position.coords.longitude,
                      accuracy: position.coords.accuracy
                    }
                  }),
                  error => reject(error)
                );
              });
            }
            throw new Error('Geolocation not supported');
          }
        }
      }
    }
  }
});

// Apply plugin to config
module.exports = autoWrapperPlugin.createMetroConfig(config);
```

### Option 3: Pattern-Based Module Matching

```javascript
// metro.config.js
const { applyAutoWrapperPlugin } = require('./metro-runtime-integration/auto-wrapper-plugin');

module.exports = applyAutoWrapperPlugin(config, {
  modules: [
    // Exact module names
    'react-native-camera',
    'expo-camera',
    
    // Regular expressions for pattern matching
    /^react-native-(?!web)/,  // All react-native-* except react-native-web
    /^expo-(?!web)/,          // All expo-* except expo-web
    /^@react-native-/,        // All @react-native-*
  ],
  
  platforms: ['web', 'dom']
});
```

## 🚀 How It Works

1. **Metro Resolution**: Intercepts module resolution during bundling
2. **Auto-Detection**: Automatically detects native modules that need wrapping
3. **Wrapper Generation**: Creates runtime wrapper files on-the-fly
4. **Cache Management**: Efficiently caches wrappers to avoid regeneration
5. **Zero Impact**: Only affects web builds, native builds unchanged

## 📁 Generated Files

The plugin automatically creates wrapper files in `.metro-cache/runtime-wrappers/`:

```
.metro-cache/
└── runtime-wrappers/
    ├── a1b2c3d4.js  # Wrapper for react-native-camera
    ├── e5f6g7h8.js  # Wrapper for expo-location
    └── ...
```

These files are automatically managed - you don't need to touch them.

## 🔍 What Gets Wrapped

Example of what the plugin generates for `react-native-camera`:

```javascript
// Auto-generated wrapper
const { createRuntimeResolver } = require('react-native-web-runtime-resolver');

const resolver = createRuntimeResolver({
  logging: true,
  logLevel: 'warn',
  fallbackStrategy: 'graceful'
});

const originalModule = require('react-native-camera');
const wrappedModule = resolver.resolve('react-native-camera', originalModule);

module.exports = wrappedModule;
```

## 🎛️ Configuration Options

### Plugin Options

```javascript
{
  // Modules to auto-wrap
  modules: [
    'react-native-camera',        // Exact string match
    /^react-native-(?!web)/,      // RegExp pattern
  ],
  
  // Platforms to apply wrapping
  platforms: ['web', 'dom'],
  
  // Runtime resolver configuration
  resolverConfig: {
    logging: true,
    logLevel: 'warn',
    fallbackStrategy: 'graceful',
    
    // Per-module configuration
    modules: {
      'react-native-camera': {
        fallback: { /* custom fallbacks */ }
      }
    }
  },
  
  // Cache directory (optional)
  cacheDir: '.metro-cache/runtime-wrappers'
}
```

### Resolver Configuration

```javascript
resolverConfig: {
  // Global settings
  platform: 'auto',           // 'auto', 'web', 'native'
  fallbackStrategy: 'graceful', // 'graceful', 'throw', 'silent'
  logging: true,
  logLevel: 'warn',           // 'debug', 'info', 'warn', 'error'
  
  // Default fallback behavior
  fallbacks: {
    returnValue: null,
    throwError: false,
    logMessage: true
  },
  
  // Module-specific configurations
  modules: {
    'module-name': {
      fallback: {
        'methodName': (error, args, methodName) => {
          // Custom fallback logic
        }
      }
    }
  }
}
```

## 📊 Debugging

### Enable Debug Logging

```javascript
resolverConfig: {
  logging: true,
  logLevel: 'debug'  // See all resolution activity
}
```

### Check Wrapper Generation

```bash
# See generated wrappers
ls -la .metro-cache/runtime-wrappers/

# View a specific wrapper
cat .metro-cache/runtime-wrappers/a1b2c3d4.js
```

### Runtime Debugging

```javascript
// In your app (web only)
console.log('Wrapped modules:', Object.keys(require.cache).filter(
  key => key.includes('runtime-wrappers')
));
```

## 🧹 Cache Management

```javascript
// Clean cache programmatically
const { createMetroAutoWrapperPlugin } = require('./auto-wrapper-plugin');

const plugin = createMetroAutoWrapperPlugin();
plugin.cleanCache();
```

```bash
# Clean cache manually
rm -rf .metro-cache/runtime-wrappers/
```

## 🔄 Integration with Existing Metro Config

The plugin works with any existing Metro configuration:

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { applyAutoWrapperPlugin } = require('./metro-runtime-integration/auto-wrapper-plugin');

let config = getDefaultConfig(__dirname);

// Apply your existing customizations
config.resolver.alias = {
  'react-native-vector-icons': 'react-native-vector-icons/dist'
};

config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

// Apply auto-wrapper plugin LAST
config = applyAutoWrapperPlugin(config, {
  modules: ['react-native-camera', 'expo-location']
});

module.exports = config;
```

## 🎯 Benefits

1. **Zero Code Changes**: No modifications to your React Native code
2. **Automatic**: Detects and wraps modules automatically
3. **Efficient**: Caches wrappers for fast rebuilds
4. **Configurable**: Highly customizable per module
5. **Safe**: Only affects web builds, native unchanged
6. **Maintainable**: Centralized configuration in Metro config

## 🚨 Important Notes

- Generated wrappers are cached for performance
- Only affects web platform builds
- Native builds remain completely unchanged
- Add `.metro-cache/` to your `.gitignore`
- Clean cache if you encounter issues

## 🔧 Troubleshooting

### Module Not Being Wrapped

1. Check if module name is in the `modules` array
2. Verify platform is 'web' or 'dom'
3. Enable debug logging to see resolution activity

### Cache Issues

1. Clean the cache: `rm -rf .metro-cache/runtime-wrappers/`
2. Restart Metro bundler
3. Check if original module files have been modified

### Performance Issues

1. Use specific module names instead of broad RegExp patterns
2. Limit the number of modules in the auto-wrap list
3. Consider using the built-in Metro resolver for build-time resolution