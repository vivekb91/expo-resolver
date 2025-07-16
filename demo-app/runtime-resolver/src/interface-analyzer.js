/**
 * Interface Analyzer - Analyzes module exports and creates appropriate runtime wrappers
 * 
 * This module inspects the actual module exports from index.js files and determines
 * the correct types and structures to create intelligent runtime fallbacks.
 */

// Conditional imports - only load Node.js operations when not in web environment
let nodeOps = null;
if (typeof window === 'undefined' && typeof process !== 'undefined' && process.platform) {
  try {
    nodeOps = require('./interface-analyzer-node');
  } catch (error) {
    console.warn('[InterfaceAnalyzer] Node.js operations not available');
  }
}

class InterfaceAnalyzer {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Analyze a module's interface by examining its exports
   * @param {string} moduleName - Name of the module
   * @param {string} projectRoot - Project root directory
   * @returns {Object} - Module interface description
   */
  analyzeModuleInterface(moduleName, projectRoot) {
    // Check cache first
    if (this.cache.has(moduleName)) {
      return this.cache.get(moduleName);
    }

    console.log(`[InterfaceAnalyzer] Analyzing module: ${moduleName}`);

    try {
      // Find the module's index file
      const moduleInterface = this.discoverModuleInterface(moduleName, projectRoot);
      
      // Cache the result
      this.cache.set(moduleName, moduleInterface);
      
      return moduleInterface;
    } catch (error) {
      console.warn(`[InterfaceAnalyzer] Failed to analyze ${moduleName}:`, error.message);
      return this.getDefaultInterface(moduleName);
    }
  }

  /**
   * Discover module interface by examining the actual module
   * @param {string} moduleName - Name of the module
   * @param {string} projectRoot - Project root directory
   * @returns {Object} - Module interface
   */
  discoverModuleInterface(moduleName, projectRoot) {
    // In web environment or if Node.js operations are not available, use fallback
    if (typeof window !== 'undefined' || !nodeOps) {
      console.warn(`[InterfaceAnalyzer] Web environment - using fallback interface for ${moduleName}`);
      return this.getDefaultInterface(moduleName);
    }
    
    // Try to find the module's main file
    const modulePath = this.findModuleMainFile(moduleName, projectRoot);
    
    if (!modulePath) {
      throw new Error(`Module ${moduleName} not found`);
    }

    // Try to load the module and analyze its exports
    try {
      const moduleExports = nodeOps.loadModuleExports(modulePath);
      return this.analyzeExports(moduleExports, moduleName);
    } catch (error) {
      console.warn(`[InterfaceAnalyzer] Failed to require ${modulePath}:`, error.message);
      
      // Fallback: try to analyze the source code statically
      return this.analyzeSourceCode(modulePath, moduleName);
    }
  }

  /**
   * Find the main file of a module
   * @param {string} moduleName - Name of the module
   * @param {string} projectRoot - Project root directory
   * @returns {string|null} - Path to main file or null
   */
  findModuleMainFile(moduleName, projectRoot) {
    if (!nodeOps) return null;
    
    const possiblePaths = [
      nodeOps.joinPath(projectRoot, 'node_modules', moduleName, 'index.js'),
      nodeOps.joinPath(projectRoot, 'node_modules', moduleName, 'src', 'index.js'),
      nodeOps.joinPath(projectRoot, 'node_modules', moduleName, 'lib', 'index.js'),
      nodeOps.joinPath(projectRoot, 'node_modules', moduleName, 'dist', 'index.js')
    ];

    // Also check package.json for main entry
    const packageJsonPath = nodeOps.joinPath(projectRoot, 'node_modules', moduleName, 'package.json');
    if (nodeOps.fileExists(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(nodeOps.readFile(packageJsonPath));
        
        // Prioritize CommonJS over ES modules for better compatibility
        if (packageJson.main) {
          const mainPath = nodeOps.resolvePath(nodeOps.getDirname(packageJsonPath), packageJson.main);
          possiblePaths.unshift(mainPath);
        }
        
        // Also check for lib/commonjs structure (common in React Native packages)
        const commonjsPath = nodeOps.joinPath(projectRoot, 'node_modules', moduleName, 'lib', 'commonjs', 'index.js');
        if (nodeOps.fileExists(commonjsPath)) {
          possiblePaths.unshift(commonjsPath);
        }
        
        // ES modules as fallback
        if (packageJson.module) {
          const modulePath = nodeOps.resolvePath(nodeOps.getDirname(packageJsonPath), packageJson.module);
          possiblePaths.push(modulePath); // Add to end, not beginning
        }
      } catch (error) {
        console.warn(`[InterfaceAnalyzer] Failed to read package.json for ${moduleName}`);
      }
    }

    // Find the first existing file
    for (const filePath of possiblePaths) {
      if (nodeOps.fileExists(filePath)) {
        return filePath;
      }
    }

    return null;
  }

