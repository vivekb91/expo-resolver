/**
 * Example Metro configuration with Web Compatibility Extension
 * 
 * This example shows how to integrate metro-web-compat with your existing
 * Expo/React Native Metro configuration.
 */

const { getDefaultConfig } = require('expo/metro-config');
const { createWebCompatResolver } = require('metro-web-compat');

const config = getDefaultConfig(__dirname);

// Zero Configuration Setup (Recommended)
// This will automatically handle 100+ common mobile packages
config.resolver = createWebCompatResolver(config.resolver);

// Optional: Custom configuration with overrides
// config.resolver = createWebCompatResolver(config.resolver, {
//   // Custom module mappings (only needed for packages not in built-in database)
//   moduleMap: {
//     'my-custom-native-module': './src/web-alternatives/my-web-module',
//     'some-proprietary-lib': 'web-compatible-alternative'
//   },
//   
//   // Override built-in mappings if needed
//   overrides: {
//     'expo-camera': 'my-preferred-camera-lib' // Override default mapping
//   },
//   
//   // Platform detection settings
//   webPlatforms: ['web', 'browser'],
//   
//   // Mock generation settings
//   generateMocks: true,
//   fallbackStrategy: 'graceful',
//   
//   // Logging settings
//   enableLogging: true
// });

// Optional: Enable web compatibility linting
// config.transformer.babelTransformerPath = require.resolve('metro-web-compat/transformer');

module.exports = config;