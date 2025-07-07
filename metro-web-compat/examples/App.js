/**
 * Example App showing cross-platform compatibility
 * 
 * This app uses mobile-specific packages that will be automatically
 * resolved to web-compatible alternatives when running on web.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';

// These imports will be automatically resolved for web compatibility
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Share from 'react-native-share';
import Clipboard from '@react-native-clipboard/clipboard';
import DeviceInfo from 'react-native-device-info';

export default function App() {
  const [deviceInfo, setDeviceInfo] = useState({});
  const [location, setLocation] = useState(null);
  const [storageValue, setStorageValue] = useState('');

  useEffect(() => {
    loadDeviceInfo();
    loadStorageValue();
  }, []);

  const loadDeviceInfo = async () => {
    try {
      const deviceName = await DeviceInfo.getDeviceName();
      const systemName = await DeviceInfo.getSystemName();
      const version = await DeviceInfo.getVersion();
      
      setDeviceInfo({
        deviceName,
        systemName,
        version
      });
    } catch (error) {
      console.error('Failed to load device info:', error);
    }
  };

  const loadStorageValue = async () => {
    try {
      const value = await AsyncStorage.getItem('demo-key');
      setStorageValue(value || 'No value stored');
    } catch (error) {
      console.error('Failed to load storage value:', error);
    }
  };

  const handleSaveToStorage = async () => {
    try {
      const newValue = `Saved at ${new Date().toISOString()}`;
      await AsyncStorage.setItem('demo-key', newValue);
      setStorageValue(newValue);
      Alert.alert('Success', 'Value saved to storage!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save to storage');
    }
  };

  const handleGetLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      setLocation(position.coords);
      Alert.alert('Location', `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    }
  };

  const handleHapticFeedback = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Haptic', 'Haptic feedback triggered!');
    } catch (error) {
      Alert.alert('Error', 'Haptic feedback failed');
    }
  };

  const handleShare = async () => {
    try {
      const shareOptions = {
        title: 'Metro Web Compat Demo',
        message: 'Check out this amazing cross-platform app!',
        url: 'https://github.com/metro-web-compat/metro-web-compat'
      };

      await Share.share(shareOptions);
    } catch (error) {
      Alert.alert('Error', 'Failed to share');
    }
  };

  const handleClipboard = async () => {
    try {
      const textToClip = 'Hello from Metro Web Compat!';
      await Clipboard.setString(textToClip);
      Alert.alert('Copied', 'Text copied to clipboard!');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Metro Web Compat Demo</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Info</Text>
        <Text>Device: {deviceInfo.deviceName}</Text>
        <Text>System: {deviceInfo.systemName}</Text>
        <Text>Version: {deviceInfo.version}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>
        <Text>Value: {storageValue}</Text>
        <Button title="Save to Storage" onPress={handleSaveToStorage} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        {location && (
          <Text>Lat: {location.latitude}, Lng: {location.longitude}</Text>
        )}
        <Button title="Get Location" onPress={handleGetLocation} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <Button title="Haptic Feedback" onPress={handleHapticFeedback} />
        <Button title="Share" onPress={handleShare} />
        <Button title="Copy to Clipboard" onPress={handleClipboard} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});