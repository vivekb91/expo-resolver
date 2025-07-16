
// Auto-generated interface-based runtime wrapper for react-native-share
const { createRuntimeResolver } = require('../runtime-resolver/src/index');
const { InterfaceAnalyzer } = require('../runtime-resolver/src/interface-analyzer');
const { WrapperGenerator } = require('../runtime-resolver/src/wrapper-generator');

console.log('[Interface Wrapper] Loading interface-based wrapper for react-native-share');

const resolver = createRuntimeResolver({
  logging: true,
  logLevel: 'warn',
  fallbackStrategy: 'graceful'
});

let wrappedModule = {};

try {
  // Try to require the original module
  const originalModule = require('react-native-share');
  
  // Wrap it with runtime resolver
  wrappedModule = resolver.resolve('react-native-share', originalModule);
  
  console.log('[Interface Wrapper] Successfully wrapped react-native-share');
  
} catch (error) {
  console.warn('[Interface Wrapper] Failed to load react-native-share:', error.message);
  
  // Use interface analysis to create intelligent fallbacks
  const analyzer = new InterfaceAnalyzer();
  const generator = new WrapperGenerator({
    info: (msg) => console.log('[Interface Wrapper]', msg),
    warn: (msg) => console.warn('[Interface Wrapper]', msg)
  });
  
  try {
    // Try interface analysis only in Node.js environment
    if (typeof process !== 'undefined' && process.platform) {
      // Analyze the module interface
      const moduleInterface = analyzer.analyzeModuleInterface('react-native-share', process.cwd());
      
      // Generate wrapper based on interface analysis
      const interfaceWrapper = generator.generateWrapper(moduleInterface);
      
      console.log('[Interface Wrapper] Generated interface-based wrapper for react-native-share');
      console.log('[Interface Wrapper] Detected exports:', Object.keys(moduleInterface.exports));
      
      // Wrap the interface-based fallback with runtime resolver
      wrappedModule = resolver.resolve('react-native-share', interfaceWrapper);
    } else {
      // Web environment - use basic fallback
      console.log('[Interface Wrapper] Web environment - using basic fallback for react-native-share');
      wrappedModule = resolver.resolve('react-native-share', {});
    }
    
  } catch (analysisError) {
    console.warn('[Interface Wrapper] Interface analysis failed:', analysisError.message);
    
    // Ultimate fallback - empty object
    wrappedModule = resolver.resolve('react-native-share', {});
  }
}

module.exports = wrappedModule;
