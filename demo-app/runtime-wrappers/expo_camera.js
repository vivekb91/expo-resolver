
// Auto-generated interface-based runtime wrapper for expo-camera
const { createRuntimeResolver } = require('../runtime-resolver/src/index');
const { InterfaceAnalyzer } = require('../runtime-resolver/src/interface-analyzer');
const { WrapperGenerator } = require('../runtime-resolver/src/wrapper-generator');

console.log('[Interface Wrapper] Loading interface-based wrapper for expo-camera');

const resolver = createRuntimeResolver({
  logging: true,
  logLevel: 'warn',
  fallbackStrategy: 'graceful'
});

let wrappedModule = {};

try {
  // Try to require the original module
  const originalModule = require('expo-camera');
  
  // Wrap it with runtime resolver
  wrappedModule = resolver.resolve('expo-camera', originalModule);
  
  console.log('[Interface Wrapper] Successfully wrapped expo-camera');
  
} catch (error) {
  console.warn('[Interface Wrapper] Failed to load expo-camera:', error.message);
  
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
      const moduleInterface = analyzer.analyzeModuleInterface('expo-camera', process.cwd());
      
      // Generate wrapper based on interface analysis
      const interfaceWrapper = generator.generateWrapper(moduleInterface);
      
      console.log('[Interface Wrapper] Generated interface-based wrapper for expo-camera');
      console.log('[Interface Wrapper] Detected exports:', Object.keys(moduleInterface.exports));
      
      // Wrap the interface-based fallback with runtime resolver
      wrappedModule = resolver.resolve('expo-camera', interfaceWrapper);
    } else {
      // Web environment - use basic fallback
      console.log('[Interface Wrapper] Web environment - using basic fallback for expo-camera');
      wrappedModule = resolver.resolve('expo-camera', {});
    }
    
  } catch (analysisError) {
    console.warn('[Interface Wrapper] Interface analysis failed:', analysisError.message);
    
    // Ultimate fallback - empty object
    wrappedModule = resolver.resolve('expo-camera', {});
  }
}

module.exports = wrappedModule;
