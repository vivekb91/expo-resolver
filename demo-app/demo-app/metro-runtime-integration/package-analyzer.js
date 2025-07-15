/**
 * Package Analyzer
 * 
 * Automatically detects native modules by analyzing package.json
 * and node_modules to find all React Native dependencies.
 */

const path = require('path');
const fs = require('fs');

/**
 * Analyze package.json and node_modules to find native modules
 */
function analyzeNativeModules(projectRoot = process.cwd()) {
  const nativeModules = new Set();
  
  // 1. Analyze package.json dependencies
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies
    };
    
    Object.keys(allDeps).forEach(dep => {
      if (isNativeModule(dep)) {
        nativeModules.add(dep);
      }
    });
  }
  
  // 2. Scan node_modules for additional native modules
  const nodeModulesPath = path.join(projectRoot, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    scanNodeModules(nodeModulesPath, nativeModules);
  }
  
  return Array.from(nativeModules);
}

/**
 * Check if a module name indicates it's a native module
 */
function isNativeModule(moduleName) {
  const nativePatterns = [
    /^react-native-(?!web$)/,
    /^expo-(?!web$)/,
    /^@react-native-/,
    /^@expo\//,
    /native-base/,
    /react-navigation/
  ];
  
  return nativePatterns.some(pattern => pattern.test(moduleName));
}

/**
 * Scan node_modules directory for native modules
 */
function scanNodeModules(nodeModulesPath, nativeModules) {
  try {
    const items = fs.readdirSync(nodeModulesPath);
    
    items.forEach(item => {
      if (item.startsWith('.')) return;
      
      const itemPath = path.join(nodeModulesPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        if (item.startsWith('@')) {
          // Scoped packages
          const scopedPath = itemPath;
          const scopedItems = fs.readdirSync(scopedPath);
          
          scopedItems.forEach(scopedItem => {
            const fullName = `${item}/${scopedItem}`;
            if (isNativeModule(fullName)) {
              nativeModules.add(fullName);
            }
          });
        } else {
          // Regular packages
          if (isNativeModule(item)) {
            nativeModules.add(item);
          }
        }
      }
    });
  } catch (error) {
    console.warn('Error scanning node_modules:', error.message);
  }
}

/**
 * Create Metro config with auto-detected modules
 */
function createAutoDetectedConfig(baseConfig, options = {}) {
  const {
    projectRoot = process.cwd(),
    platforms = ['web', 'dom'],
    resolverConfig = {
      logging: true,
      logLevel: 'warn',
      fallbackStrategy: 'graceful'
    },
    enableAutoDetection = true,
    additionalModules = []
  } = options;
  
  let modules = [...additionalModules];
  
  if (enableAutoDetection) {
    const detectedModules = analyzeNativeModules(projectRoot);
    console.log(`🔍 [Package Analyzer] Auto-detected ${detectedModules.length} native modules:`);
    detectedModules.forEach(module => {
      console.log(`  - ${module}`);
    });
    
    modules = [...modules, ...detectedModules];
  }
  
  // Apply the simple auto-wrapper with detected modules
  const { applyAutoWrapperPlugin } = require('./simple-auto-wrapper');
  
  return applyAutoWrapperPlugin(baseConfig, {
    modules,
    platforms,
    resolverConfig
  });
}

module.exports = {
  analyzeNativeModules,
  isNativeModule,
  createAutoDetectedConfig
};