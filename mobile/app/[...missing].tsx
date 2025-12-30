import { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * Catch-all route for 404 errors
 * Redirects to appropriate route based on auth status
 */
export default function NotFoundScreen() {
  const { theme } = useTheme();
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    // Debug: Log when catch-all route is triggered
    if (Platform.OS === 'web') {
      console.log('📍 Catch-all route triggered (404)', {
        pathname,
        href: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      });
    }

    // Wait for auth to load
    if (isLoading) return;

    // Redirect based on auth status
    if (!user) {
      // Not authenticated - go to login
      console.log('📍 404: No user, redirecting to login');
      router.replace('/(auth)/login');
    } else {
      // Authenticated - go to dashboard
      console.log('📍 404: User authenticated, redirecting to dashboard');
      router.replace('/(tabs)/dashboard');
    }
  }, [user, isLoading, pathname]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: 20,
    },
    text: {
      ...theme.typography.body,
      color: theme.colors.foreground,
      textAlign: 'center',
      marginBottom: 8,
    },
    pathText: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
      textAlign: 'center',
      marginTop: 16,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Loading...</Text>
      {Platform.OS === 'web' && pathname && (
        <Text style={styles.pathText}>Path: {pathname}</Text>
      )}
    </View>
  );
}

