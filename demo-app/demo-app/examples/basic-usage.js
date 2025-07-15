/**
 * Basic Usage Examples for React Native Web Runtime Resolver
 */

import { createRuntimeResolver } from 'react-native-web-runtime-resolver';

// Example 1: Simple module wrapping
function example1() {
  const resolver = createRuntimeResolver();
  
  // Import your module normally
  import('react-native-camera').then(CameraModule => {
    // Wrap it with the resolver
    const Camera = resolver.resolve('react-native-camera', CameraModule);
    
    // Use it safely - won't crash on web
    Camera.takePicture()
      .then(data => console.log('Picture taken:', data))
      .catch(error => console.log('Graceful fallback:', error.message));
  });
}

// Example 2: Async import wrapping
async function example2() {
  const resolver = createRuntimeResolver();
  
  // Wrap async import directly
  const Location = await resolver.wrapImport(
    'expo-location',
    () => import('expo-location')
  );
  
  // Use with built-in web fallbacks
  try {
    const position = await Location.getCurrentPositionAsync();
    console.log('Location:', position.coords);
  } catch (error) {
    console.log('Location not available:', error.message);
  }
}

// Example 3: Configuration with custom fallbacks
function example3() {
  const resolver = createRuntimeResolver({
    logging: true,
    logLevel: 'warn',
    
    modules: {
      'react-native-haptics': {
        fallback: {
          'impactAsync': (error, args) => {
            const [style] = args;
            
            // Custom web implementation
            if (navigator.vibrate) {
              const duration = style === 'heavy' ? 200 : 100;
              navigator.vibrate(duration);
            }
            
            return Promise.resolve();
          }
        }
      }
    }
  });
  
  // Import and wrap
  import('react-native-haptics').then(Haptics => {
    const HapticsWrapped = resolver.resolve('react-native-haptics', Haptics);
    
    // This will use web vibration API if available
    HapticsWrapped.impactAsync('heavy');
  });
}

// Example 4: Multiple modules with shared resolver
function example4() {
  const resolver = createRuntimeResolver({
    fallbackStrategy: 'graceful',
    logging: true
  });
  
  // Wrap multiple modules
  Promise.all([
    resolver.wrapImport('react-native-camera', () => import('react-native-camera')),
    resolver.wrapImport('expo-location', () => import('expo-location')),
    resolver.wrapImport('react-native-share', () => import('react-native-share'))
  ]).then(([Camera, Location, Share]) => {
    // All modules now have graceful web fallbacks
    
    // Camera - will log warning on web
    Camera.takePicture();
    
    // Location - will use navigator.geolocation
    Location.getCurrentPositionAsync();
    
    // Share - will use navigator.share or clipboard
    Share.open({ message: 'Hello from web!' });
  });
}

// Example 5: Component integration
import React, { useState, useEffect } from 'react';
import { createRuntimeResolver } from 'react-native-web-runtime-resolver';

const resolver = createRuntimeResolver();

function CameraComponent() {
  const [Camera, setCamera] = useState(null);
  
  useEffect(() => {
    // Load camera module with runtime resolution
    resolver.wrapImport('react-native-camera', () => import('react-native-camera'))
      .then(setCamera);
  }, []);
  
  const takePicture = async () => {
    if (Camera) {
      try {
        const data = await Camera.takePicture();
        console.log('Picture taken:', data);
      } catch (error) {
        console.log('Camera not available on web:', error.message);
        // Show file input fallback or other UI
      }
    }
  };
  
  return (
    <div>
      <button onClick={takePicture}>
        Take Picture
      </button>
    </div>
  );
}

// Example 6: Custom hook for resolver
function useRuntimeModule(moduleName, importFn) {
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const resolver = createRuntimeResolver();
    
    resolver.wrapImport(moduleName, importFn)
      .then(resolvedModule => {
        setModule(resolvedModule);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [moduleName]);
  
  return { module, loading, error };
}

// Usage of custom hook
function LocationComponent() {
  const { module: Location, loading, error } = useRuntimeModule(
    'expo-location',
    () => import('expo-location')
  );
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  const getLocation = async () => {
    if (Location) {
      try {
        const position = await Location.getCurrentPositionAsync();
        console.log('Location:', position);
      } catch (err) {
        console.log('Location failed:', err.message);
      }
    }
  };
  
  return (
    <div>
      <button onClick={getLocation}>
        Get Location
      </button>
    </div>
  );
}

export {
  example1,
  example2,
  example3,
  example4,
  CameraComponent,
  LocationComponent,
  useRuntimeModule
};