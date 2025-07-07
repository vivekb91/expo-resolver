/**
 * Web-compatible Location implementation using Geolocation API
 * Compatible with expo-location and react-native-geolocation
 */

const Location = {
  Accuracy: {
    Lowest: 1,
    Low: 2,
    Balanced: 3,
    High: 4,
    Highest: 5,
    BestForNavigation: 6
  },

  LocationAccuracy: {
    Lowest: 1,
    Low: 2,
    Balanced: 3,
    High: 4,
    Highest: 5,
    BestForNavigation: 6
  },

  async requestForegroundPermissionsAsync() {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      return { status: 'granted', granted: true };
    } catch (error) {
      return { status: 'denied', granted: false };
    }
  },

  async requestBackgroundPermissionsAsync() {
    console.warn('Background location permissions not supported in web environment');
    return { status: 'denied', granted: false };
  },

  async getForegroundPermissionsAsync() {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return {
        status: result.state === 'granted' ? 'granted' : 'denied',
        granted: result.state === 'granted'
      };
    } catch (error) {
      return { status: 'undetermined', granted: false };
    }
  },

  async getBackgroundPermissionsAsync() {
    console.warn('Background location permissions not supported in web environment');
    return { status: 'denied', granted: false };
  },

  async getCurrentPositionAsync(options = {}) {
    return new Promise((resolve, reject) => {
      const geolocationOptions = {
        enableHighAccuracy: options.accuracy === Location.Accuracy.High || options.accuracy === Location.Accuracy.Highest,
        timeout: options.timeout || 10000,
        maximumAge: options.maximumAge || 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              altitude: position.coords.altitude,
              accuracy: position.coords.accuracy,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed
            },
            timestamp: position.timestamp
          });
        },
        (error) => {
          reject(new Error(`Location error: ${error.message}`));
        },
        geolocationOptions
      );
    });
  },

  async watchPositionAsync(options = {}, callback) {
    const geolocationOptions = {
      enableHighAccuracy: options.accuracy === Location.Accuracy.High || options.accuracy === Location.Accuracy.Highest,
      timeout: options.timeout || 10000,
      maximumAge: options.maximumAge || 0
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        callback({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed
          },
          timestamp: position.timestamp
        });
      },
      (error) => {
        callback({ error: error.message });
      },
      geolocationOptions
    );

    return {
      remove: () => {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  },

  async reverseGeocodeAsync(location) {
    console.warn('Reverse geocoding requires a third-party service in web environment');
    return [];
  },

  async geocodeAsync(address) {
    console.warn('Geocoding requires a third-party service in web environment');
    return [];
  },

  async hasServicesEnabledAsync() {
    return 'geolocation' in navigator;
  },

  async isBackgroundLocationAvailableAsync() {
    return false;
  },

  async startLocationUpdatesAsync(taskName, options) {
    console.warn('Background location updates not supported in web environment');
    return Promise.resolve();
  },

  async stopLocationUpdatesAsync(taskName) {
    console.warn('Background location updates not supported in web environment');
    return Promise.resolve();
  }
};

export default Location;