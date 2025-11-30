import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../services/networkInspector'; // Initialize network inspector

const queryClient = new QueryClient();

export default function RootLayout() {
  // TEMPORARILY: Skip font loading entirely to test if this is causing the 500 error
  // On web, always return empty config
  // On native, we'll re-enable font loading once web is working
  const fontConfig = useMemo(() => {
    // For now, skip fonts on all platforms to isolate the bundler error
    return {};
  }, []);

  // Always call useFonts hook (React rules), but pass empty config
  const [fontsLoaded, fontError] = useFonts(fontConfig);

  useEffect(() => {
    if (fontError) {
      console.warn('Font loading error (using system fonts):', fontError);
    }
  }, [fontError]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <Stack>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}





