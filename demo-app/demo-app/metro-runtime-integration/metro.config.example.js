/**
 * Example Metro Configuration with Simple Auto-Wrapper
 * 
 * Use this configuration to automatically wrap native modules
 * without any code changes in your React Native app.
 */

const { getDefaultConfig } = require('expo/metro-config');
const { applyAutoWrapperPlugin } = require('./simple-auto-wrapper');

const config = getDefaultConfig(__dirname);

// Apply auto-wrapper plugin
module.exports = applyAutoWrapperPlugin(config, {
  // List of modules to auto-wrap on web
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
    
    // You can also use RegExp patterns
    // /^react-native-(?!web)/,  // All react-native-* except react-native-web
    // /^expo-(?!web)/,          // All expo-* except expo-web
    // /^@react-native-/,        // All @react-native-*
  ],
  
  // Platforms to apply wrapping (only web)
  platforms: ['web', 'dom'],
  
  // Runtime resolver configuration
  resolverConfig: {
    logging: true,
    logLevel: 'warn',
    fallbackStrategy: 'graceful',
    
    // Custom fallbacks for specific modules (optional)
    modules: {
      'react-native-camera': {
        fallback: {
          'takePicture': function(error, args) {
            console.warn('Camera not available on web');
            return Promise.reject(new Error('Camera not supported on web'));
          }
        }
      },
      
      'expo-location': {
        fallback: {
          'getCurrentPositionAsync': function(error, args) {
            if (navigator.geolocation) {
              return new Promise(function(resolve, reject) {
                navigator.geolocation.getCurrentPosition(
                  function(position) {
                    resolve({
                      coords: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy || 0
                      }
                    });
                  },
                  function(error) {
                    reject(error);
                  }
                );
              });
            }
            return Promise.reject(new Error('Geolocation not supported'));
          }
        }
      }
    }
  }
});