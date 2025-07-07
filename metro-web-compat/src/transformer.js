const { logger } = require('../utils/logger');
const { isMobileSpecificModule } = require('./pattern-detector');

function createWebCompatTransformer(baseTransformer, options = {}) {
  const {
    enableLinting = true,
    enableWarnings = true,
    webPlatforms = ['web', 'browser']
  } = options;

  return {
    ...baseTransformer,
    
    transform(config) {
      const originalTransform = baseTransformer.transform;
      
      return {
        ...originalTransform(config),
        
        async transform(transformRequest) {
          try {
            const { src, filename, options: transformOptions } = transformRequest;
            
            // Check if this is a web platform build
            const isWebBuild = webPlatforms.includes(transformOptions.platform);
            
            if (isWebBuild && enableLinting) {
              await lintForWebCompatibility(src, filename, transformOptions);
            }
            
            // Call original transformer
            const result = await originalTransform(config).transform(transformRequest);
            
            if (isWebBuild && enableWarnings) {
              addWebCompatibilityWarnings(result, filename, transformOptions);
            }
            
            return result;
            
          } catch (error) {
            logger.error(`Transform failed for ${transformRequest.filename}:`, error.message);
            throw error;
          }
        }
      };
    }
  };
}

async function lintForWebCompatibility(src, filename, options) {
  try {
    // Check for direct native module imports
    const nativeModulePatterns = [
      /import.*from.*['"]react-native['"].*NativeModules/,
      /import.*NativeModules.*from.*['"]react-native['"]/,
      /require\(['"]react-native['"]\)\.NativeModules/,
      /from.*['"]react-native\/Libraries/,
      /require\(['"]react-native\/Libraries/
    ];
    
    const mobileSpecificImports = [];
    const lines = src.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Check for native module usage
      if (nativeModulePatterns.some(pattern => pattern.test(line))) {
        logger.warn(`[${filename}:${lineNumber}] Direct native module usage detected: ${line.trim()}`);
      }
      
      // Check for mobile-specific imports
      const importMatch = line.match(/import.*from.*['"]([^'"]+)['"]/);
      if (importMatch) {
        const moduleName = importMatch[1];
        if (isMobileSpecificModule(moduleName)) {
          mobileSpecificImports.push({
            moduleName,
            lineNumber,
            line: line.trim()
          });
        }
      }
      
      // Check for require statements
      const requireMatch = line.match(/require\(['"]([^'"]+)['"]\)/);
      if (requireMatch) {
        const moduleName = requireMatch[1];
        if (isMobileSpecificModule(moduleName)) {
          mobileSpecificImports.push({
            moduleName,
            lineNumber,
            line: line.trim()
          });
        }
      }
    });
    
    // Report mobile-specific imports
    if (mobileSpecificImports.length > 0) {
      logger.compatibility(`Mobile-specific imports detected in ${filename}:`);
      mobileSpecificImports.forEach(({ moduleName, lineNumber, line }) => {
        logger.compatibility(`  Line ${lineNumber}: ${moduleName} - ${line}`);
      });
    }
    
    // Check for Platform.OS usage
    if (src.includes('Platform.OS')) {
      logger.compatibility(`Platform.OS usage detected in ${filename} - ensure web compatibility`);
    }
    
    // Check for Dimensions usage
    if (src.includes('Dimensions.get')) {
      logger.compatibility(`Dimensions usage detected in ${filename} - consider responsive design`);
    }
    
  } catch (error) {
    logger.error(`Linting failed for ${filename}:`, error.message);
  }
}

function addWebCompatibilityWarnings(result, filename, options) {
  if (!result.metadata) {
    result.metadata = {};
  }
  
  if (!result.metadata.webCompatibility) {
    result.metadata.webCompatibility = {
      warnings: [],
      suggestions: []
    };
  }
  
  // Add suggestions based on detected patterns
  const { code } = result;
  
  if (code.includes('react-native')) {
    result.metadata.webCompatibility.suggestions.push(
      'Consider using react-native-web for better cross-platform compatibility'
    );
  }
  
  if (code.includes('NativeModules')) {
    result.metadata.webCompatibility.warnings.push(
      'Direct native module usage may not work on web platform'
    );
  }
  
  if (code.includes('Platform.OS')) {
    result.metadata.webCompatibility.suggestions.push(
      'Platform.OS checks detected - ensure web platform is handled'
    );
  }
}

module.exports = {
  createWebCompatTransformer
};