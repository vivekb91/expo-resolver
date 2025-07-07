/**
 * Web-compatible Device Info implementation using Web APIs
 * Compatible with react-native-device-info and expo-device
 */

const DeviceInfo = {
  // Device identification
  getDeviceId() {
    return Promise.resolve('web-device');
  },

  getUniqueId() {
    // Generate a persistent unique ID for the browser
    let uniqueId = localStorage.getItem('__device_unique_id');
    if (!uniqueId) {
      uniqueId = 'web-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('__device_unique_id', uniqueId);
    }
    return Promise.resolve(uniqueId);
  },

  getDeviceName() {
    return Promise.resolve('Web Browser');
  },

  getSystemName() {
    return Promise.resolve('Web');
  },

  getSystemVersion() {
    return Promise.resolve(navigator.userAgent);
  },

  getBrand() {
    return Promise.resolve('Browser');
  },

  getModel() {
    return Promise.resolve('Web');
  },

  // App information
  getApplicationName() {
    return Promise.resolve(document.title || 'Web App');
  },

  getBuildNumber() {
    return Promise.resolve('1');
  },

  getVersion() {
    return Promise.resolve('1.0.0');
  },

  getBundleId() {
    return Promise.resolve(window.location.hostname);
  },

  // System information
  isTablet() {
    return Promise.resolve(false);
  },

  isEmulator() {
    return Promise.resolve(false);
  },

  getDeviceType() {
    return Promise.resolve('web');
  },

  // Network information
  getCarrier() {
    return Promise.resolve('Unknown');
  },

  // Battery information
  getBatteryLevel() {
    return new Promise((resolve) => {
      if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
          resolve(battery.level);
        }).catch(() => {
          resolve(-1);
        });
      } else {
        resolve(-1);
      }
    });
  },

  isBatteryCharging() {
    return new Promise((resolve) => {
      if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
          resolve(battery.charging);
        }).catch(() => {
          resolve(false);
        });
      } else {
        resolve(false);
      }
    });
  },

  // Storage information
  getTotalDiskCapacity() {
    return new Promise((resolve) => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
          resolve(estimate.quota || -1);
        }).catch(() => {
          resolve(-1);
        });
      } else {
        resolve(-1);
      }
    });
  },

  getFreeDiskStorage() {
    return new Promise((resolve) => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
          const free = (estimate.quota || 0) - (estimate.usage || 0);
          resolve(free);
        }).catch(() => {
          resolve(-1);
        });
      } else {
        resolve(-1);
      }
    });
  },

  // Memory information
  getTotalMemory() {
    return Promise.resolve(navigator.deviceMemory ? navigator.deviceMemory * 1024 * 1024 * 1024 : -1);
  },

  getUsedMemory() {
    return Promise.resolve(-1);
  },

  // Power state
  getPowerState() {
    return new Promise((resolve) => {
      if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
          resolve({
            batteryLevel: battery.level,
            batteryState: battery.charging ? 'charging' : 'unplugged',
            lowPowerMode: false
          });
        }).catch(() => {
          resolve({
            batteryLevel: -1,
            batteryState: 'unknown',
            lowPowerMode: false
          });
        });
      } else {
        resolve({
          batteryLevel: -1,
          batteryState: 'unknown',
          lowPowerMode: false
        });
      }
    });
  },

  // Expo Device compatibility
  get deviceType() {
    return Promise.resolve('DESKTOP');
  },

  get isDevice() {
    return Promise.resolve(true);
  },

  get deviceName() {
    return Promise.resolve('Web Browser');
  },

  get osName() {
    return Promise.resolve('Web');
  },

  get osVersion() {
    return Promise.resolve('1.0');
  },

  get platformApiLevel() {
    return Promise.resolve(null);
  },

  get modelName() {
    return Promise.resolve('Web');
  },

  get modelId() {
    return Promise.resolve('web-model');
  },

  get designName() {
    return Promise.resolve('Web');
  },

  get productName() {
    return Promise.resolve('Web');
  },

  get deviceYearClass() {
    return Promise.resolve(new Date().getFullYear());
  },

  get totalMemory() {
    return Promise.resolve(navigator.deviceMemory ? navigator.deviceMemory * 1024 * 1024 * 1024 : -1);
  },

  get supportedCpuArchitectures() {
    return Promise.resolve(['x64']);
  },

  get manufacturer() {
    return Promise.resolve('Browser');
  }
};

export default DeviceInfo;