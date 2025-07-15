/**
 * Example Configuration for React Native Web Runtime Resolver
 * 
 * This file shows various configuration options and usage patterns
 * for the runtime resolver system.
 */

const runtimeResolverConfig = {
  // Global settings
  platform: 'auto', // 'auto', 'web', 'native' - platform detection
  fallbackStrategy: 'graceful', // 'graceful', 'throw', 'silent'
  logging: true, // Enable/disable logging
  logLevel: 'warn', // 'debug', 'info', 'warn', 'error', 'silent'

  // Global fallback behaviors
  fallbacks: {
    returnValue: null, // Default return value for failed methods
    throwError: false, // Whether to throw errors or return fallbacks
    logMessage: true // Whether to log fallback usage
  },

  // Module-specific configurations
  modules: {
    // Camera module configuration
    'react-native-camera': {
      // Custom fallback for specific method
      fallback: {
        'takePicture': (error, args, methodName) => {
          console.warn('Camera not available on web, using file input fallback');
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

    // Location module configuration
    'expo-location': {
      // Override built-in fallback
      fallback: {
        'getCurrentPositionAsync': async (error, args) => {
          if (navigator.geolocation) {
            return new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                position => resolve({
                  coords: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy || 0,
                    altitude: position.coords.altitude || 0,
                    heading: position.coords.heading || 0,
                    speed: position.coords.speed || 0
                  },
                  timestamp: position.timestamp
                }),
                error => reject(error),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
              );
            });
          }
          throw new Error('Geolocation not supported');
        }
      }
    },

    // Haptics with web vibration fallback
    'expo-haptics': {
      fallback: {
        'impactAsync': (error, args) => {
          const [style] = args;
          if (navigator.vibrate) {
            // Map haptic styles to vibration patterns
            const vibrationMap = {
              'light': 50,
              'medium': 100,
              'heavy': 200
            };
            const duration = vibrationMap[style] || 100;
            navigator.vibrate(duration);
          }
          return Promise.resolve();
        }
      }
    },

    // Device info with web alternatives
    'react-native-device-info': {
      fallback: {
        'getDeviceId': () => {
          // Use session storage for consistent ID
          let deviceId = sessionStorage.getItem('web-device-id');
          if (!deviceId) {
            deviceId = 'web-' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('web-device-id', deviceId);
          }
          return Promise.resolve(deviceId);
        },
        'getSystemVersion': () => {
          return Promise.resolve(navigator.userAgent);
        },
        'getModel': () => {
          return Promise.resolve('Web Browser');
        }
      }
    },

    // Share with Web Share API fallback
    'react-native-share': {
      fallback: {
        'open': (error, args) => {
          const [options] = args;
          if (navigator.share) {
            return navigator.share({
              title: options.title,
              text: options.message,
              url: options.url
            });
          }
          
          // Fallback to copying to clipboard
          if (navigator.clipboard && options.message) {
            navigator.clipboard.writeText(options.message);
            alert('Content copied to clipboard');
          }
          
          return Promise.resolve();
        }
      }
    },

    // Clipboard with modern API
    '@react-native-clipboard/clipboard': {
      fallback: {
        'getString': () => {
          if (navigator.clipboard) {
            return navigator.clipboard.readText();
          }
          return Promise.resolve('');
        },
        'setString': (error, args) => {
          const [text] = args;
          if (navigator.clipboard) {
            return navigator.clipboard.writeText(text);
          }
          return Promise.resolve();
        }
      }
    },

    // File system with web alternatives
    'expo-file-system': {
      fallback: {
        'readAsStringAsync': () => {
          console.warn('File system not available on web');
          return Promise.resolve('');
        },
        'writeAsStringAsync': () => {
          console.warn('File system not available on web');
          return Promise.resolve();
        }
      }
    },

    // Push notifications placeholder
    'expo-notifications': {
      fallback: {
        'requestPermissionsAsync': () => {
          if ('Notification' in window) {
            return Notification.requestPermission().then(permission => ({
              status: permission === 'granted' ? 'granted' : 'denied'
            }));
          }
          return Promise.resolve({ status: 'denied' });
        },
        'scheduleNotificationAsync': () => {
          console.warn('Push notifications not available on web');
          return Promise.resolve();
        }
      }
    }
  }
};

module.exports = runtimeResolverConfig;