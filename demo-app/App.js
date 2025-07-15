/**
 * Demo App - React Native with REAL Native Features and Runtime Resolver
 * 
 * This app demonstrates ACTUAL native features that will crash on web
 * without the runtime resolver, and work gracefully with it.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Platform,
  Image,
  Dimensions
} from 'react-native';

// NATIVE DEPENDENCIES - These will cause crashes on web without resolver
import { Camera, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import Share from 'react-native-share';

// Additional native modules
import * as Brightness from 'expo-brightness';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Notifications from 'expo-notifications';
import { Accelerometer, Gyroscope, Magnetometer } from 'expo-sensors';
import Clipboard from '@react-native-clipboard/clipboard';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

export default function App() {
  const [status, setStatus] = useState('Ready');
  const [logs, setLogs] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState({});
  const [cameraPermission, setCameraPermission] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [sensorData, setSensorData] = useState({
    accelerometer: null,
    gyroscope: null,
    magnetometer: null
  });
  const [brightness, setBrightness] = useState(0);
  const [orientation, setOrientation] = useState('portrait');
  
  const cameraRef = useRef(null);

  // Add log entry
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-15), { message, type, timestamp }]);
  };

  // Initialize device info and permissions
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Device info
        const info = {
          platform: Platform.OS,
          brand: await DeviceInfo.getBrand(),
          model: await DeviceInfo.getModel(),
          systemVersion: await DeviceInfo.getSystemVersion(),
          deviceId: await DeviceInfo.getDeviceId(),
          isEmulator: await DeviceInfo.isEmulator(),
          hasNotch: await DeviceInfo.hasNotch(),
          batteryLevel: await DeviceInfo.getBatteryLevel(),
        };
        setDeviceInfo(info);
        addLog(`Device: ${info.brand} ${info.model} (${info.systemVersion})`, 'success');
        
        // Initialize brightness
        const currentBrightness = await Brightness.getBrightnessAsync();
        setBrightness(currentBrightness);
        addLog(`Screen brightness: ${Math.round(currentBrightness * 100)}%`, 'info');
        
        // Initialize orientation
        const currentOrientation = await ScreenOrientation.getOrientationAsync();
        setOrientation(currentOrientation.orientation);
        addLog(`Screen orientation: ${currentOrientation.orientation}`, 'info');
        
        // Request notifications permission
        const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
        addLog(`Notifications permission: ${notificationStatus}`, notificationStatus === 'granted' ? 'success' : 'error');
        
      } catch (error) {
        addLog(`Initialization error: ${error.message}`, 'error');
      }
    };

    initializeApp();
  }, []);

  // Test Camera with real picture taking
  const testCamera = async () => {
    setStatus('Testing Camera...');
    addLog('🔍 Testing REAL camera functionality');
    
    try {
      // Request camera permissions
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(status);
      
      if (status === 'granted') {
        addLog('✅ Camera permission granted', 'success');
        setShowCamera(true);
        addLog('📸 Camera view opened - ready to take pictures', 'success');
      } else {
        addLog('❌ Camera permission denied', 'error');
      }
    } catch (error) {
      addLog(`💥 Camera error: ${error.message}`, 'error');
    }
    
    setStatus('Ready');
  };

  // Take actual picture
  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    try {
      addLog('📸 Taking picture...');
      const photo = await cameraRef.current.takePictureAsync();
      setCapturedImage(photo.uri);
      addLog('✅ Picture captured successfully!', 'success');
      setShowCamera(false);
    } catch (error) {
      addLog(`💥 Picture capture failed: ${error.message}`, 'error');
    }
  };

  // Test Location with high accuracy
  const testLocation = async () => {
    setStatus('Testing Location...');
    addLog('📍 Testing REAL GPS location');
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        addLog('✅ Location permission granted', 'success');
        
        // Get high accuracy location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
          timeout: 10000,
        });
        
        addLog(`📍 Lat: ${location.coords.latitude.toFixed(6)}`, 'success');
        addLog(`📍 Lng: ${location.coords.longitude.toFixed(6)}`, 'success');
        addLog(`🎯 Accuracy: ${location.coords.accuracy}m`, 'info');
        addLog(`⛰️ Altitude: ${location.coords.altitude}m`, 'info');
        addLog(`🧭 Heading: ${location.coords.heading}°`, 'info');
        
        // Get address from coordinates
        const addresses = await Location.reverseGeocodeAsync(location.coords);
        if (addresses.length > 0) {
          const address = addresses[0];
          addLog(`🏠 Address: ${address.street}, ${address.city}`, 'info');
        }
      } else {
        addLog('❌ Location permission denied', 'error');
      }
    } catch (error) {
      addLog(`💥 Location error: ${error.message}`, 'error');
    }
    
    setStatus('Ready');
  };

  // Test Haptics with multiple patterns
  const testHaptics = async () => {
    setStatus('Testing Haptics...');
    addLog('📳 Testing REAL haptic feedback patterns');
    
    try {
      // Test impact feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      addLog('📳 Light impact feedback', 'success');
      
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        addLog('📳 Medium impact feedback', 'success');
      }, 300);
      
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        addLog('📳 Heavy impact feedback', 'success');
      }, 600);
      
      // Test notification feedback
      setTimeout(async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        addLog('📳 Success notification feedback', 'success');
      }, 900);
      
      setTimeout(async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        addLog('📳 Error notification feedback', 'success');
      }, 1200);
      
    } catch (error) {
      addLog(`💥 Haptics error: ${error.message}`, 'error');
    }
    
    setStatus('Ready');
  };

  // Test Sensors (Accelerometer, Gyroscope, Magnetometer)
  const testSensors = async () => {
    setStatus('Testing Sensors...');
    addLog('⚡ Testing REAL device sensors');
    
    try {
      // Test accelerometer
      const accelerometerAvailable = await Accelerometer.isAvailableAsync();
      if (accelerometerAvailable) {
        addLog('✅ Accelerometer available', 'success');
        
        const subscription = Accelerometer.addListener(({ x, y, z }) => {
          setSensorData(prev => ({ ...prev, accelerometer: { x, y, z } }));
        });
        
        Accelerometer.setUpdateInterval(1000);
        
        setTimeout(() => {
          subscription.remove();
          addLog('📊 Accelerometer data collected', 'success');
        }, 3000);
      } else {
        addLog('❌ Accelerometer not available', 'error');
      }
      
      // Test gyroscope
      const gyroscopeAvailable = await Gyroscope.isAvailableAsync();
      if (gyroscopeAvailable) {
        addLog('✅ Gyroscope available', 'success');
        
        const subscription = Gyroscope.addListener(({ x, y, z }) => {
          setSensorData(prev => ({ ...prev, gyroscope: { x, y, z } }));
        });
        
        setTimeout(() => {
          subscription.remove();
          addLog('📊 Gyroscope data collected', 'success');
        }, 3000);
      } else {
        addLog('❌ Gyroscope not available', 'error');
      }
      
      // Test magnetometer
      const magnetometerAvailable = await Magnetometer.isAvailableAsync();
      if (magnetometerAvailable) {
        addLog('✅ Magnetometer available', 'success');
        
        const subscription = Magnetometer.addListener(({ x, y, z }) => {
          setSensorData(prev => ({ ...prev, magnetometer: { x, y, z } }));
        });
        
        setTimeout(() => {
          subscription.remove();
          addLog('📊 Magnetometer data collected', 'success');
        }, 3000);
      } else {
        addLog('❌ Magnetometer not available', 'error');
      }
      
    } catch (error) {
      addLog(`💥 Sensors error: ${error.message}`, 'error');
    }
    
    setStatus('Ready');
  };

  // Test Brightness Control
  const testBrightness = async () => {
    setStatus('Testing Brightness...');
    addLog('💡 Testing REAL brightness control');
    
    try {
      const currentBrightness = await Brightness.getBrightnessAsync();
      addLog(`💡 Current brightness: ${Math.round(currentBrightness * 100)}%`, 'info');
      
      // Increase brightness
      await Brightness.setBrightnessAsync(Math.min(currentBrightness + 0.2, 1.0));
      addLog('💡 Brightness increased', 'success');
      
      setTimeout(async () => {
        // Reset brightness
        await Brightness.setBrightnessAsync(currentBrightness);
        addLog('💡 Brightness reset', 'success');
      }, 2000);
      
    } catch (error) {
      addLog(`💥 Brightness error: ${error.message}`, 'error');
    }
    
    setStatus('Ready');
  };

  // Test Screen Orientation
  const testOrientation = async () => {
    setStatus('Testing Orientation...');
    addLog('🔄 Testing REAL screen orientation');
    
    try {
      const currentOrientation = await ScreenOrientation.getOrientationAsync();
      addLog(`🔄 Current orientation: ${currentOrientation.orientation}`, 'info');
      
      // Lock to landscape
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      addLog('🔄 Locked to landscape', 'success');
      
      setTimeout(async () => {
        // Unlock orientation
        await ScreenOrientation.unlockAsync();
        addLog('🔄 Orientation unlocked', 'success');
      }, 3000);
      
    } catch (error) {
      addLog(`💥 Orientation error: ${error.message}`, 'error');
    }
    
    setStatus('Ready');
  };

  // Test Clipboard
  const testClipboard = async () => {
    setStatus('Testing Clipboard...');
    addLog('📋 Testing REAL clipboard functionality');
    
    try {
      const testText = `Demo App Test - ${new Date().toLocaleTimeString()}`;
      
      // Set clipboard content
      await Clipboard.setString(testText);
      addLog('📋 Text copied to clipboard', 'success');
      
      // Get clipboard content
      const clipboardContent = await Clipboard.getString();
      addLog(`📋 Clipboard contains: "${clipboardContent}"`, 'success');
      
      // Check if clipboard has content
      const hasContent = await Clipboard.hasString();
      addLog(`📋 Has clipboard content: ${hasContent}`, 'info');
      
    } catch (error) {
      addLog(`💥 Clipboard error: ${error.message}`, 'error');
    }
    
    setStatus('Ready');
  };

  // Test Notifications
  const testNotifications = async () => {
    setStatus('Testing Notifications...');
    addLog('🔔 Testing REAL push notifications');
    
    try {
      // Schedule notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Demo App Test',
          body: 'This is a test notification from the demo app!',
          data: { source: 'demo-app' },
        },
        trigger: { seconds: 2 },
      });
      
      addLog('🔔 Notification scheduled for 2 seconds', 'success');
      
      // Get notification permissions
      const { status } = await Notifications.getPermissionsAsync();
      addLog(`🔔 Notification permission: ${status}`, status === 'granted' ? 'success' : 'error');
      
    } catch (error) {
      addLog(`💥 Notifications error: ${error.message}`, 'error');
    }
    
    setStatus('Ready');
  };

  // Test Image Picker
  const testImagePicker = async () => {
    setStatus('Testing Image Picker...');
    addLog('🖼️ Testing REAL image picker');
    
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });
      
      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setCapturedImage(asset.uri);
        addLog('🖼️ Image selected from library', 'success');
        addLog(`📏 Image size: ${asset.width}x${asset.height}`, 'info');
        addLog(`💾 File size: ${Math.round(asset.fileSize / 1024)}KB`, 'info');
      } else {
        addLog('❌ No image selected', 'error');
      }
    } catch (error) {
      addLog(`💥 Image picker error: ${error.message}`, 'error');
    }
    
    setStatus('Ready');
  };

  // Test All Native Features
  const testAllFeatures = async () => {
    setStatus('Testing All Native Features...');
    addLog('🚀 Running comprehensive NATIVE feature test');
    
    const tests = [
      { name: 'Camera', test: testCamera },
      { name: 'Location', test: testLocation },
      { name: 'Haptics', test: testHaptics },
      { name: 'Sensors', test: testSensors },
      { name: 'Brightness', test: testBrightness },
      { name: 'Orientation', test: testOrientation },
      { name: 'Clipboard', test: testClipboard },
      { name: 'Notifications', test: testNotifications },
      { name: 'Image Picker', test: testImagePicker },
    ];
    
    for (const { name, test } of tests) {
      addLog(`🔍 Testing ${name}...`, 'info');
      await test();
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    addLog('🎉 ALL NATIVE FEATURES TESTED!', 'success');
    setStatus('Ready');
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        />
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.cameraButton} onPress={takePicture}>
            <Text style={styles.cameraButtonText}>📸 Take Picture</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cameraButton} onPress={() => setShowCamera(false)}>
            <Text style={styles.cameraButtonText}>❌ Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Native Features Demo</Text>
      <Text style={styles.subtitle}>With Runtime Resolver</Text>
      
      {/* Device Info */}
      <View style={styles.deviceInfo}>
        <Text style={styles.sectionTitle}>Device Information</Text>
        <Text style={styles.infoText}>Platform: {deviceInfo.platform}</Text>
        <Text style={styles.infoText}>Device: {deviceInfo.brand} {deviceInfo.model}</Text>
        <Text style={styles.infoText}>System: {deviceInfo.systemVersion}</Text>
        <Text style={styles.infoText}>Emulator: {deviceInfo.isEmulator ? 'Yes' : 'No'}</Text>
        <Text style={styles.infoText}>Battery: {Math.round((deviceInfo.batteryLevel || 0) * 100)}%</Text>
      </View>

      {/* Captured Image */}
      {capturedImage && (
        <View style={styles.imageContainer}>
          <Text style={styles.sectionTitle}>Captured Image</Text>
          <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
        </View>
      )}

      {/* Sensor Data */}
      {sensorData.accelerometer && (
        <View style={styles.sensorContainer}>
          <Text style={styles.sectionTitle}>Live Sensor Data</Text>
          <Text style={styles.sensorText}>
            Accelerometer: X:{sensorData.accelerometer.x.toFixed(2)}, 
            Y:{sensorData.accelerometer.y.toFixed(2)}, 
            Z:{sensorData.accelerometer.z.toFixed(2)}
          </Text>
        </View>
      )}

      {/* Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Status: {status}</Text>
      </View>

      {/* Test Buttons */}
      <ScrollView style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={testCamera}>
          <Text style={styles.buttonText}>📸 Test REAL Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testLocation}>
          <Text style={styles.buttonText}>📍 Test REAL GPS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testHaptics}>
          <Text style={styles.buttonText}>📳 Test REAL Haptics</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testSensors}>
          <Text style={styles.buttonText}>⚡ Test REAL Sensors</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testBrightness}>
          <Text style={styles.buttonText}>💡 Test REAL Brightness</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testOrientation}>
          <Text style={styles.buttonText}>🔄 Test REAL Orientation</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testClipboard}>
          <Text style={styles.buttonText}>📋 Test REAL Clipboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testNotifications}>
          <Text style={styles.buttonText}>🔔 Test REAL Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testImagePicker}>
          <Text style={styles.buttonText}>🖼️ Test REAL Image Picker</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={testAllFeatures}>
          <Text style={[styles.buttonText, styles.primaryButtonText]}>🚀 Test ALL Native Features</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Activity Log */}
      <View style={styles.logsContainer}>
        <Text style={styles.sectionTitle}>Native API Activity Log</Text>
        <ScrollView style={styles.logsScroll} showsVerticalScrollIndicator={false}>
          {logs.map((log, index) => (
            <View key={index} style={styles.logEntry}>
              <Text style={styles.logTime}>{log.timestamp}</Text>
              <Text style={[
                styles.logMessage, 
                log.type === 'error' && styles.logError,
                log.type === 'success' && styles.logSuccess
              ]}>
                {log.message}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  deviceInfo: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  capturedImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginTop: 10,
  },
  sensorContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sensorText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statusContainer: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1976d2',
  },
  buttonsContainer: {
    flex: 1,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#ff5722',
    marginTop: 10,
  },
  buttonText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#fff',
  },
  logsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    height: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logsScroll: {
    flex: 1,
  },
  logEntry: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  logTime: {
    fontSize: 11,
    color: '#999',
    width: 70,
  },
  logMessage: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  logError: {
    color: '#f44336',
  },
  logSuccess: {
    color: '#4caf50',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 50,
  },
  cameraButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    minWidth: 120,
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
});