# React Native Web Runtime Resolver

A powerful runtime resolver that provides graceful fallback handling for React Native modules when running on web platforms. Unlike build-time resolvers, this library works at runtime to intercept method calls and provide web-compatible alternatives.

## 🚀 Features

- **Runtime Interception**: Catches method calls that would fail on web
- **Graceful Fallbacks**: Provides web-compatible alternatives for native modules
- **Configurable**: Highly customizable with per-module and per-method settings
- **Zero Setup**: Works out of the box with built-in fallbacks for common modules
- **Intelligent Logging**: Detailed logging for debugging and monitoring
- **Platform Detection**: Automatic platform detection with manual override support

## 📋 Problem This Solves

When building React Native apps for web using react-native-web, you often encounter:

1. **Build Success, Runtime Failures**: Metro resolves modules successfully, but methods fail at runtime
2. **Missing Web APIs**: Native modules don't have web equivalents for certain methods
3. **Crash-Prone Code**: Apps crash when calling unsupported native methods
4. **Manual Fallbacks**: Having to write Platform.OS checks everywhere

This library solves these issues by providing automatic runtime fallbacks.

## 🛠 Installation

```bash
npm install react-native-web-runtime-resolver
# or
yarn add react-native-web-runtime-resolver
```

## 🎯 Basic Usage

### 1. Simple Module Wrapping

```javascript
import { createRuntimeResolver } from 'react-native-web-runtime-resolver';

// Create resolver instance
const resolver = createRuntimeResolver();

// Wrap your module imports
import CameraOriginal from 'react-native-camera';
const Camera = resolver.resolve('react-native-camera', CameraOriginal);

// Now use Camera safely - it will gracefully handle web platform
Camera.takePicture().catch(error => {
  console.log('Camera not available on web:', error.message);
});
```

### 2. Async Import Wrapping

```javascript
import { createRuntimeResolver } from 'react-native-web-runtime-resolver';

const resolver = createRuntimeResolver();

// Wrap async imports
const Camera = await resolver.wrapImport(
  'react-native-camera',
  () => import('react-native-camera')
);

// Use safely
Camera.takePicture(); // Won't crash on web
```

### 3. Global Resolver Setup

```javascript
// resolver-setup.js
import { createRuntimeResolver } from 'react-native-web-runtime-resolver';

const resolver = createRuntimeResolver({
  logging: true,
  logLevel: 'warn',
  fallbackStrategy: 'graceful'
});

export default resolver;
```

```javascript
// In your components
import resolver from './resolver-setup';
import AsyncStorageOriginal from '@react-native-async-storage/async-storage';

const AsyncStorage = resolver.resolve('async-storage', AsyncStorageOriginal);

// Use normally - graceful fallbacks on web
AsyncStorage.setItem('key', 'value');
```

## ⚙️ Configuration

### Basic Configuration

```javascript
import { createRuntimeResolver } from 'react-native-web-runtime-resolver';

const resolver = createRuntimeResolver({
  // Global settings
  platform: 'auto', // 'auto', 'web', 'native'
  fallbackStrategy: 'graceful', // 'graceful', 'throw', 'silent'
  logging: true,
  logLevel: 'warn', // 'debug', 'info', 'warn', 'error', 'silent'

  // Default fallback behavior
  fallbacks: {
    returnValue: null,
    throwError: false,
    logMessage: true
  }
});
```

### Module-Specific Configuration

```javascript
const resolver = createRuntimeResolver({
  modules: {
    'react-native-camera': {
      // Custom fallback for specific methods
      fallback: {
        'takePicture': (error, args, methodName) => {
          console.warn('Camera not available, using file input fallback');
          return Promise.reject(new Error('Camera not supported on web'));
        }
      },
      
      // Method-specific settings
      methods: {
        'takePicture': {
          returnValue: null,
          throwError: false
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
});
```

## 📦 Built-in Fallbacks

The library comes with built-in fallbacks for common React Native modules:

### Location Services
- `expo-location`: Uses browser geolocation API
- `react-native-geolocation-service`: Browser geolocation fallback

### Device Features
- `expo-haptics`: Uses vibration API when available
- `react-native-device-info`: Provides web-appropriate device info
- `expo-device`: Browser-based device detection

### Storage & Clipboard
- `@react-native-async-storage/async-storage`: Uses localStorage
- `@react-native-clipboard/clipboard`: Uses clipboard API

### Sharing & Camera
- `react-native-share`: Uses Web Share API or clipboard fallback
- `react-native-camera`: Graceful failure with error messages
- `expo-camera`: Same as above

### File System
- `expo-file-system`: Limited web filesystem support
- `react-native-fs`: Graceful degradation

