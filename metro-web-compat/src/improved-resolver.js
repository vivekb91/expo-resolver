const { BUILT_IN_MAPPINGS } = require('../mappings/built-in-mappings');
const { isTrulyNativeModule, getNativeDetectionConfidence } = require('./improved-pattern-detector');
const { isWebPlatform } = require('../utils/platform-detector');
const { generateAutoMock } = require('../utils/mock-generator');
const { logger } = require('../utils/logger');

function createImprovedWebCompatResolver(baseResolver, options = {}) {
  const {
    moduleMap = {},
    overrides = {},
    fallbackStrategy = 'graceful',
    webPlatforms = ['web', 'browser'],
    generateMocks = true,
    enableLogging = true,
    confidenceThreshold = 'medium', // 'low', 'medium', 'high'
    excludePatterns = [], // Patterns to never process
    forceIncludePatterns = [] // Patterns to always process
  } = options;

  return (context, moduleName, platform) => {
    if (!isWebPlatform(platform, webPlatforms)) {
      return baseResolver(context, moduleName, platform);
    }

    if (enableLogging) {
      logger.debug(`Resolving module "${moduleName}" for platform "${platform}"`);
    }

    try {
      // 0. Check exclude patterns (never process these)
      const isExcluded = excludePatterns.some(pattern => {
        if (typeof pattern === 'string') {
          return moduleName === pattern;
        }
        if (pattern instanceof RegExp) {
          return pattern.test(moduleName);
        }
        return false;
      });

      if (isExcluded) {
        if (enableLogging) {
          logger.info(`Module "${moduleName}" excluded from processing`);
        }
        return baseResolver(context, moduleName, platform);
      }

      // 1. Check override mappings first (highest priority)
      if (overrides[moduleName]) {
        if (enableLogging) {
          logger.info(`Using override mapping for "${moduleName}" -> "${overrides[moduleName]}"`);
        }
        return baseResolver(context, overrides[moduleName], platform);
      }

      // 2. Check user-defined mappings
      if (moduleMap[moduleName]) {
        if (enableLogging) {
          logger.info(`Using user mapping for "${moduleName}" -> "${moduleMap[moduleName]}"`);
        }
        return baseResolver(context, moduleMap[moduleName], platform);
      }

      // 3. Check built-in mappings (automatic)
      if (BUILT_IN_MAPPINGS[moduleName]) {
        if (enableLogging) {
          logger.info(`Using built-in mapping for "${moduleName}" -> "${BUILT_IN_MAPPINGS[moduleName]}"`);
        }
        return baseResolver(context, BUILT_IN_MAPPINGS[moduleName], platform);
      }

      // 4. Check force include patterns (always process these)
      const isForceIncluded = forceIncludePatterns.some(pattern => {
        if (typeof pattern === 'string') {
          return moduleName === pattern;
        }
        if (pattern instanceof RegExp) {
          return pattern.test(moduleName);
        }
        return false;
      });

      // 5. Smart native detection with confidence levels
      const detection = getNativeDetectionConfidence(moduleName, context);
      
      if (enableLogging) {
        logger.debug(`Native detection for "${moduleName}": ${detection.isNative ? 'NATIVE' : 'WEB'} (${detection.confidence}) - ${detection.reason}`);
      }

      // Only process if we have sufficient confidence or it's force included
      const shouldProcess = isForceIncluded || 
        (detection.isNative && shouldProcessBasedOnConfidence(detection.confidence, confidenceThreshold));

      if (shouldProcess) {
        if (generateMocks) {
          const mockPath = generateAutoMock(moduleName, context, options);
          if (enableLogging) {
            logger.warn(`Auto-generated mock for native module "${moduleName}" (${detection.confidence} confidence)`);
          }
          return baseResolver(context, mockPath, platform);
        } else {
          if (enableLogging) {
            logger.warn(`Native module "${moduleName}" detected but mock generation disabled`);
          }
          if (fallbackStrategy === 'strict') {
            throw new Error(`Native module "${moduleName}" not available on web platform`);
          }
        }
      }

      // 6. Fallback to original Metro resolver
      return baseResolver(context, moduleName, platform);

    } catch (error) {
      if (enableLogging) {
        logger.error(`Failed to resolve module "${moduleName}":`, error.message);
      }
      
      if (fallbackStrategy === 'strict') {
        throw error;
      }
      
      return baseResolver(context, moduleName, platform);
    }
  };
}

function shouldProcessBasedOnConfidence(detectionConfidence, threshold) {
  const confidenceLevels = {
    'low': 1,
    'medium': 2,
    'high': 3
  };
  
  return confidenceLevels[detectionConfidence] >= confidenceLevels[threshold];
}

module.exports = {
  createImprovedWebCompatResolver
};