  /**
   * Analyze module exports to determine types and structure
   * @param {*} moduleExports - The actual module exports
   * @param {string} moduleName - Name of the module
   * @returns {Object} - Interface description
   */
  analyzeExports(moduleExports, moduleName) {
    const moduleInterface = {
      moduleName,
      exports: {},
      type: 'module'
    };

    if (!moduleExports || typeof moduleExports !== 'object') {
      return moduleInterface;
    }

    // Analyze each export
    for (const [key, value] of Object.entries(moduleExports)) {
      moduleInterface.exports[key] = this.analyzeExportValue(key, value, moduleName);
    }

    return moduleInterface;
  }

  /**
   * Analyze a single export value to determine its type
   * @param {string} key - Export key name
   * @param {*} value - Export value
   * @param {string} moduleName - Module name for context
   * @returns {Object} - Export description
   */
  analyzeExportValue(key, value, moduleName) {
    // Handle null/undefined
    if (value == null) {
      return { type: 'null', key };
    }

    // Handle primitives
    if (typeof value !== 'object' && typeof value !== 'function') {
      return { type: typeof value, key, value };
    }

    // Handle functions
    if (typeof value === 'function') {
      return this.analyzeFunctionExport(key, value, moduleName);
    }

    // Handle objects
    if (typeof value === 'object') {
      return this.analyzeObjectExport(key, value, moduleName);
    }

    return { type: 'unknown', key };
  }

  /**
   * Analyze a function export
   * @param {string} key - Export key name
   * @param {Function} fn - Function to analyze
   * @param {string} moduleName - Module name for context
   * @returns {Object} - Function description
   */
  analyzeFunctionExport(key, fn, moduleName) {
    const analysis = {
      type: 'function',
      key,
      name: fn.name || key,
      length: fn.length // number of parameters
    };

    // Detect React components
    if (this.isReactComponent(key, fn)) {
      analysis.type = 'react-component';
      analysis.subtype = this.getReactComponentType(key);
    }

    // Detect React hooks
    if (this.isReactHook(key)) {
      analysis.type = 'react-hook';
      analysis.returnType = this.inferHookReturnType(key);
    }

    // Detect async functions
    if (fn.constructor.name === 'AsyncFunction') {
      analysis.async = true;
    }

    return analysis;
  }

  /**
   * Analyze an object export
   * @param {string} key - Export key name
   * @param {Object} obj - Object to analyze
   * @param {string} moduleName - Module name for context
   * @returns {Object} - Object description
   */
  analyzeObjectExport(key, obj, moduleName) {
    const analysis = {
      type: 'object',
      key,
      properties: {}
    };

    // Detect React Context
    if (this.isReactContext(key, obj)) {
      analysis.type = 'react-context';
      analysis.hasProvider = 'Provider' in obj;
      analysis.hasConsumer = 'Consumer' in obj;
      analysis.defaultValue = this.inferContextDefaultValue(key, obj);
    }

    // Analyze object properties
    for (const [propKey, propValue] of Object.entries(obj)) {
      analysis.properties[propKey] = this.analyzeExportValue(propKey, propValue, `${moduleName}.${key}`);
    }

    return analysis;
  }

  /**
   * Check if a function is a React component
   * @param {string} key - Export key name
   * @param {Function} fn - Function to check
   * @returns {boolean} - True if it's a React component
   */
  isReactComponent(key, fn) {
    // Check naming conventions
    const nameIndicators = [
      key[0] === key[0].toUpperCase(), // Starts with uppercase
      key.includes('Component'),
      key.includes('Provider'),
      key.includes('Consumer'),
      key.includes('View'),
      key.includes('Screen')
    ];

    // Check if function has JSX-like properties
    const hasReactProperties = fn.prototype && (
      fn.prototype.render ||
      fn.prototype.componentDidMount ||
      fn.prototype.componentWillUnmount
    );

    return nameIndicators.some(Boolean) || hasReactProperties;
  }

