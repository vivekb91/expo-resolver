/**
 * Demo App - React Native with REAL Native Features and Runtime Resolver
 * 
 * This app demonstrates ACTUAL native features that will crash on web
 * without the runtime resolver, and work gracefully with it.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, StyleSheet, View } from 'react-native';

// Import screens
import HomeScreen from './screens/HomeScreen';
import FeaturesScreen from './screens/FeaturesScreen';
import CameraScreen from './screens/CameraScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const AppContent = () => (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Features" component={FeaturesScreen} />
          <Stack.Screen name="Camera" component={CameraScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <AppContent />
      </View>
    );
  }

  return <AppContent />;
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    width: '100vw',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
});

