import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image,
  Alert,
  Platform
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebLayout from '../components/WebLayout';

export default function CameraScreen({ navigation }) {
  const [cameraPermission, setCameraPermission] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [logs, setLogs] = useState([]);
  
  const cameraRef = useRef(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-10), { message, type, timestamp }]);
  };

  const requestCameraPermission = async () => {
    addLog('🔍 Requesting camera permission');
    
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(status);
      
      if (status === 'granted') {
        addLog('✅ Camera permission granted', 'success');
        setShowCamera(true);
        addLog('📸 Camera view opened - ready to take pictures', 'success');
      } else {
        addLog('❌ Camera permission denied', 'error');
        Alert.alert('Permission Denied', 'Camera access is required to take photos.');
      }
    } catch (error) {
      addLog(`💥 Camera permission error: ${error.message}`, 'error');
    }
  };

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

  const retakePicture = () => {
    setCapturedImage(null);
    setShowCamera(true);
    addLog('📸 Camera view opened for retake', 'info');
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
    <WebLayout>
      <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Camera Demo</Text>
      </View>

      <View style={styles.content}>
        {capturedImage ? (
          <View style={styles.imageContainer}>
            <Text style={styles.sectionTitle}>Captured Photo</Text>
            <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
            <TouchableOpacity style={styles.retakeButton} onPress={retakePicture}>
              <Text style={styles.retakeButtonText}>📸 Take Another Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>📸</Text>
            <Text style={styles.placeholderText}>No photo captured yet</Text>
            <Text style={styles.placeholderSubtext}>Tap the button below to take a photo</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cameraButton} onPress={requestCameraPermission}>
            <Text style={styles.cameraButtonText}>📸 Open Camera</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.permissionInfo}>
          <Text style={styles.permissionTitle}>Camera Permission Status</Text>
          <Text style={[
            styles.permissionText,
            cameraPermission === 'granted' && styles.permissionGranted,
            cameraPermission === 'denied' && styles.permissionDenied
          ]}>
            {cameraPermission === null ? 'Not requested' : 
             cameraPermission === 'granted' ? '✅ Granted' : 
             '❌ Denied'}
          </Text>
        </View>

        {logs.length > 0 && (
          <View style={styles.logsContainer}>
            <Text style={styles.sectionTitle}>Camera Activity Log</Text>
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
          </View>
        )}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  imageContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  capturedImage: {
    width: 280,
    height: 210,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 15,
  },
  retakeButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 10,
    minWidth: 150,
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  placeholderContainer: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  cameraButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cameraButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  permissionInfo: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#666',
  },
  permissionGranted: {
    color: '#4caf50',
  },
  permissionDenied: {
    color: '#f44336',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  logsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
});