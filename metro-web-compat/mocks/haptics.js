/**
 * Web-compatible Haptics implementation using Vibration API
 * Compatible with expo-haptics and react-native-haptic-feedback
 */

const Haptics = {
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy'
  },

  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error'
  },

  async impactAsync(style = 'medium') {
    try {
      if ('vibrate' in navigator) {
        const duration = {
          light: 50,
          medium: 100,
          heavy: 200
        }[style] || 100;
        
        navigator.vibrate(duration);
        return Promise.resolve();
      } else {
        console.warn('Vibration not supported in this browser');
        return Promise.resolve();
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error.message);
      return Promise.resolve();
    }
  },

  async notificationAsync(type = 'success') {
    try {
      if ('vibrate' in navigator) {
        const pattern = {
          success: [100, 50, 100],
          warning: [200, 100, 200],
          error: [300, 100, 300, 100, 300]
        }[type] || [100];
        
        navigator.vibrate(pattern);
        return Promise.resolve();
      } else {
        console.warn('Vibration not supported in this browser');
        return Promise.resolve();
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error.message);
      return Promise.resolve();
    }
  },

  async selectionAsync() {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(25);
        return Promise.resolve();
      } else {
        console.warn('Vibration not supported in this browser');
        return Promise.resolve();
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error.message);
      return Promise.resolve();
    }
  },

  // Legacy react-native-haptic-feedback compatibility
  trigger(type, options = {}) {
    const typeMap = {
      impactLight: () => this.impactAsync('light'),
      impactMedium: () => this.impactAsync('medium'),
      impactHeavy: () => this.impactAsync('heavy'),
      notificationSuccess: () => this.notificationAsync('success'),
      notificationWarning: () => this.notificationAsync('warning'),
      notificationError: () => this.notificationAsync('error'),
      selection: () => this.selectionAsync()
    };

    const action = typeMap[type];
    if (action) {
      return action();
    } else {
      console.warn(`Unknown haptic feedback type: ${type}`);
      return Promise.resolve();
    }
  }
};

export default Haptics;