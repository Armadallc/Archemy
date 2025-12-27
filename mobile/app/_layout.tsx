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
  // Load fonts for native platforms only
  // For web, fonts are loaded via Google Fonts CDN
  const fontConfig = useMemo(() => {
    if (Platform.OS === 'web') {
      // Web fonts loaded via Google Fonts CDN, not expo-font
      return {};
    }
    // Native platforms: Inter fonts will use system font fallback
    // For native, we rely on system fonts or can add Inter TTF files later if needed
    return {};
  }, []);

  // Always call useFonts hook (React rules)
  const [fontsLoaded, fontError] = useFonts(fontConfig);

  // Load Google Fonts (Inter) from CDN - replacing Nohemi and Space Grotesk
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Check if Google Fonts link is already added
      const existingLink = document.getElementById('google-fonts-inter');
      if (existingLink) return;

      // Load Inter from Google Fonts CDN (all weights)
      const link = document.createElement('link');
      link.id = 'google-fonts-inter';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);

      return () => {
        const linkToRemove = document.getElementById('google-fonts-inter');
        if (linkToRemove) {
          linkToRemove.remove();
        }
      };
    }
  }, []);

  // Also load fonts.css file for PWA (as backup/fallback for Nohemi)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Check if fonts.css link is already added
      const existingLink = document.getElementById('halcyon-fonts-css');
      if (existingLink) return;

      // Use absolute URL with origin for fonts.css (works on all devices)
      const getFontsCssUrl = () => {
        if (typeof window !== 'undefined') {
          // Use origin + absolute path - this works on both desktop and mobile
          return `${window.location.origin}/assets/fonts.css`;
        }
        return '/assets/fonts.css';
      };

      const fontsCssUrl = getFontsCssUrl();

      // Add link to fonts.css file (for Nohemi only)
      const link = document.createElement('link');
      link.id = 'halcyon-fonts-css';
      link.rel = 'stylesheet';
      link.href = fontsCssUrl;
      link.onerror = () => {
        console.warn('fonts.css file not found, using injected styles only');
      };
      document.head.appendChild(link);

      return () => {
        const linkToRemove = document.getElementById('halcyon-fonts-css');
        if (linkToRemove) {
          linkToRemove.remove();
        }
      };
    }
  }, []);

  // Inter fonts are loaded from Google Fonts CDN above
  // No need for local font files, FontFace API, or @font-face declarations
  // System fonts will be used as fallback on native platforms

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





