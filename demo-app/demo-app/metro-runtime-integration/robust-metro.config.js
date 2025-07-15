/**
 * Robust Metro Configuration
 * 
 * This version handles cache errors and provides better error handling
 * for the runtime wrapper generation.
 */

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const config = getDefaultConfig(__dirname);

/**
 * Robust auto-wrapper with better error handling
 */
function applyRobustAutoWrapper(baseConfig, options = {}) {
  const {
    modules = [],
    platforms = ['web', 'dom'],
    resolverConfig = {
      logging: true,
      logLevel: 'warn',
      fallbackStrategy: 'graceful'
    }
  } = options;

  // Ensure cache directory exists with proper permissions
  const cacheDir = path.join(process.cwd(), '.metro-cache', 'runtime-wrappers');
  ensureCacheDir(cacheDir);

  // Store original resolver
  const originalResolver = baseConfig.resolver?.resolveRequest;
  
  // Create enhanced resolver with error handling
  baseConfig.resolver = baseConfig.resolver || {};
  baseConfig.resolver.resolveRequest = (context, moduleName, platform) => {
    try {
      // First resolve normally
      const resolution = originalResolver 
        ? originalResolver(context, moduleName, platform)
        : context.resolveRequest(context, moduleName, platform);
      
      // Check if we should wrap this module
      const shouldWrap = platforms.includes(platform) && 
                        modules.some(module => {
                          if (typeof module === 'string') {
                            return moduleName === module;
                          } else if (module instanceof RegExp) {
                            return module.test(moduleName);
                          }
                          return false;
                        });
      
      if (shouldWrap) {
        const wrapperPath = createRobustWrapper(moduleName, resolution.filePath, resolverConfig, cacheDir);
        if (wrapperPath) {
          return {
            ...resolution,
            filePath: wrapperPath
          };
        }
      }
      
      return resolution;
    } catch (error) {
      console.error(`[Metro Wrapper] Error resolving ${moduleName}:`, error.message);
      // Return original resolution on error
      return originalResolver 
        ? originalResolver(context, moduleName, platform)
        : context.resolveRequest(context, moduleName, platform);
    }
  };

  // Add watch folders
  baseConfig.watchFolders = [
    ...(baseConfig.watchFolders || []),
    path.resolve(__dirname, '../runtime-resolver')
  ];

  return baseConfig;
}

/**
 * Ensure cache directory exists with proper permissions
 */
function ensureCacheDir(cacheDir) {
  try {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true, mode: 0o755 });
    }
    
    // Test write permissions
    const testFile = path.join(cacheDir, '.test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    
  } catch (error) {
    console.warn(`[Metro Wrapper] Cache directory issue: ${error.message}`);
    console.warn('Runtime wrapper cache disabled');
  }
}

/**
 * Create wrapper file with robust error handling
 */
function createRobustWrapper(moduleName, originalPath, resolverConfig, cacheDir) {
  try {
    // Create a safe hash for the filename
    const hash = crypto.createHash('md5')
      .update(`${moduleName}:${originalPath}:${Date.now()}`)
      .digest('hex');
    
    const wrapperPath = path.join(cacheDir, `wrapper_${hash}.js`);
    
    // Check if original file exists
    if (!fs.existsSync(originalPath)) {
      console.warn(`[Metro Wrapper] Original file not found: ${originalPath}`);
      return null;
    }
    
    // Generate wrapper content with validation
    const wrapperContent = generateRobustWrapperContent(moduleName, originalPath, resolverConfig);
    
    if (!wrapperContent) {
      console.warn(`[Metro Wrapper] Failed to generate wrapper for ${moduleName}`);
      return null;
    }
    
    // Write wrapper file atomically
    const tempPath = wrapperPath + '.tmp';
    fs.writeFileSync(tempPath, wrapperContent, { mode: 0o644 });
    
    // Validate the written file
    const written = fs.readFileSync(tempPath, 'utf8');
    if (written !== wrapperContent) {
      console.warn(`[Metro Wrapper] Write validation failed for ${moduleName}`);
      fs.unlinkSync(tempPath);
      return null;
    }
    
    // Atomically move to final location
    fs.renameSync(tempPath, wrapperPath);
    
    console.log(`[Metro Wrapper] Created wrapper for ${moduleName}`);
    return wrapperPath;
    
  } catch (error) {
    console.error(`[Metro Wrapper] Error creating wrapper for ${moduleName}:`, error.message);
    return null;
  }
}

