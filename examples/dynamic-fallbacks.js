/**
 * Dynamic Fallback Examples
 * 
 * Shows how to create intelligent fallbacks that adapt to browser capabilities
 * and provide progressive enhancement for web platforms.
 */

const { applyAutoWrapperPlugin } = require('../metro-runtime-integration/simple-auto-wrapper');

// Example 1: Camera with Progressive Web App Support
const cameraFallback = {
  'takePicture': function(error, args, methodName) {
    const [options = {}] = args;
    
    // Check for different web camera APIs in order of preference
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // Modern getUserMedia API
      return navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: options.width || 640, 
          height: options.height || 480 
        } 
      }).then(stream => {
        console.log('Using modern camera API');
        return {
          uri: 'camera-stream',
          stream: stream,
          width: options.width || 640,
          height: options.height || 480
        };
      }).catch(err => {
        console.warn('Camera access denied, falling back to file input');
        return createFileInputFallback(options);
      });
    } 
    else if (navigator.getUserMedia) {
      // Legacy getUserMedia API
      return new Promise((resolve, reject) => {
        navigator.getUserMedia(
          { video: true },
          stream => {
            console.log('Using legacy camera API');
            resolve({
              uri: 'camera-stream-legacy',
              stream: stream
            });
          },
          err => {
            console.warn('Legacy camera failed, using file input');
            resolve(createFileInputFallback(options));
          }
        );
      });
    } 
    else {
      // No camera API available - file input fallback
      console.warn('No camera API available, using file input');
      return createFileInputFallback(options);
    }
  }
};

// Helper function for file input fallback
function createFileInputFallback(options) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use rear camera on mobile
    
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            uri: e.target.result,
            type: 'file',
            name: file.name,
            size: file.size
          });
        };
        reader.readAsDataURL(file);
      } else {
        resolve(null);
      }
    };
    
    input.click();
  });
}

// Example 2: Location with Multiple Fallback Strategies
const locationFallback = {
  'getCurrentPositionAsync': function(error, args) {
    const [options = {}] = args;
    
    // Progressive fallback strategy
    return attemptHighAccuracyLocation(options)
      .catch(() => attemptStandardLocation(options))
      .catch(() => attemptIPLocation(options))
      .catch(() => attemptLocalStorageLocation())
      .catch(() => {
        console.warn('All location methods failed');
        return Promise.reject(new Error('Location not available'));
      });
  },
  
  'watchPositionAsync': function(error, args) {
    const [options = {}, callback] = args;
    
    if (navigator.geolocation && navigator.geolocation.watchPosition) {
      let watchId;
      
      // Try high accuracy first, fallback to standard
      const tryWatch = (useHighAccuracy) => {
        watchId = navigator.geolocation.watchPosition(
          position => {
            callback({
              coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                heading: position.coords.heading,
                speed: position.coords.speed
              },
              timestamp: position.timestamp
            });
          },
          error => {
            if (useHighAccuracy) {
              console.warn('High accuracy failed, trying standard accuracy');
              tryWatch(false);
            } else {
              console.error('Location watch failed:', error);
              callback(null);
            }
          },
          {
            enableHighAccuracy: useHighAccuracy,
            timeout: options.timeout || 10000,
            maximumAge: options.maximumAge || 60000
          }
        );
      };
      
      tryWatch(true);
      
      return {
        remove: () => {
          if (watchId) {
            navigator.geolocation.clearWatch(watchId);
          }
        }
      };
    }
    
    return Promise.reject(new Error('Location watching not supported'));
  }
};

// Location helper functions
function attemptHighAccuracyLocation(options) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      position => {
        console.log('Using high accuracy GPS');
        resolve(formatLocationResult(position));
      },
      error => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 30000
      }
    );
  });
}

function attemptStandardLocation(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      position => {
        console.log('Using standard accuracy GPS');
        resolve(formatLocationResult(position));
      },
      error => reject(error),
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

function attemptIPLocation(options) {
  // Use IP-based geolocation as fallback
  return fetch('https://ipapi.co/json/')
    .then(response => response.json())
    .then(data => {
      console.log('Using IP-based location');
      return {
        coords: {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: 10000, // Low accuracy for IP location
          altitude: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      };
    });
}

function attemptLocalStorageLocation() {
  // Use cached location from localStorage
  const cached = localStorage.getItem('lastKnownLocation');
  if (cached) {
    const location = JSON.parse(cached);
    const age = Date.now() - location.timestamp;
    
    // Use cached location if less than 1 hour old
    if (age < 3600000) {
      console.log('Using cached location');
      return Promise.resolve(location);
    }
  }
  
  return Promise.reject(new Error('No cached location available'));
}

function formatLocationResult(position) {
  const result = {
    coords: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      heading: position.coords.heading,
      speed: position.coords.speed
    },
    timestamp: position.timestamp
  };
  
  // Cache the location
  localStorage.setItem('lastKnownLocation', JSON.stringify(result));
  
  return result;
}

// Example 3: Share with Progressive Enhancement
const shareFallback = {
  'open': function(error, args) {
    const [options = {}] = args;
    
    // Try Web Share API first
    if (navigator.share) {
      return navigator.share({
        title: options.title,
        text: options.message,
        url: options.url
      }).then(() => {
        console.log('Content shared via Web Share API');
      }).catch(err => {
        console.warn('Web Share API failed, trying fallback');
        return attemptClipboardShare(options);
      });
    }
    
    // Fallback to clipboard
    return attemptClipboardShare(options);
  }
};

function attemptClipboardShare(options) {
  const textToShare = [
    options.title,
    options.message,
    options.url
  ].filter(Boolean).join('\n');
  
  // Try modern clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(textToShare).then(() => {
      console.log('Content copied to clipboard');
      showShareNotification('Content copied to clipboard!');
    });
  }
  
  // Fallback to legacy clipboard
  return new Promise((resolve) => {
    const textarea = document.createElement('textarea');
    textarea.value = textToShare;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      console.log('Content copied using legacy method');
      showShareNotification('Content copied to clipboard!');
      resolve();
    } catch (err) {
      console.error('Copy failed:', err);
      showShareNotification('Copy failed. Please copy manually.');
      resolve();
    } finally {
      document.body.removeChild(textarea);
    }
  });
}

