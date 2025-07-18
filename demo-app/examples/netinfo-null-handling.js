/**
 * Example: Handling NetInfo null/undefined properties
 * 
 * This example demonstrates how the runtime resolver handles cases where
 * NetInfo.NetInfoStateType is null/undefined, preventing runtime errors
 * when accessing NetInfo.NetInfoStateType.none
 */

const { createRuntimeResolver } = require('../runtime-resolver/src');

// Create resolver with NetInfo-specific configuration
const resolver = createRuntimeResolver({
  platform: 'web',
  fallbackStrategy: 'graceful',
  logging: true,
  logLevel: 'warn',
  
  // Module-specific configuration
  modules: {
    '@react-native-community/netinfo': {
      // Custom handling for NetInfo module
      handleNullProperties: true,
      fallbacks: {
        // Fallback for when NetInfoStateType is null
        'NetInfoStateType': {
          none: 'none',
          unknown: 'unknown',
          cellular: 'cellular',
          wifi: 'wifi',
          bluetooth: 'bluetooth',
          ethernet: 'ethernet',
          wimax: 'wimax',
          vpn: 'vpn',
          other: 'other'
        }
      }
    }
  }
});

// Simulate NetInfo import where NetInfoStateType is null
async function demonstrateNetInfoHandling() {
  console.log('=== NetInfo Null Property Handling Demo ===\n');
  
  try {
    // Simulate importing NetInfo where NetInfoStateType is null
    const originalNetInfo = {
      fetch: () => Promise.resolve({ type: 'wifi', isConnected: true }),
      addEventListener: () => () => {},
      NetInfoStateType: null,  // This is null, causing the original error
      NetInfoCellularGeneration: undefined  // This is undefined
    };
    
    // Wrap NetInfo with runtime resolver
    const NetInfo = resolver.resolve('@react-native-community/netinfo', originalNetInfo);
    
    console.log('1. Testing NetInfo.NetInfoStateType.none access:');
    console.log('   NetInfo.NetInfoStateType:', NetInfo.NetInfoStateType);
    console.log('   NetInfo.NetInfoStateType.none:', NetInfo.NetInfoStateType.none);
    
    console.log('\n2. Testing comparison that would originally fail:');
    const connectionType = 'none';
    const isNoneConnection = connectionType === NetInfo.NetInfoStateType.none;
    console.log('   connectionType === NetInfo.NetInfoStateType.none:', isNoneConnection);
    
    console.log('\n3. Testing other state types:');
    console.log('   NetInfo.NetInfoStateType.wifi:', NetInfo.NetInfoStateType.wifi);
    console.log('   NetInfo.NetInfoStateType.cellular:', NetInfo.NetInfoStateType.cellular);
    
    console.log('\n4. Testing NetInfo methods still work:');
    const netState = await NetInfo.fetch();
    console.log('   NetInfo.fetch() result:', netState);
    
    console.log('\n5. Testing nested null handling:');
    console.log('   NetInfo.NetInfoCellularGeneration:', NetInfo.NetInfoCellularGeneration);
    console.log('   NetInfo.NetInfoCellularGeneration.4g:', NetInfo.NetInfoCellularGeneration['4g']);
    
    console.log('\n✅ All NetInfo operations completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during NetInfo handling:', error.message);
  }
}

// Run the demonstration
demonstrateNetInfoHandling().catch(console.error);

// Export for use in other examples
module.exports = {
  demonstrateNetInfoHandling,
  resolver
};