/**
 * Generate robust wrapper content
 */
function generateRobustWrapperContent(moduleName, originalPath, resolverConfig) {
  try {
    const runtimeResolverPath = path.resolve(__dirname, '../runtime-resolver/src/index');
    
    // Validate paths
    if (!fs.existsSync(runtimeResolverPath + '.js')) {
      console.warn(`[Metro Wrapper] Runtime resolver not found at: ${runtimeResolverPath}`);
      return null;
    }
    
    const configStr = JSON.stringify(resolverConfig, null, 2);
    
    // Build content with proper escaping
    const content = [
      '/**',
      ` * Auto-generated runtime wrapper for ${moduleName.replace(/['"]/g, '\\"')}`,
      ` * Generated on: ${new Date().toISOString()}`,
      ` * Original: ${originalPath.replace(/\\/g, '/')}`,
      ' */',
      '',
      '// Error handling wrapper',
      'let createRuntimeResolver;',
      'try {',
      `  createRuntimeResolver = require('${runtimeResolverPath.replace(/\\/g, '/')}').createRuntimeResolver;`,
      '} catch (error) {',
      '  console.warn("Runtime resolver not available:", error.message);',
      '  // Fallback to pass-through',
      '  module.exports = require("' + originalPath.replace(/\\/g, '/').replace(/"/g, '\\"') + '");',
      '  return;',
      '}',
      '',
      '// Create resolver instance',
      `const resolver = createRuntimeResolver(${configStr});`,
      '',
      '// Import original module with error handling',
      'let originalModule;',
      'try {',
      `  originalModule = require('${originalPath.replace(/\\/g, '/').replace(/'/g, "\\'")}');`,
      '} catch (error) {',
      `  console.warn('Failed to import ${moduleName.replace(/'/g, "\\'")}:', error.message);`,
      '  originalModule = {};',
      '}',
      '',
      '// Wrap with runtime resolver',
      `const wrappedModule = resolver.resolve('${moduleName.replace(/'/g, "\\'")}', originalModule);`,
      '',
      '// Export wrapped module',
      'module.exports = wrappedModule;',
      '',
      '// Handle default exports',
      'if (originalModule && originalModule.default) {',
      `  const wrappedDefault = resolver.resolve('${moduleName.replace(/'/g, "\\'")}', originalModule.default);`,
      '  module.exports.default = wrappedDefault;',
      '}',
      '',
      '// Handle named exports safely',
      'if (originalModule && typeof originalModule === "object") {',
      '  Object.keys(originalModule).forEach(function(key) {',
      '    if (key !== "default" && typeof originalModule[key] === "object" && originalModule[key] !== null) {',
      '      try {',
      `        const wrappedExport = resolver.resolve('${moduleName.replace(/'/g, "\\'")}.' + key, originalModule[key]);`,
      '        module.exports[key] = wrappedExport;',
      '      } catch (error) {',
      '        console.warn("Failed to wrap export " + key + ":", error.message);',
      '        module.exports[key] = originalModule[key];',
      '      }',
      '    } else {',
      '      module.exports[key] = originalModule[key];',
      '    }',
      '  });',
      '}',
      '',
      '// Debug info',
      'module.exports.__runtimeResolverWrapped = true;',
      `module.exports.__originalModule = '${moduleName.replace(/'/g, "\\'")}';`,
      ''
    ];
    
    return content.join('\n');
    
  } catch (error) {
    console.error(`[Metro Wrapper] Error generating wrapper content:`, error.message);
    return null;
  }
}

// Apply the robust wrapper
const robustConfig = applyRobustAutoWrapper(config, {
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
    // Add your modules here
  ],
  
  platforms: ['web', 'dom'],
  
  resolverConfig: {
    logging: true,
    logLevel: 'warn',
    fallbackStrategy: 'graceful'
  }
});

module.exports = robustConfig;