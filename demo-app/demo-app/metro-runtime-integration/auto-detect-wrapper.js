/**
 * Auto-Detect Wrapper Plugin
 * 
 * Automatically detects and wraps native modules based on patterns
 * without requiring explicit configuration for each module.
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Apply auto-detect wrapper plugin to Metro config
 */
function applyAutoDetectWrapper(baseConfig, options = {}) {
  const {
    // Auto-detection patterns
    autoDetectPatterns = [
      /^react-native-(?!web$)/,     // react-native-* (except react-native-web)
      /^expo-(?!web$)/,             // expo-* (except expo-web)
      /^@react-native-/,            // @react-native-*
      /^@expo\//,                   // @expo/*
      /native-base/,                // native-base
      /react-navigation/,           // react-navigation
    ],
    
    // Additional specific modules
    additionalModules = [],
    
    // Platforms to apply wrapping
    platforms = ['web', 'dom'],
    
    // Resolver configuration
    resolverConfig = {
      logging: true,
      logLevel: 'warn',
      fallbackStrategy: 'graceful'
    },
    
    // Auto-detection settings
    autoDetect = true,
    logDetection = true
  } = options;

  // Ensure cache directory exists
  const cacheDir = path.join(process.cwd(), '.metro-cache', 'runtime-wrappers');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  // Store original resolver
  const originalResolver = baseConfig.resolver?.resolveRequest;
  
  // Create enhanced resolver
  baseConfig.resolver = baseConfig.resolver || {};
  baseConfig.resolver.resolveRequest = (context, moduleName, platform) => {
    // First resolve normally
    const resolution = originalResolver 
      ? originalResolver(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform);
    
    // Check if we should wrap this module
    const shouldWrap = platforms.includes(platform) && shouldWrapModule(
      moduleName, 
      autoDetectPatterns, 
      additionalModules, 
      autoDetect,
      logDetection
    );
    
    if (shouldWrap) {
      const wrapperPath = createWrapper(moduleName, resolution.filePath, resolverConfig, cacheDir);
      return {
        ...resolution,
        filePath: wrapperPath
      };
    }
    
    return resolution;
  };

  // Add watch folders
  baseConfig.watchFolders = [
    ...(baseConfig.watchFolders || []),
    path.resolve(__dirname, '../runtime-resolver')
  ];

  return baseConfig;
}

/**
 * Check if a module should be wrapped
 */
function shouldWrapModule(moduleName, patterns, additionalModules, autoDetect, logDetection) {
  // Check additional modules first
  if (additionalModules.includes(moduleName)) {
    if (logDetection) {
      console.log(`📦 [Auto-Wrapper] Wrapping ${moduleName} (explicit)`);
    }
    return true;
  }
  
  // Skip if auto-detection is disabled
  if (!autoDetect) {
    return false;
  }
  
  // Check against patterns
  const matchesPattern = patterns.some(pattern => {
    if (typeof pattern === 'string') {
      return moduleName === pattern;
    } else if (pattern instanceof RegExp) {
      return pattern.test(moduleName);
    }
    return false;
  });
  
  if (matchesPattern) {
    if (logDetection) {
      console.log(`🔍 [Auto-Wrapper] Auto-detected and wrapping ${moduleName}`);
    }
    return true;
  }
  
  return false;
}

/**
 * Create wrapper file for a module
 */
function createWrapper(moduleName, originalPath, resolverConfig, cacheDir) {
  const hash = crypto.createHash('md5').update(`${moduleName}:${originalPath}`).digest('hex');
  const wrapperPath = path.join(cacheDir, `${hash}.js`);
  
  // Check if wrapper already exists and is up to date
  if (fs.existsSync(wrapperPath)) {
    try {
      const wrapperStat = fs.statSync(wrapperPath);
      const originalStat = fs.statSync(originalPath);
      
      if (wrapperStat.mtime > originalStat.mtime) {
        return wrapperPath;
      }
    } catch (error) {
      // If we can't stat, regenerate the wrapper
    }
  }
  
  // Generate wrapper content
  const wrapperContent = generateWrapperContent(moduleName, originalPath, resolverConfig);
  
  // Write wrapper file
  fs.writeFileSync(wrapperPath, wrapperContent);
  
  return wrapperPath;
}

/**
 * Generate wrapper file content
 */
function generateWrapperContent(moduleName, originalPath, resolverConfig) {
  const runtimeResolverPath = path.resolve(__dirname, '../runtime-resolver/src/index');
  const configStr = JSON.stringify(resolverConfig, null, 2);
  
  const content = [
    '/**',
    ` * Auto-generated runtime wrapper for ${moduleName}`,
    ` * Generated on: ${new Date().toISOString()}`,
    ` * Original: ${originalPath}`,
    ' */',
    '',
    `const { createRuntimeResolver } = require('${runtimeResolverPath}');`,
    '',
    '// Create resolver instance with configuration',
    `const resolver = createRuntimeResolver(${configStr});`,
    '',
    '// Import the original module',
    'let originalModule;',
    'try {',
    `  originalModule = require('${originalPath}');`,
    '} catch (error) {',
    `  console.warn('Failed to import ${moduleName}:', error.message);`,
    '  originalModule = {};',
    '}',
    '',
    '// Wrap with runtime resolver',
    `const wrappedModule = resolver.resolve('${moduleName}', originalModule);`,
    '',
    '// Export the wrapped module',
    'module.exports = wrappedModule;',
    '',
    '// Handle default exports',
    'if (originalModule && originalModule.default) {',
    `  const wrappedDefault = resolver.resolve('${moduleName}', originalModule.default);`,
    '  module.exports.default = wrappedDefault;',
    '}',
    '',
    '// Handle named exports',
    'if (originalModule && typeof originalModule === "object") {',
    '  Object.keys(originalModule).forEach(function(key) {',
    '    if (key !== "default") {',
    '      const value = originalModule[key];',
    '      if (typeof value === "object" && value !== null) {',
    '        // Wrap object exports',
    `        const wrappedExport = resolver.resolve('${moduleName}.' + key, value);`,
    '        module.exports[key] = wrappedExport;',
    '      } else {',
    '        // Pass through primitive exports',
    '        module.exports[key] = value;',
    '      }',
    '    }',
    '  });',
    '}',
    '',
    '// Add debugging info',
    'module.exports.__runtimeResolverWrapped = true;',
    `module.exports.__originalModule = '${moduleName}';`,
    `module.exports.__originalPath = '${originalPath}';`,
    ''
  ];
  
  return content.join('\n');
}

module.exports = {
  applyAutoDetectWrapper
};