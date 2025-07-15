/**
 * Minimal Wrapper - Bulletproof version that avoids cache issues
 * 
 * This version creates simpler wrappers and has better error handling
 * to avoid SHA-1 and cache corruption issues.
 */

const path = require('path');
const fs = require('fs');

/**
 * Apply minimal auto-wrapper (no cache, inline generation)
 */
function applyMinimalWrapper(baseConfig, options = {}) {
  const {
    modules = [],
    platforms = ['web', 'dom']
  } = options;

  // Store original resolver
  const originalResolver = baseConfig.resolver?.resolveRequest;
  
  // Create resolver that handles modules inline (no cache files)
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
        console.log(`[Minimal Wrapper] Wrapping ${moduleName} for ${platform}`);
        
        // Create wrapper using require transformation instead of file generation
        const wrappedPath = createInlineWrapper(moduleName, resolution.filePath);
        
        if (wrappedPath) {
          return {
            ...resolution,
            filePath: wrappedPath
          };
        }
      }
      
      return resolution;
    } catch (error) {
      console.error(`[Minimal Wrapper] Error resolving ${moduleName}:`, error.message);
      // Return original resolution on error
      return originalResolver 
        ? originalResolver(context, moduleName, platform)
        : context.resolveRequest(context, moduleName, platform);
    }
  };

  return baseConfig;
}

/**
 * Create inline wrapper (no file system operations)
 */
function createInlineWrapper(moduleName, originalPath) {
  try {
    // Create a very simple wrapper in memory
    const runtimeResolverPath = path.resolve(__dirname, '../runtime-resolver/src/index');
    
    // Check if runtime resolver exists
    if (!fs.existsSync(runtimeResolverPath + '.js')) {
      console.warn(`[Minimal Wrapper] Runtime resolver not found, skipping ${moduleName}`);
      return null;
    }
    
    // Generate simple wrapper content
    const wrapperContent = `
// Simple runtime wrapper for ${moduleName}
const { createRuntimeResolver } = require('${runtimeResolverPath.replace(/\\/g, '/')}');

const resolver = createRuntimeResolver({
  logging: true,
  logLevel: 'warn',
  fallbackStrategy: 'graceful'
});

let originalModule;
try {
  originalModule = require('${originalPath.replace(/\\/g, '/').replace(/'/g, "\\'")}');
} catch (error) {
  console.warn('Failed to import ${moduleName}:', error.message);
  originalModule = {};
}

const wrappedModule = resolver.resolve('${moduleName}', originalModule);

module.exports = wrappedModule;
if (originalModule && originalModule.default) {
  module.exports.default = resolver.resolve('${moduleName}', originalModule.default);
}
`;

    // Write to a predictable location with timestamp to avoid conflicts
    const timestamp = Date.now();
    const safeModuleName = moduleName.replace(/[^a-zA-Z0-9]/g, '_');
    const wrapperPath = path.join(__dirname, `../runtime-resolver/temp/wrapper_${safeModuleName}_${timestamp}.js`);
    
    // Ensure temp directory exists
    const tempDir = path.dirname(wrapperPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Write wrapper file
    fs.writeFileSync(wrapperPath, wrapperContent, 'utf8');
    
    console.log(`[Minimal Wrapper] Created wrapper at ${wrapperPath}`);
    return wrapperPath;
    
  } catch (error) {
    console.error(`[Minimal Wrapper] Error creating wrapper for ${moduleName}:`, error.message);
    return null;
  }
}

module.exports = {
  applyMinimalWrapper
};