  /**
   * Check if a function is a React hook
   * @param {string} key - Export key name
   * @returns {boolean} - True if it's a React hook
   */
  isReactHook(key) {
    return key.startsWith('use') && key.length > 3 && key[3] === key[3].toUpperCase();
  }

  /**
   * Check if an object is a React Context
   * @param {string} key - Export key name
   * @param {Object} obj - Object to check
   * @returns {boolean} - True if it's a React Context
   */
  isReactContext(key, obj) {
    return (
      key.includes('Context') &&
      typeof obj === 'object' &&
      ('Provider' in obj || 'Consumer' in obj || '_currentValue' in obj)
    );
  }

  /**
   * Get React component subtype
   * @param {string} key - Component key name
   * @returns {string} - Component subtype
   */
  getReactComponentType(key) {
    if (key.includes('Provider')) return 'provider';
    if (key.includes('Consumer')) return 'consumer';
    if (key.includes('View')) return 'view';
    if (key.includes('Screen')) return 'screen';
    return 'component';
  }

  /**
   * Infer React hook return type
   * @param {string} key - Hook key name
   * @returns {string} - Inferred return type
   */
  inferHookReturnType(key) {
    if (key.includes('Insets') || key.includes('SafeArea')) {
      return 'insets'; // { top, bottom, left, right }
    }
    if (key.includes('Frame') || key.includes('Dimensions')) {
      return 'dimensions'; // { width, height, x, y }
    }
    if (key.includes('State')) {
      return 'state-tuple'; // [value, setter]
    }
    if (key.includes('Navigation')) {
      return 'navigation-object';
    }
    return 'unknown';
  }

  /**
   * Infer React Context default value
   * @param {string} key - Context key name
   * @param {Object} obj - Context object
   * @returns {*} - Inferred default value
   */
  inferContextDefaultValue(key, obj) {
    if (obj._currentValue !== undefined) {
      return obj._currentValue;
    }
    
    if (key.includes('SafeArea')) {
      return {
        insets: { top: 0, bottom: 0, left: 0, right: 0 },
        frame: { x: 0, y: 0, width: 0, height: 0 }
      };
    }
    
    if (key.includes('Navigation')) {
      return {
        navigate: () => {},
        goBack: () => {},
        canGoBack: () => false
      };
    }
    
    return {};
  }

  /**
   * Analyze source code statically when module can't be loaded
   * @param {string} filePath - Path to source file
   * @param {string} moduleName - Module name
   * @returns {Object} - Interface description
   */
  analyzeSourceCode(filePath, moduleName) {
    try {
      // In web environment or if Node.js operations are not available, provide a basic fallback
      if (typeof window !== 'undefined' || !nodeOps) {
        console.warn(`[InterfaceAnalyzer] Web environment - providing default interface for ${moduleName}`);
        return this.getDefaultInterface(moduleName);
      }
      
      const sourceCode = nodeOps.readFile(filePath);
      
      // Set current path for re-export analysis
      this.currentAnalysisPath = filePath;
      
      // Extract exports from source code
      const exports = this.extractExportsFromSource(sourceCode);
      
      return {
        moduleName,
        exports,
        type: 'module',
        analyzed: 'static'
      };
    } catch (error) {
      console.warn(`[InterfaceAnalyzer] Failed to analyze source code:`, error.message);
      return this.getDefaultInterface(moduleName);
    }
  }

