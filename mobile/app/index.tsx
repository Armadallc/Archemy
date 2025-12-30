import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { router } from 'expo-router';
import WelcomeScreen from '../components/WelcomeScreen';

const WELCOME_SHOWN_KEY = 'halcyon-welcome-shown';

// Storage helper - use localStorage on web, sessionStorage for session-based check
const getWelcomeShown = (): boolean => {
  if (Platform.OS === 'web') {
    return sessionStorage.getItem(WELCOME_SHOWN_KEY) === 'true';
  }
  // For native, we'll use a simple in-memory check for now
  // In production, you might want to use AsyncStorage or SecureStore
  return false;
};

const setWelcomeShown = (): void => {
  if (Platform.OS === 'web') {
    sessionStorage.setItem(WELCOME_SHOWN_KEY, 'true');
  }
};

export default function Index() {
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);

  // Debug: Log when component mounts (helps diagnose PWA launch issues)
  useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('📍 Index route loaded', {
        pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        href: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      });
    }
  }, []);

  // Check if welcome has been shown and handle navigation
  useEffect(() => {
    if (isLoading) {
      return;
    }

    // If user is not authenticated, go to login (don't show welcome)
    if (!user) {
      setShowWelcome(false); // Set to false to prevent loading loop
      console.log('📍 No user, redirecting to login');
      router.replace('/(auth)/login');
      return;
    }

    // If user is authenticated, check welcome status
    const shown = getWelcomeShown();
    if (!shown) {
      console.log('📍 Welcome not shown, showing welcome screen');
      setShowWelcome(true);
    } else {
      // Welcome already shown, go to dashboard
      setShowWelcome(false); // Set to false to prevent loading loop
      console.log('📍 Welcome shown, redirecting to dashboard');
      router.replace('/(tabs)/dashboard');
    }
  }, [user, isLoading]);

  // Handle welcome completion
  const handleWelcomeComplete = () => {
    setWelcomeShown();
    setShowWelcome(false);
    
    if (user) {
      router.replace('/(tabs)/dashboard');
    } else {
      router.replace('/(auth)/login');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    text: {
      marginTop: 16,
      ...theme.typography.body,
      color: theme.colors.mutedForeground,
    },
  });

  // Show loading while checking auth status
  if (isLoading || showWelcome === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  // Show welcome screen if user is authenticated and welcome hasn't been shown
  if (showWelcome && user) {
    return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }

  // Default: show loading (navigation should happen via useEffect)
  // This should only show briefly while navigation happens
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

