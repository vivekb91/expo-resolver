/**
 * Metro Auto-Wrapper Plugin
 * 
 * This plugin automatically wraps native modules with runtime resolver
 * at the Metro resolution level, requiring zero code changes.
 */

const path = require('path');
const fs = require('fs');
const { createRuntimeResolver } = require('../runtime-resolver/src/index');

class MetroAutoWrapperPlugin {
  constructor(options = {}) {
    this.options = {
      // Modules to auto-wrap
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
        ...options.modules || []
      ],
      
      // Platforms to apply wrapping
      platforms: ['web', 'dom'],
      
      // Resolver configuration
      resolverConfig: {
        logging: true,
        logLevel: 'warn',
        fallbackStrategy: 'graceful',
        ...options.resolverConfig || {}
      },
      
      // Cache directory
      cacheDir: options.cacheDir || path.join(process.cwd(), '.metro-cache', 'runtime-wrappers'),
      
      ...options
    };
    
    this.wrapperCache = new Map();
    this.ensureCacheDir();
  }

  /**
   * Ensure cache directory exists
   */
  ensureCacheDir() {
    if (!fs.existsSync(this.options.cacheDir)) {
      fs.mkdirSync(this.options.cacheDir, { recursive: true });
    }
  }

  /**
   * Create Metro resolver that auto-wraps modules
   */
  createResolver(baseResolver) {
    return (context, moduleName, platform) => {
      // First resolve normally
      const resolution = baseResolver(context, moduleName, platform);
      
      // Check if we should wrap this module
      if (this.shouldWrapModule(moduleName, platform)) {
        const wrapperPath = this.getOrCreateWrapper(moduleName, resolution.filePath);
        
        return {
          ...resolution,
          filePath: wrapperPath
        };
      }
      
      return resolution;
    };
  }

  /**
   * Check if a module should be wrapped
   */
  shouldWrapModule(moduleName, platform) {
    // Only wrap on specified platforms
    if (!this.options.platforms.includes(platform)) {
      return false;
    }
    
    // Check if module is in the wrap list
    return this.options.modules.some(pattern => {
      if (typeof pattern === 'string') {
        return moduleName === pattern;
      } else if (pattern instanceof RegExp) {
        return pattern.test(moduleName);
      }
      return false;
    });
  }

  /**
   * Get or create wrapper for a module
   */
  getOrCreateWrapper(moduleName, originalPath) {
    const cacheKey = `${moduleName}:${originalPath}`;
    
    if (this.wrapperCache.has(cacheKey)) {
      return this.wrapperCache.get(cacheKey);
    }
    
    const wrapperPath = this.createWrapper(moduleName, originalPath);
    this.wrapperCache.set(cacheKey, wrapperPath);
    
    return wrapperPath;
  }

  /**
   * Create wrapper file for a module
   */
  createWrapper(moduleName, originalPath) {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(`${moduleName}:${originalPath}`).digest('hex');
    const wrapperPath = path.join(this.options.cacheDir, `${hash}.js`);
    
    // Check if wrapper already exists and is up to date
    if (fs.existsSync(wrapperPath)) {
      const wrapperStat = fs.statSync(wrapperPath);
      const originalStat = fs.statSync(originalPath);
      
      if (wrapperStat.mtime > originalStat.mtime) {
        return wrapperPath;
      }
    }
    
    // Generate wrapper content
    const wrapperContent = this.generateWrapperContent(moduleName, originalPath);
    
    // Write wrapper file
    fs.writeFileSync(wrapperPath, wrapperContent);
    
    return wrapperPath;
  }

  /**
   * Generate wrapper file content
   */
  generateWrapperContent(moduleName, originalPath) {
    const runtimeResolverPath = path.resolve(__dirname, '../runtime-resolver/src/index');
    const resolverConfigJson = JSON.stringify(this.options.resolverConfig, null, 2);
    
    return `
/**
 * Auto-generated runtime wrapper for ${moduleName}
 * Generated on: ${new Date().toISOString()}
 * Original: ${originalPath}
 */

const { createRuntimeResolver } = require('${runtimeResolverPath}');

// Create resolver instance with configuration
const resolver = createRuntimeResolver(${resolverConfigJson});

// Import the original module
let originalModule;
try {
  originalModule = require('${originalPath}');
} catch (error) {
  console.warn('Failed to import ${moduleName}:', error.message);
  originalModule = {};
}

// Wrap with runtime resolver
const wrappedModule = resolver.resolve('${moduleName}', originalModule);

// Export the wrapped module
module.exports = wrappedModule;

// Handle default exports
if (originalModule && originalModule.default) {
  const wrappedDefault = resolver.resolve('${moduleName}', originalModule.default);
  module.exports.default = wrappedDefault;
}

// Handle named exports
if (originalModule && typeof originalModule === 'object') {
  Object.keys(originalModule).forEach(function(key) {
    if (key !== 'default') {
      const value = originalModule[key];
      if (typeof value === 'object' && value !== null) {
        // Wrap object exports
        const wrappedExport = resolver.resolve('${moduleName}.' + key, value);
        module.exports[key] = wrappedExport;
      } else {
        // Pass through primitive exports
        module.exports[key] = value;
      }
    }
  });
}

// Add debugging info
module.exports.__runtimeResolverWrapped = true;
module.exports.__originalModule = '${moduleName}';
module.exports.__originalPath = '${originalPath}';
`;
  }

  /**
   * Create Metro configuration with auto-wrapping
   */
  createMetroConfig(baseConfig) {
    // Apply auto-wrapping resolver
    const originalResolver = baseConfig.resolver?.resolveRequest;
    baseConfig.resolver = baseConfig.resolver || {};
    
    baseConfig.resolver.resolveRequest = this.createResolver(
      originalResolver || ((context, moduleName, platform) => {
        return context.resolveRequest(context, moduleName, platform);
      })
    );
    
    // Add watch folders
    baseConfig.watchFolders = [
      ...(baseConfig.watchFolders || []),
      path.resolve(__dirname, '../runtime-resolver')
    ];
    
    return baseConfig;
  }

  /**
   * Clean cache directory
   */
  cleanCache() {
    if (fs.existsSync(this.options.cacheDir)) {
      fs.rmSync(this.options.cacheDir, { recursive: true, force: true });
    }
    this.wrapperCache.clear();
  }
}

/**
 * Factory function to create the plugin
 */
function createMetroAutoWrapperPlugin(options = {}) {
  return new MetroAutoWrapperPlugin(options);
}

/**
 * Apply plugin to Metro config
 */
function applyAutoWrapperPlugin(metroConfig, pluginOptions = {}) {
  const plugin = createMetroAutoWrapperPlugin(pluginOptions);
  return plugin.createMetroConfig(metroConfig);
}

module.exports = {
  MetroAutoWrapperPlugin,
  createMetroAutoWrapperPlugin,
  applyAutoWrapperPlugin
};