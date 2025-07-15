/**
 * Smart Metro Configuration
 * 
 * Automatically detects and wraps native modules without manual configuration.
 * Choose your preferred auto-detection method.
 */

const { getDefaultConfig } = require('expo/metro-config');

// Method 1: Pattern-based auto-detection
const { applyAutoDetectWrapper } = require('./auto-detect-wrapper');

// Method 2: Package.json analysis
const { createAutoDetectedConfig } = require('./package-analyzer');

const config = getDefaultConfig(__dirname);

// =============================================================================
// OPTION 1: Pattern-Based Auto-Detection (Recommended)
// =============================================================================
// Automatically wraps any module matching these patterns:
// - react-native-* (except react-native-web)
// - expo-* (except expo-web)
// - @react-native-*
// - @expo/*

const patternBasedConfig = applyAutoDetectWrapper(config, {
  // Auto-detection patterns
  autoDetectPatterns: [
    /^react-native-(?!web$)/,     // react-native-camera, react-native-share, etc.
    /^expo-(?!web$)/,             // expo-camera, expo-location, etc.
    /^@react-native-/,            // @react-native-clipboard/clipboard, etc.
    /^@expo\//,                   // @expo/vector-icons, etc.
    /native-base/,                // native-base components
    /react-navigation/,           // react-navigation modules
  ],
  
  // Additional specific modules (if needed)
  additionalModules: [
    'some-custom-native-module',
    'another-native-lib'
  ],
  
  // Platforms to apply wrapping
  platforms: ['web', 'dom'],
  
  // Auto-detection settings
  autoDetect: true,          // Enable auto-detection
  logDetection: true,        // Log detected modules
  
  // Resolver configuration
  resolverConfig: {
    logging: true,
    logLevel: 'warn',
    fallbackStrategy: 'graceful'
  }
});

// =============================================================================
// OPTION 2: Package.json Analysis (Most Automatic)
// =============================================================================
// Scans your package.json and node_modules to find ALL native dependencies

const packageAnalysisConfig = createAutoDetectedConfig(config, {
  projectRoot: __dirname,
  platforms: ['web', 'dom'],
  enableAutoDetection: true,  // Scan package.json and node_modules
  
  // Additional modules not detected automatically
  additionalModules: [
    'some-custom-native-module'
  ],
  
  resolverConfig: {
    logging: true,
    logLevel: 'warn',
    fallbackStrategy: 'graceful'
  }
});

// =============================================================================
// OPTION 3: Hybrid Approach (Best of Both)
// =============================================================================
// Combines pattern detection with package analysis

const { applyAutoWrapperPlugin } = require('./simple-auto-wrapper');

const hybridConfig = (() => {
  // Get modules from package analysis
  const { analyzeNativeModules } = require('./package-analyzer');
  const detectedModules = analyzeNativeModules(__dirname);
  
  console.log(`🔍 [Hybrid] Auto-detected ${detectedModules.length} native modules from package.json`);
  
  return applyAutoWrapperPlugin(config, {
    modules: [
      ...detectedModules,  // From package analysis
      
      // Additional patterns that might not be in package.json
      /^react-native-(?!web$)/,
      /^expo-(?!web$)/,
      /^@react-native-/,
      /^@expo\//,
    ],
    
    platforms: ['web', 'dom'],
    
    resolverConfig: {
      logging: true,
      logLevel: 'warn',
      fallbackStrategy: 'graceful'
    }
  });
})();

// =============================================================================
// EXPORT YOUR PREFERRED CONFIG
// =============================================================================

// Choose one of these configurations:

// Export pattern-based (recommended for most projects)
module.exports = patternBasedConfig;

// Export package analysis (most automatic)
// module.exports = packageAnalysisConfig;

// Export hybrid approach (best of both)
// module.exports = hybridConfig;