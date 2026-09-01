import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Colors } from './src/theme';

export default function App() {
  const [ready, setReady] = useState(false);

  // Simulate app initialisation (loading fonts, local DB, etc.)
  useEffect(() => {
    const init = async () => {
      // In production: load fonts, init SQLite, restore session
      await new Promise((r) => setTimeout(r, 500));
      setReady(true);
    };
    init();
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" backgroundColor={Colors.sky900} />
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: {
    flex: 1,
    backgroundColor: Colors.sky900,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