function showShareNotification(message) {
  // Create a simple notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// Example 4: Storage with Feature Detection
const storageFallback = {
  'getItem': function(error, args) {
    const [key] = args;
    
    // Try localStorage first
    if (isStorageAvailable('localStorage')) {
      return Promise.resolve(localStorage.getItem(key));
    }
    
    // Fallback to sessionStorage
    if (isStorageAvailable('sessionStorage')) {
      console.warn('localStorage not available, using sessionStorage');
      return Promise.resolve(sessionStorage.getItem(key));
    }
    
    // Fallback to in-memory storage
    console.warn('No web storage available, using memory');
    return Promise.resolve(getFromMemoryStorage(key));
  },
  
  'setItem': function(error, args) {
    const [key, value] = args;
    
    if (isStorageAvailable('localStorage')) {
      localStorage.setItem(key, value);
      return Promise.resolve();
    }
    
    if (isStorageAvailable('sessionStorage')) {
      sessionStorage.setItem(key, value);
      return Promise.resolve();
    }
    
    setInMemoryStorage(key, value);
    return Promise.resolve();
  }
};

// Storage helper functions
function isStorageAvailable(type) {
  try {
    const storage = window[type];
    const test = '__storage_test__';
    storage.setItem(test, test);
    storage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

const memoryStorage = {};
function getFromMemoryStorage(key) {
  return memoryStorage[key] || null;
}

function setInMemoryStorage(key, value) {
  memoryStorage[key] = value;
}

// Example 5: Device Info with Browser Detection
const deviceInfoFallback = {
  'getDeviceId': function(error, args) {
    // Try to generate a persistent device ID
    let deviceId = localStorage.getItem('web_device_id');
    
    if (!deviceId) {
      // Generate based on browser fingerprint
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
      
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL()
      ].join('|');
      
      // Create hash of fingerprint
      deviceId = 'web_' + btoa(fingerprint).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
      localStorage.setItem('web_device_id', deviceId);
    }
    
    return Promise.resolve(deviceId);
  },
  
  'getSystemVersion': function(error, args) {
    const userAgent = navigator.userAgent;
    let osVersion = 'Unknown';
    
    // Detect OS and version
    if (userAgent.includes('Windows NT')) {
      const match = userAgent.match(/Windows NT (\d+\.\d+)/);
      osVersion = match ? `Windows ${match[1]}` : 'Windows';
    } else if (userAgent.includes('Mac OS X')) {
      const match = userAgent.match(/Mac OS X (\d+[._]\d+[._]\d+)/);
      osVersion = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
    } else if (userAgent.includes('Linux')) {
      osVersion = 'Linux';
    } else if (userAgent.includes('Android')) {
      const match = userAgent.match(/Android (\d+\.\d+)/);
      osVersion = match ? `Android ${match[1]}` : 'Android';
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      const match = userAgent.match(/OS (\d+_\d+)/);
      osVersion = match ? `iOS ${match[1].replace('_', '.')}` : 'iOS';
    }
    
    return Promise.resolve(osVersion);
  }
};

// Metro configuration with dynamic fallbacks
const metroConfigWithDynamicFallbacks = applyAutoWrapperPlugin(config, {
  modules: [
    'react-native-camera',
    'expo-location',
    'react-native-share',
    '@react-native-async-storage/async-storage',
    'react-native-device-info'
  ],
  
  platforms: ['web', 'dom'],
  
  resolverConfig: {
    logging: true,
    logLevel: 'warn',
    fallbackStrategy: 'graceful',
    
    modules: {
      'react-native-camera': {
        fallback: cameraFallback
      },
      
      'expo-location': {
        fallback: locationFallback
      },
      
      'react-native-share': {
        fallback: shareFallback
      },
      
      '@react-native-async-storage/async-storage': {
        fallback: storageFallback
      },
      
      'react-native-device-info': {
        fallback: deviceInfoFallback
      }
    }
  }
});

// Example usage in your app (this code doesn't need to change!)
function ExampleUsage() {
  // These will automatically use the dynamic fallbacks on web
  
  // Camera - will try getUserMedia, then file input
  Camera.takePicture().then(result => {
    console.log('Camera result:', result);
  });
  
  // Location - will try high accuracy, then standard, then IP, then cached
  Location.getCurrentPositionAsync().then(position => {
    console.log('Location:', position);
  });
  
  // Share - will try Web Share API, then clipboard
  Share.open({
    title: 'Check this out!',
    message: 'Amazing content to share',
    url: 'https://example.com'
  });
  
  // Storage - will try localStorage, then sessionStorage, then memory
  AsyncStorage.setItem('key', 'value');
  AsyncStorage.getItem('key').then(value => {
    console.log('Stored value:', value);
  });
}

module.exports = {
  cameraFallback,
  locationFallback,
  shareFallback,
  storageFallback,
  deviceInfoFallback,
  metroConfigWithDynamicFallbacks
};