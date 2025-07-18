import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

export default function WebLayout({ children }) {
  if (Platform.OS !== 'web') {
    return children;
  }

  return (
    <View style={styles.webContainer}>
      <View style={styles.webContent}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 0,
    margin: 0,
  },
  webContent: {
    width: '100%',
    maxWidth: 800,
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    flex: 1,
  },
});