const { BUILT_IN_MAPPINGS } = require('../mappings/built-in-mappings');
const { isMobileSpecificModule } = require('./pattern-detector');
const { isWebPlatform } = require('../utils/platform-detector');
const { generateAutoMock } = require('../utils/mock-generator');
const { logger } = require('../utils/logger');

function createWebCompatResolver(baseResolver, options = {}) {
  const {
    moduleMap = {},
    overrides = {},
    fallbackStrategy = 'graceful',
    webPlatforms = ['web', 'browser'],
    generateMocks = true,
    enableLogging = true
  } = options;

  return (context, moduleName, platform) => {
    if (!isWebPlatform(platform, webPlatforms)) {
      return baseResolver(context, moduleName, platform);
    }

    if (enableLogging) {
      logger.debug(`Resolving module "${moduleName}" for platform "${platform}"`);
    }

    try {
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

      // 4. Auto-detect mobile-specific patterns
      if (isMobileSpecificModule(moduleName)) {
        if (generateMocks) {
          const mockPath = generateAutoMock(moduleName, context, options);
          if (enableLogging) {
            logger.warn(`Auto-generated mock for mobile-specific module "${moduleName}"`);
          }
          return baseResolver(context, mockPath, platform);
        } else {
          if (enableLogging) {
            logger.warn(`Mobile-specific module "${moduleName}" detected but mock generation disabled`);
          }
          if (fallbackStrategy === 'graceful') {
            throw new Error(`Mobile-specific module "${moduleName}" not available on web platform`);
          }
        }
      }

      // 5. Fallback to original Metro resolver
      return baseResolver(context, moduleName, platform);

    } catch (error) {
      if (enableLogging) {
        logger.error(`Failed to resolve module "${moduleName}":`, error.message);
      }
      
      if (fallbackStrategy === 'graceful') {
        throw error;
      }
      
      return baseResolver(context, moduleName, platform);
    }
  };
}

module.exports = {
  createWebCompatResolver
};