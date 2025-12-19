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
  // For web, fonts are loaded via CSS @font-face in assets/fonts.css
  const fontConfig = useMemo(() => {
    if (Platform.OS === 'web') {
      // Web fonts loaded via CSS, not expo-font
      return {};
    }
    // Native platforms: load TTF fonts via expo-font
    return {
      'Nohemi-Thin': require('../assets/fonts/Nohemi-Thin.ttf'),
      'Nohemi-ExtraLight': require('../assets/fonts/Nohemi-ExtraLight.ttf'),
      'Nohemi-Light': require('../assets/fonts/Nohemi-Light.ttf'),
      'Nohemi-Regular': require('../assets/fonts/Nohemi-Regular.ttf'),
      'Nohemi-Medium': require('../assets/fonts/Nohemi-Medium.ttf'),
      'Nohemi-SemiBold': require('../assets/fonts/Nohemi-SemiBold.ttf'),
      'Nohemi-Bold': require('../assets/fonts/Nohemi-Bold.ttf'),
      'Nohemi-ExtraBold': require('../assets/fonts/Nohemi-ExtraBold.ttf'),
      'Nohemi-Black': require('../assets/fonts/Nohemi-Black.ttf'),
    };
  }, []);

  // Always call useFonts hook (React rules)
  const [fontsLoaded, fontError] = useFonts(fontConfig);

  // Also load fonts.css file for PWA (as backup/fallback)
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

      // Add link to fonts.css file
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

  // Inject font CSS for web platform
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Check if font styles are already injected
      const existingStyle = document.getElementById('halcyon-fonts');
      if (existingStyle) return;

      // Inject @font-face declarations directly as inline styles
      const style = document.createElement('style');
      style.id = 'halcyon-fonts';
      
      // Use absolute URLs with origin for fonts (works on all devices including mobile)
      const getFontUrl = (fontName: string) => {
        if (typeof window !== 'undefined') {
          // Use full absolute URL with origin - most reliable for PWA on mobile
          return `${window.location.origin}/assets/fonts/${fontName}`;
        }
        return `/assets/fonts/${fontName}`;
      };
      
      // Helper to create font src with multiple fallback paths
      const createFontSrc = (fontName: string) => {
        // Primary: Full absolute URL with origin (works everywhere)
        const absoluteUrl = getFontUrl(fontName);
        // Fallback 1: Absolute path from root (works in most cases)
        const absolutePath = `/assets/fonts/${fontName}`;
        // Fallback 2: Relative path (works if CSS is in same directory structure)
        const relativePath = `./assets/fonts/${fontName}`;
        // Use all three - browser will try each until one works
        return `src: url('${absoluteUrl}') format('woff2'), url('${absolutePath}') format('woff2'), url('${relativePath}') format('woff2');`;
      };
      
      style.textContent = `
        /* Nohemi Font Family */
        @font-face {
          font-family: 'Nohemi';
          ${createFontSrc('Nohemi-Thin.woff2')}
          font-weight: 100;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Nohemi';
          ${createFontSrc('Nohemi-ExtraLight.woff2')}
          font-weight: 200;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Nohemi';
          ${createFontSrc('Nohemi-Light.woff2')}
          font-weight: 300;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Nohemi';
          ${createFontSrc('Nohemi-Regular.woff2')}
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Nohemi';
          ${createFontSrc('Nohemi-Medium.woff2')}
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Nohemi';
          ${createFontSrc('Nohemi-SemiBold.woff2')}
          font-weight: 600;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Nohemi';
          ${createFontSrc('Nohemi-Bold.woff2')}
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Nohemi';
          ${createFontSrc('Nohemi-ExtraBold.woff2')}
          font-weight: 800;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Nohemi';
          ${createFontSrc('Nohemi-Black.woff2')}
          font-weight: 900;
          font-style: normal;
          font-display: swap;
        }
        /* Space Grotesk Font Family */
        @font-face {
          font-family: 'Space Grotesk';
          ${createFontSrc('SpaceGrotesk-Light.woff2')}
          font-weight: 300;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Space Grotesk';
          ${createFontSrc('SpaceGrotesk-Regular.woff2')}
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Space Grotesk';
          ${createFontSrc('SpaceGrotesk-Medium.woff2')}
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Space Grotesk';
          ${createFontSrc('SpaceGrotesk-SemiBold.woff2')}
          font-weight: 600;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Space Grotesk';
          ${createFontSrc('SpaceGrotesk-Bold.woff2')}
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
      `;
      document.head.appendChild(style);

      return () => {
        // Cleanup: remove style when component unmounts
        const styleToRemove = document.getElementById('halcyon-fonts');
        if (styleToRemove) {
          styleToRemove.remove();
        }
      };
    }
  }, []);

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