  /**
   * Extract exports from source code using regex
   * @param {string} sourceCode - Source code content
   * @returns {Object} - Extracted exports
   */
  extractExportsFromSource(sourceCode) {
    const exports = {};
    
    // Match CommonJS exports (exports.name = ...)
    const exportsRegex = /exports\.(\w+)\s*=/g;
    let match;
    
    while ((match = exportsRegex.exec(sourceCode)) !== null) {
      const exportName = match[1];
      exports[exportName] = {
        type: this.inferTypeFromName(exportName),
        key: exportName,
        analyzedFrom: 'source'
      };
    }
    
    // Match re-exports pattern: var _Module = require("./Module");
    // Object.keys(_Module).forEach(function (key) { ... exports[key] = _Module[key]; });
    const reExportRegex = /var\s+_(\w+)\s*=\s*require\("\.\/(\w+)"\)/g;
    const reExportFiles = [];
    
    while ((match = reExportRegex.exec(sourceCode)) !== null) {
      const moduleName = match[2];
      reExportFiles.push(moduleName);
    }
    
    // For each re-exported file, try to analyze it (only if nodeOps is available)
    if (nodeOps) {
      for (const fileName of reExportFiles) {
        try {
          const filePath = nodeOps.joinPath(nodeOps.getDirname(this.currentAnalysisPath), `${fileName}.js`);
          if (nodeOps.fileExists(filePath)) {
            const subFileContent = nodeOps.readFile(filePath);
            const subExports = this.extractExportsFromSource(subFileContent);
            Object.assign(exports, subExports);
          }
        } catch (error) {
          console.warn(`[InterfaceAnalyzer] Failed to analyze re-exported file ${fileName}:`, error.message);
        }
      }
    }
    
    // Match ES6 export statements
    const esExportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
    while ((match = esExportRegex.exec(sourceCode)) !== null) {
      const exportName = match[1];
      exports[exportName] = {
        type: this.inferTypeFromName(exportName),
        key: exportName,
        analyzedFrom: 'source'
      };
    }
    
    // Match export default
    const defaultExportRegex = /export\s+default\s+(\w+)/g;
    const defaultMatch = defaultExportRegex.exec(sourceCode);
    if (defaultMatch) {
      exports.default = {
        type: 'unknown',
        key: 'default',
        analyzedFrom: 'source'
      };
    }
    
    return exports;
  }
  
  /**
   * Infer type from export name patterns
   * @param {string} name - Export name
   * @returns {string} - Inferred type
   */
  inferTypeFromName(name) {
    // React hooks
    if (name.startsWith('use') && name.length > 3 && name[3] === name[3].toUpperCase()) {
      return 'react-hook';
    }
    
    // React components
    if (name[0] === name[0].toUpperCase() && (
      name.includes('Provider') || 
      name.includes('Consumer') || 
      name.includes('View') || 
      name.includes('Component') ||
      name.includes('Context')
    )) {
      if (name.includes('Context')) {
        return 'react-context';
      }
      return 'react-component';
    }
    
    // Functions typically start with lowercase
    if (name[0] === name[0].toLowerCase()) {
      return 'function';
    }
    
    return 'unknown';
  }

  /**
   * Get default interface when analysis fails
   * @param {string} moduleName - Module name
   * @returns {Object} - Default interface
   */
  getDefaultInterface(moduleName) {
    // Provide smart defaults for known modules
    const knownModules = {
      'react-native-safe-area-context': {
        exports: {
          SafeAreaProvider: { type: 'react-component', key: 'SafeAreaProvider' },
          SafeAreaView: { type: 'react-component', key: 'SafeAreaView' },
          SafeAreaContext: { type: 'react-context', key: 'SafeAreaContext' },
          SafeAreaInsetsContext: { type: 'react-context', key: 'SafeAreaInsetsContext' },
          SafeAreaFrameContext: { type: 'react-context', key: 'SafeAreaFrameContext' },
          SafeAreaConsumer: { type: 'react-component', key: 'SafeAreaConsumer' },
          useSafeAreaInsets: { type: 'react-hook', key: 'useSafeAreaInsets' },
          useSafeAreaFrame: { type: 'react-hook', key: 'useSafeAreaFrame' },
          useSafeArea: { type: 'react-hook', key: 'useSafeArea' },
          withSafeAreaInsets: { type: 'function', key: 'withSafeAreaInsets' },
          initialWindowSafeAreaInsets: { type: 'function', key: 'initialWindowSafeAreaInsets' },
          initialWindowMetrics: { type: 'function', key: 'initialWindowMetrics' }
        }
      },
      'expo-camera': {
        exports: {
          Camera: { type: 'react-component', key: 'Camera' },
          CameraView: { type: 'react-component', key: 'CameraView' },
          useCameraPermissions: { type: 'react-hook', key: 'useCameraPermissions' },
          useMicrophonePermissions: { type: 'react-hook', key: 'useMicrophonePermissions' }
        }
      },
      'expo-location': {
        exports: {
          requestForegroundPermissionsAsync: { type: 'function', key: 'requestForegroundPermissionsAsync' },
          getCurrentPositionAsync: { type: 'function', key: 'getCurrentPositionAsync' },
          reverseGeocodeAsync: { type: 'function', key: 'reverseGeocodeAsync' },
          Accuracy: { type: 'object', key: 'Accuracy' }
        }
      }
    };
    
    const knownModule = knownModules[moduleName];
    
    return {
      moduleName,
      exports: knownModule ? knownModule.exports : {},
      type: 'module',
      analyzed: 'fallback'
    };
  }
}

module.exports = {
  InterfaceAnalyzer
};