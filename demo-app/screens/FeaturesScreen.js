import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Platform,
  Image,
} from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import * as Brightness from 'expo-brightness';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Notifications from 'expo-notifications';
import { Accelerometer, Gyroscope, Magnetometer } from 'expo-sensors';
import Clipboard from '@react-native-clipboard/clipboard';
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView, useSafeAreaInsets, SafeAreaInsetsContext } from 'react-native-safe-area-context';
import WebLayout from '../components/WebLayout';

export default function FeaturesScreen({ navigation }) {
  const [status, setStatus] = useState('Ready');
  const [logs, setLogs] = useState([]);
  const [capturedImage, setCapturedImage] = useState(null);
  const [sensorData, setSensorData] = useState({
    accelerometer: null,
    gyroscope: null,
    magnetometer: null
  });

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-15), { message, type, timestamp }]);
  };

  const testLocation = async () => {
    setStatus('Testing Location...');
    addLog('📍 Testing REAL GPS location');
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        addLog('✅ Location permission granted', 'success');
        
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
          timeout: 10000,
        });
        
        addLog(`📍 Lat: ${location.coords.latitude.toFixed(6)}`, 'success');
        addLog(`📍 Lng: ${location.coords.longitude.toFixed(6)}`, 'success');
        addLog(`🎯 Accuracy: ${location.coords.accuracy}m`, 'info');
        
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

  const testHaptics = async () => {
    setStatus('Testing Haptics...');
    addLog('📳 Testing REAL haptic feedback patterns');
    
    try {
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
      
      setTimeout(async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        addLog('📳 Success notification feedback', 'success');
      }, 900);
      
    } catch (error) {
      addLog(`💥 Haptics error: ${error.message}`, 'error');
    }
    
    setStatus('Ready');
  };

  const testSensors = async () => {
    setStatus('Testing Sensors...');
    addLog('⚡ Testing REAL device sensors');
    
    try {
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
      
    } catch (error) {
      addLog(`💥 Sensors error: ${error.message}`, 'error');
    }
    
    setStatus('Ready');
  };

  const testBrightness = async () => {
    setStatus('Testing Brightness...');
    addLog('💡 Testing REAL brightness control');
    
    try {
      const currentBrightness = await Brightness.getBrightnessAsync();
      addLog(`💡 Current brightness: ${Math.round(currentBrightness * 100)}%`, 'info');
      
      await Brightness.setBrightnessAsync(Math.min(currentBrightness + 0.2, 1.0));
      addLog('💡 Brightness increased', 'success');
      
      setTimeout(async () => {
        await Brightness.setBrightnessAsync(currentBrightness);
        addLog('💡 Brightness reset', 'success');
      }, 2000);
      
    } catch (error) {
      addLog(`💥 Brightness error: ${error.message}`, 'error');
    }
    
    setStatus('Ready');
  };

  const testOrientation = async () => {
    setStatus('Testing Orientation...');
    addLog('🔄 Testing REAL screen orientation');
    
    try {
      const currentOrientation = await ScreenOrientation.getOrientationAsync();
      addLog(`🔄 Current orientation: ${currentOrientation.orientation}`, 'info');
      
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      addLog('🔄 Locked to landscape', 'success');
      
      setTimeout(async () => {
        await ScreenOrientation.unlockAsync();
        addLog('🔄 Orientation unlocked', 'success');
      }, 3000);
      
    } catch (error) {
      addLog(`💥 Orientation error: ${error.message}`, 'error');
    }
    
    setStatus('Ready');
  };

  const testClipboard = async () => {
    setStatus('Testing Clipboard...');
    addLog('📋 Testing REAL clipboard functionality');
    
    try {
      const testText = `Demo App Test - ${new Date().toLocaleTimeString()}`;
      
      await Clipboard.setString(testText);
      addLog('📋 Text copied to clipboard', 'success');
      
      const clipboardContent = await Clipboard.getString();
      addLog(`📋 Clipboard contains: "${clipboardContent}"`, 'success');
      
      const hasContent = await Clipboard.hasString();
      addLog(`📋 Has clipboard content: ${hasContent}`, 'info');
      
    } catch (error) {
      addLog(`💥 Clipboard error: ${error.message}`, 'error');
    }
    
    setStatus('Ready');
  };

  const testNotifications = async () => {
    setStatus('Testing Notifications...');
    addLog('🔔 Testing REAL push notifications');
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Demo App Test',
          body: 'This is a test notification from the demo app!',
          data: { source: 'demo-app' },
        },
        trigger: { seconds: 2 },
      });
      
      addLog('🔔 Notification scheduled for 2 seconds', 'success');
      
      const { status } = await Notifications.getPermissionsAsync();
      addLog(`🔔 Notification permission: ${status}`, status === 'granted' ? 'success' : 'error');
      
    } catch (error) {
      addLog(`💥 Notifications error: ${error.message}`, 'error');
    }
    
    setStatus('Ready');
  };

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

  const testSafeAreaContext = () => {
    setStatus('Testing Safe Area Context...');
    addLog('🔲 Testing REAL SafeAreaContext functionality');
    
    try {
      const testInsets = useSafeAreaInsets();
      addLog(`🔲 useSafeAreaInsets: ${JSON.stringify(testInsets)}`, 'success');
      addLog('🔲 SafeAreaContext test completed successfully!', 'success');
    } catch (error) {
      addLog(`💥 SafeAreaContext error: ${error.message}`, 'error');
    }
    
    setStatus('Ready');
  };

  return (
    <WebLayout>
      <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Native Features</Text>
      </View>

      {capturedImage && (
        <View style={styles.imageContainer}>
          <Text style={styles.sectionTitle}>Selected Image</Text>
          <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
        </View>
      )}

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

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Status: {status}</Text>
      </View>

      <ScrollView style={styles.buttonsContainer}>
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

        <TouchableOpacity style={styles.button} onPress={testSafeAreaContext}>
          <Text style={styles.buttonText}>🔲 Test REAL SafeAreaContext</Text>
        </TouchableOpacity>
      </ScrollView>

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
      </SafeAreaView>
    </WebLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  imageContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 10,
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
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 10,
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1976d2',
  },
  buttonsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 10,
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
  buttonText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    fontWeight: '600',
  },
  logsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    height: 150,
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
});