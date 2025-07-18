import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  Platform
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import * as Brightness from 'expo-brightness';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebLayout from '../components/WebLayout';

export default function HomeScreen({ navigation }) {
  const [deviceInfo, setDeviceInfo] = useState({});
  const [brightness, setBrightness] = useState(0);
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const initializeInfo = async () => {
      try {
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
        
        const currentBrightness = await Brightness.getBrightnessAsync();
        setBrightness(currentBrightness);
        
        const currentOrientation = await ScreenOrientation.getOrientationAsync();
        setOrientation(currentOrientation.orientation);
      } catch (error) {
        console.warn('Error initializing device info:', error);
      }
    };

    initializeInfo();
  }, []);

  return (
    <WebLayout>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Native Features Demo</Text>
          <Text style={styles.subtitle}>With Runtime Resolver</Text>
        </View>

        <View style={styles.deviceInfo}>
          <Text style={styles.sectionTitle}>Device Information</Text>
          <Text style={styles.infoText}>Platform: {deviceInfo.platform}</Text>
          <Text style={styles.infoText}>Device: {deviceInfo.brand} {deviceInfo.model}</Text>
          <Text style={styles.infoText}>System: {deviceInfo.systemVersion}</Text>
          <Text style={styles.infoText}>Emulator: {deviceInfo.isEmulator ? 'Yes' : 'No'}</Text>
          <Text style={styles.infoText}>Battery: {Math.round((deviceInfo.batteryLevel || 0) * 100)}%</Text>
          <Text style={styles.infoText}>Brightness: {Math.round(brightness * 100)}%</Text>
          <Text style={styles.infoText}>Orientation: {orientation}</Text>
        </View>

        <View style={styles.navigationButtons}>
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => navigation.navigate('Features')}
          >
            <Text style={styles.navButtonText}>🚀 Test Native Features</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => navigation.navigate('Camera')}
          >
            <Text style={styles.navButtonText}>📸 Camera Demo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Runtime Resolver</Text>
          <Text style={styles.cardText}>
            This demo app uses the runtime resolver to gracefully handle native modules 
            that aren't available on web platforms. All native features work on mobile 
            and provide fallbacks on web.
          </Text>
        </View>
        </ScrollView>
      </SafeAreaView>
    </WebLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  deviceInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  navigationButtons: {
    marginBottom: 20,
  },
  navButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
});