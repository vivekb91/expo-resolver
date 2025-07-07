/**
 * Web-compatible AsyncStorage implementation using localStorage
 * Compatible with @react-native-async-storage/async-storage
 */

const AsyncStorage = {
  getItem: (key) => {
    try {
      const value = localStorage.getItem(key);
      return Promise.resolve(value);
    } catch (error) {
      return Promise.reject(error);
    }
  },

  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  },

  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  },

  getAllKeys: () => {
    try {
      const keys = Object.keys(localStorage);
      return Promise.resolve(keys);
    } catch (error) {
      return Promise.reject(error);
    }
  },

  multiGet: (keys) => {
    try {
      const result = keys.map(key => [key, localStorage.getItem(key)]);
      return Promise.resolve(result);
    } catch (error) {
      return Promise.reject(error);
    }
  },

  multiSet: (keyValuePairs) => {
    try {
      keyValuePairs.forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  },

  multiRemove: (keys) => {
    try {
      keys.forEach(key => {
        localStorage.removeItem(key);
      });
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }
};

export default AsyncStorage;