## 🔧 Advanced Usage

### Custom Fallback Functions

```javascript
const resolver = createRuntimeResolver({
  modules: {
    'my-custom-module': {
      fallback: {
        'customMethod': (error, args, methodName) => {
          // Custom fallback logic
          const [param1, param2] = args;
          
          // Provide web-specific implementation
          if (typeof window !== 'undefined') {
            return webImplementation(param1, param2);
          }
          
          // Or return safe default
          return Promise.resolve(null);
        }
      }
    }
  }
});
```

### Platform-Specific Behavior

```javascript
const resolver = createRuntimeResolver({
  platform: 'auto', // Automatically detect platform
  
  modules: {
    'react-native-camera': {
      fallback: {
        'takePicture': (error, args, methodName) => {
          // Different behavior for different platforms
          if (resolver.platformDetector.isWeb()) {
            return handleWebCamera();
          } else {
            throw error; // Let native handle it
          }
        }
      }
    }
  }
});
```

### Runtime Configuration Updates

```javascript
// Update configuration at runtime
resolver.updateConfig({
  logging: false,
  modules: {
    'new-module': {
      fallback: {
        'newMethod': () => 'web-fallback'
      }
    }
  }
});
```

## 📊 Logging and Debugging

### Log Levels

```javascript
const resolver = createRuntimeResolver({
  logging: true,
  logLevel: 'debug' // See all resolver activity
});

// Will log:
// [RuntimeResolver] [DEBUG] Resolving module: react-native-camera
// [RuntimeResolver] [WARN] Method takePicture failed, using fallback
// [RuntimeResolver] [INFO] Platform detected: web
```

### Custom Logging

```javascript
import { createLogger } from 'react-native-web-runtime-resolver';

const customLogger = createLogger(true, 'info');
customLogger.info('Custom log message');
```

## 🔍 Platform Detection

```javascript
import { PlatformDetector } from 'react-native-web-runtime-resolver';

const detector = new PlatformDetector();

console.log(detector.isWeb()); // true/false
console.log(detector.getPlatform()); // 'web', 'ios', 'android', 'unknown'
console.log(detector.getEnvironmentInfo()); // Detailed environment info
```

## 🧪 Testing

```javascript
// In your tests
import { createRuntimeResolver } from 'react-native-web-runtime-resolver';

const resolver = createRuntimeResolver({
  platform: 'web', // Force web platform for testing
  logging: false // Disable logging in tests
});

// Test that web fallbacks work correctly
const Camera = resolver.resolve('react-native-camera', mockCameraModule);
await expect(Camera.takePicture()).rejects.toThrow('Camera not supported on web');
```

## 🎨 Integration with Existing Code

### Gradual Migration

```javascript
// Start with specific modules
import { createRuntimeResolver } from 'react-native-web-runtime-resolver';

const resolver = createRuntimeResolver();

// Only wrap problematic modules
import CameraOriginal from 'react-native-camera';
const Camera = resolver.resolve('react-native-camera', CameraOriginal);

// Keep other modules unchanged
import AsyncStorage from '@react-native-async-storage/async-storage';
```

### Webpack Integration

```javascript
// webpack.config.js
module.exports = {
  resolve: {
    alias: {
      'react-native-camera': 'react-native-web-runtime-resolver/runtime-camera-wrapper'
    }
  }
};
```

## 📈 Performance Considerations

- **Lazy Loading**: Fallbacks are created only when needed
- **Caching**: Resolved modules are cached for performance
- **Minimal Overhead**: Only affects web builds, no impact on native
- **Smart Detection**: Platform detection is cached after first call

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📚 [Documentation](https://github.com/runtime-resolver/docs)
- 🐛 [Issue Tracker](https://github.com/runtime-resolver/issues)
- 💬 [Discussions](https://github.com/runtime-resolver/discussions)

## 🏆 Comparison with Other Solutions

| Feature | Runtime Resolver | Metro Config | Platform.OS Checks |
|---------|------------------|--------------|-------------------|
| Zero config | ✅ | ❌ | ❌ |
| Runtime safety | ✅ | ❌ | ✅ |
| Automatic fallbacks | ✅ | ❌ | ❌ |
| Build-time resolution | ❌ | ✅ | ❌ |
| Granular control | ✅ | ✅ | ✅ |
| Learning curve | Low | High | Medium |

## 🌟 Why Choose Runtime Resolver?

1. **Complementary**: Works alongside your existing Metro config
2. **Gradual**: Adopt module by module as needed
3. **Flexible**: Highly configurable for any use case
4. **Reliable**: Prevents crashes with graceful fallbacks
5. **Maintainable**: Centralized configuration vs scattered Platform checks