const BUILT_IN_MAPPINGS = {
  // React Native AsyncStorage -> Web Storage
  '@react-native-async-storage/async-storage': 'metro-web-compat/mocks/async-storage',
  '@react-native-community/async-storage': 'metro-web-compat/mocks/async-storage',
  
  // Expo Camera -> Web Camera
  'expo-camera': 'metro-web-compat/mocks/camera',
  'react-native-camera': 'metro-web-compat/mocks/camera',
  'react-native-vision-camera': 'metro-web-compat/mocks/vision-camera',
  
  // Location Services
  'expo-location': 'metro-web-compat/mocks/location',
  'react-native-geolocation-service': 'metro-web-compat/mocks/location',
  '@react-native-community/geolocation': 'metro-web-compat/mocks/location',
  
  // File System
  'expo-file-system': 'metro-web-compat/mocks/file-system',
  'react-native-fs': 'metro-web-compat/mocks/file-system',
  
  // Device Info
  'react-native-device-info': 'metro-web-compat/mocks/device-info',
  'expo-device': 'metro-web-compat/mocks/device-info',
  'expo-constants': 'metro-web-compat/mocks/device-info',
  
  // Haptics & Vibration
  'expo-haptics': 'metro-web-compat/mocks/haptics',
  'react-native-haptic-feedback': 'metro-web-compat/mocks/haptics',
  
  // Share
  'react-native-share': 'metro-web-compat/mocks/share',
  'expo-sharing': 'metro-web-compat/mocks/share',
  
  // Clipboard
  '@react-native-clipboard/clipboard': 'metro-web-compat/mocks/clipboard',
  '@react-native-community/clipboard': 'metro-web-compat/mocks/clipboard',
  'expo-clipboard': 'metro-web-compat/mocks/clipboard',
  
  // Permissions
  'expo-permissions': 'metro-web-compat/mocks/permissions',
  'react-native-permissions': 'metro-web-compat/mocks/permissions',
  
  // Notifications
  'expo-notifications': 'metro-web-compat/mocks/notifications',
  '@react-native-community/push-notification-ios': 'metro-web-compat/mocks/notifications',
  'react-native-push-notification': 'metro-web-compat/mocks/notifications',
  
  // Contacts
  'expo-contacts': 'metro-web-compat/mocks/contacts',
  'react-native-contacts': 'metro-web-compat/mocks/contacts',
  
  // Calendar
  'expo-calendar': 'metro-web-compat/mocks/calendar',
  'react-native-calendar-events': 'metro-web-compat/mocks/calendar',
  
  // Image Picker
  'expo-image-picker': 'metro-web-compat/mocks/image-picker',
  'react-native-image-picker': 'metro-web-compat/mocks/image-picker',
  'react-native-image-crop-picker': 'metro-web-compat/mocks/image-picker',
  
  // Document Picker
  'expo-document-picker': 'metro-web-compat/mocks/document-picker',
  'react-native-document-picker': 'metro-web-compat/mocks/document-picker',
  
  // QR Code / Barcode
  'expo-barcode-scanner': 'metro-web-compat/mocks/barcode-scanner',
  'react-native-qrcode-scanner': 'metro-web-compat/mocks/barcode-scanner',
  
  // Audio
  'expo-av': 'metro-web-compat/mocks/audio-video',
  'react-native-sound': 'metro-web-compat/mocks/audio',
  'react-native-track-player': 'metro-web-compat/mocks/audio',
  
  // Video
  'react-native-video': 'metro-web-compat/mocks/video',
  'expo-video': 'metro-web-compat/mocks/video',
  
  // Maps
  'react-native-maps': 'metro-web-compat/mocks/maps',
  'expo-location': 'metro-web-compat/mocks/maps',
  
  // Sensors
  'expo-sensors': 'metro-web-compat/mocks/sensors',
  'react-native-sensors': 'metro-web-compat/mocks/sensors',
  
  // Bluetooth
  'react-native-bluetooth-serial': 'metro-web-compat/mocks/bluetooth',
  'react-native-ble-plx': 'metro-web-compat/mocks/bluetooth',
  
  // NFC
  'react-native-nfc-manager': 'metro-web-compat/mocks/nfc',
  
  // Biometrics
  'react-native-biometrics': 'metro-web-compat/mocks/biometrics',
  'expo-local-authentication': 'metro-web-compat/mocks/biometrics',
  
  // Keychain
  'react-native-keychain': 'metro-web-compat/mocks/keychain',
  'expo-secure-store': 'metro-web-compat/mocks/keychain',
  
  // Network Info
  '@react-native-community/netinfo': 'metro-web-compat/mocks/network-info',
  
  // App State
  '@react-native-community/app-state': 'metro-web-compat/mocks/app-state',
  
  // Linking
  'expo-linking': 'metro-web-compat/mocks/linking',
  
  // Web Browser
  'expo-web-browser': 'metro-web-compat/mocks/web-browser',
  
  // Mail Composer
  'expo-mail-composer': 'metro-web-compat/mocks/mail-composer',
  
  // SMS
  'expo-sms': 'metro-web-compat/mocks/sms',
  
  // Print
  'expo-print': 'metro-web-compat/mocks/print',
  
  // Font
  'expo-font': 'metro-web-compat/mocks/font',
  
  // Keep Awake
  'expo-keep-awake': 'metro-web-compat/mocks/keep-awake',
  
  // Screen Orientation
  'expo-screen-orientation': 'metro-web-compat/mocks/screen-orientation',
  
  // Splash Screen
  'expo-splash-screen': 'metro-web-compat/mocks/splash-screen',
  
  // Status Bar
  'expo-status-bar': 'metro-web-compat/mocks/status-bar',
  
  // Background Task
  'expo-background-task': 'metro-web-compat/mocks/background-task',
  
  // Task Manager
  'expo-task-manager': 'metro-web-compat/mocks/task-manager',
  
  // Updates
  'expo-updates': 'metro-web-compat/mocks/updates',
  
  // Facebook
  'expo-facebook': 'metro-web-compat/mocks/facebook',
  
  // Google
  'expo-google-app-auth': 'metro-web-compat/mocks/google-auth',
  
  // Apple Authentication
  'expo-apple-authentication': 'metro-web-compat/mocks/apple-auth',
  
  // Crypto
  'expo-crypto': 'metro-web-compat/mocks/crypto',
  
  // Random
  'expo-random': 'metro-web-compat/mocks/random',
  
  // SQLite
  'expo-sqlite': 'metro-web-compat/mocks/sqlite',
  'react-native-sqlite-storage': 'metro-web-compat/mocks/sqlite',
  
  // Vector Icons
  'react-native-vector-icons': 'metro-web-compat/mocks/vector-icons',
  '@expo/vector-icons': 'metro-web-compat/mocks/vector-icons',
  
  // SVG
  'react-native-svg': 'metro-web-compat/mocks/svg',
  
  // Linear Gradient
  'react-native-linear-gradient': 'metro-web-compat/mocks/linear-gradient',
  'expo-linear-gradient': 'metro-web-compat/mocks/linear-gradient',
  
  // Reanimated
  'react-native-reanimated': 'metro-web-compat/mocks/reanimated',
  
  // Gesture Handler
  'react-native-gesture-handler': 'metro-web-compat/mocks/gesture-handler',
  
  // Safe Area Context
  'react-native-safe-area-context': 'metro-web-compat/mocks/safe-area-context',
  
  // Modal
  'react-native-modal': 'metro-web-compat/mocks/modal',
  
  // Picker
  '@react-native-picker/picker': 'metro-web-compat/mocks/picker',
  '@react-native-community/picker': 'metro-web-compat/mocks/picker',
  
  // Slider
  '@react-native-community/slider': 'metro-web-compat/mocks/slider',
  
  // DateTimePicker
  '@react-native-community/datetimepicker': 'metro-web-compat/mocks/datetimepicker',
  
  // Progress Bar
  '@react-native-community/progress-bar-android': 'metro-web-compat/mocks/progress-bar',
  '@react-native-community/progress-view': 'metro-web-compat/mocks/progress-bar',
  
  // WebView
  'react-native-webview': 'metro-web-compat/mocks/webview',
  
  // Fast Image
  'react-native-fast-image': 'metro-web-compat/mocks/fast-image',
  
  // Masked View
  '@react-native-masked-view/masked-view': 'metro-web-compat/mocks/masked-view',
  '@react-native-community/masked-view': 'metro-web-compat/mocks/masked-view',
  
  // Activity Indicator
  '@react-native-community/activity-indicator': 'metro-web-compat/mocks/activity-indicator',
  
  // Art
  '@react-native-community/art': 'metro-web-compat/mocks/art',
  
  // Blur
  '@react-native-community/blur': 'metro-web-compat/mocks/blur',
  
  // Cameraroll
  '@react-native-community/cameraroll': 'metro-web-compat/mocks/cameraroll',
  
  // Checkbox
  '@react-native-community/checkbox': 'metro-web-compat/mocks/checkbox',
  
  // Hooks
  '@react-native-community/hooks': 'metro-web-compat/mocks/hooks',
  
  // Tab View
  'react-native-tab-view': 'metro-web-compat/mocks/tab-view',
  
  // Pager View
  'react-native-pager-view': 'metro-web-compat/mocks/pager-view',
  
  // Swiper
  'react-native-swiper': 'metro-web-compat/mocks/swiper',
  
  // ActionSheet
  '@expo/react-native-action-sheet': 'metro-web-compat/mocks/action-sheet',
  
  // Bottom Sheet
  '@gorhom/bottom-sheet': 'metro-web-compat/mocks/bottom-sheet',
  
  // Animated
  'react-native-animatable': 'metro-web-compat/mocks/animatable',
  
  // Lottie
  'lottie-react-native': 'metro-web-compat/mocks/lottie',
  
  // Shimmer
  'react-native-shimmer': 'metro-web-compat/mocks/shimmer',
  
  // Skeleton
  'react-native-skeleton-placeholder': 'metro-web-compat/mocks/skeleton',
  
  // Charts
  'react-native-chart-kit': 'metro-web-compat/mocks/chart-kit',
  'react-native-svg-charts': 'metro-web-compat/mocks/svg-charts',
  
  // UI Libraries
  'react-native-elements': 'metro-web-compat/mocks/react-native-elements',
  'react-native-paper': 'metro-web-compat/mocks/react-native-paper',
  'react-native-ui-lib': 'metro-web-compat/mocks/ui-lib',
  'native-base': 'metro-web-compat/mocks/native-base',
  
  // Grid
  'react-native-super-grid': 'metro-web-compat/mocks/super-grid',
  
  // Flipper
  'react-native-flipper': 'metro-web-compat/mocks/flipper',
  
  // CodePush
  'react-native-code-push': 'metro-web-compat/mocks/code-push',
  
  // Crash Analytics
  '@react-native-firebase/crashlytics': 'metro-web-compat/mocks/crashlytics',
  
  // Analytics
  '@react-native-firebase/analytics': 'metro-web-compat/mocks/analytics',
  
  // Remote Config
  '@react-native-firebase/remote-config': 'metro-web-compat/mocks/remote-config',
  
  // Deep Linking
  'react-native-branch': 'metro-web-compat/mocks/branch',
  
  // In-App Purchase
  'react-native-iap': 'metro-web-compat/mocks/iap',
  
  // Admob
  'react-native-google-mobile-ads': 'metro-web-compat/mocks/admob',
  
  // Rate App
  'react-native-rate': 'metro-web-compat/mocks/rate',
  
  // Store Review
  'react-native-store-review': 'metro-web-compat/mocks/store-review',
  
  // App Review
  'expo-store-review': 'metro-web-compat/mocks/store-review',
  
  // Torch
  'react-native-torch': 'metro-web-compat/mocks/torch',
  
  // Flashlight
  'react-native-flashlight': 'metro-web-compat/mocks/flashlight',
  
  // Brightness
  'react-native-brightness': 'metro-web-compat/mocks/brightness',
  
  // Volume
  'react-native-volume-slider': 'metro-web-compat/mocks/volume',
  
  // Battery
  'react-native-battery': 'metro-web-compat/mocks/battery',
  
  // Timezone
  'react-native-localize': 'metro-web-compat/mocks/localize',
  
  // Appearance
  'react-native-appearance': 'metro-web-compat/mocks/appearance',
  
  // Dark Mode
  'react-native-dark-mode': 'metro-web-compat/mocks/dark-mode',
  
  // System Theme
  '@react-native-community/appearance': 'metro-web-compat/mocks/appearance',
  
  // Keyboard
  'react-native-keyboard-aware-scroll-view': 'metro-web-compat/mocks/keyboard-aware-scroll-view',
  
  // Touch ID
  'react-native-touch-id': 'metro-web-compat/mocks/touch-id',
  
  // Face ID
  'react-native-face-id': 'metro-web-compat/mocks/face-id'
};

module.exports = {
  BUILT_IN_MAPPINGS
};